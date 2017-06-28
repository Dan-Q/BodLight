const electron = require('electron');
const currentWindow = electron.remote.getCurrentWindow();
const settings = require('electron-settings');
const fs = require('fs');
const Vue = require('../node_modules/vue/dist/vue.min');
const Guid = require('guid');

// Default to not-full-screen; made full-screen when needed:
currentWindow.setFullScreen(false);

/********************************************************************************
 * Firebase Utility                                                             *
 ********************************************************************************/

const db = firebase.database();
// Attempts to authenticate against Firebase. Returns a promise.
firebaseAuth = ()=>{
  return firebase.auth().signInWithEmailAndPassword(settings.get('settings.username', ''), settings.get('settings.password', ''));
}

/********************************************************************************
 * Screen Mode                                                                  *
 ********************************************************************************/

let identity;
let screenData, screenDisplayData, screenDisplayTemplateName;
let vueApp, vueData = { screenData: null, screenDisplayData: null };

// Updates the current Screen's 'lastSeen' and 'resolution'. Run periodically.
updateScreenLastSeenAt = ()=>{
  db.ref(`screens/${identity}`).update({
    lastSeen: firebase.database.ServerValue.TIMESTAMP,
    resolution: {
      height: window.innerHeight,
      width: window.innerWidth
    }
  });
}

// Called with a Firebase Database snapshot when a Screen's Display data changes.
updateScreenDisplay = (snapshot)=>{
  screenDisplayData = snapshot.val();
  vueData.screenDisplayData = screenDisplayData;
  if((screenDisplayData === null) || typeof(screenDisplayData['template']) === 'undefined') return;
  if(screenDisplayTemplateName !== screenDisplayData['template']){
    // template has changed - re-render
    let wrapperId = Guid.raw();
    let template = fs.readFileSync(`templates/${screenDisplayData['template']}/template.html`, { encoding: 'utf-8' });
    $('body').html(`<div class="vue-app" id="app-${wrapperId}">${template}</div>`);
    // connect Vue
    vueApp = new Vue({
      el: `#app-${wrapperId}`,
      data: vueData
    });
  }
}

// Called with a Firebase Database snapshot when Screen data changes.
updateScreen = (snapshot)=>{
  let newScreenData = snapshot.val();
  // check for change of display
  if((typeof(screenData) === 'undefined') || (newScreenData['display'] !== screenData['display'])){
    // stop listening to old events and start listening to new ones
    if(typeof(screenData) !== 'undefined'){
      db.ref(`displays/${screenData['display']}`).off('value', updateScreenDisplay);
    }
    if((typeof(newScreenData['display']) !== 'undefined') && newScreenData['display'] !== ''){
      db.ref(`displays/${newScreenData['display']}`).on('value', updateScreenDisplay);
    }
  }
  vueData.screenData = screenData = newScreenData;
}

// Launches a Screen based on the settings.
launchScreen = ()=>{
  $('body').attr('class', 'screen').html('');
  // Get identity
  identity = settings.get('settings.screen-identity', '');
  if(identity == '') return errorScreen('No identity found.');
  // Get firebase database connection
  firebaseAuth().catch((error) => {
    firebase.auth().signOut(); // force signout to ensure any old sessions are killed
    errorScreen('Invalid username/password.')
  }).then(()=>{
    let user = firebase.auth().currentUser;
    if(user === null) return errorScreen('Invalid username/password.');
    // set up last-seen-at updater
    updateScreenLastSeenAt();
    setInterval(updateScreenLastSeenAt, 30000); // 30 seconds
    // Fullscreenify and remove not-for-screens CSS
    $('.not-for-screens').remove();
    currentWindow.setFullScreen(true);
    // Watch for changes...
    db.ref(`screens/${identity}`).on('value', updateScreen);
  });
}

// Shows a specified error message on the Screen
errorScreen = (msg)=>{
  $('body').attr('class', 'error screen').html(`
    <h1>Error</h1>
    <p>${msg}</p>
    <p><button class="bodlight-restart">Restart</button> (automatically restarts after 30 seconds)</p>
  `);
  $('.bodlight-restart').on('click touchend', ()=>{
    window.location.href = 'start.html';
    return false;
  });
  setTimeout(()=> { $('.bodlight-restart').click() }, 30000);
}

/********************************************************************************
 * Start Page                                                                   *
 ********************************************************************************/
if($('body').hasClass('start-page')){
  // Load any saved settings, save settings in real-time
  $('input').each(function(){
    if($(this).is(':checkbox')){
      $(this).prop('checked', settings.get(`settings.${$(this).attr('id')}`, ''));
    } else {
      $(this).val(settings.get(`settings.${$(this).attr('id')}`, false));
    }
  }).on('change click', function(){
    if($(this).is(':checkbox')){
      settings.set(`settings.${$(this).attr('id')}`, $(this).prop('checked'));
    } else {
      settings.set(`settings.${$(this).attr('id')}`, $(this).val());
    }
  });

  // If set to auto launch as a screen, do so in 3 seconds (if not unchecked)
  if($('#auto-launch-screen').is(':checked')){
    setTimeout(()=>{
      if($('#auto-launch-screen').is(':checked')){
        $('.screen-login').click();
      }
    }, 3000);
  }

  // Handle button clicks
  $('.editor-login').on('click touchend', ()=>{
    // TODO
    alert('editor login');
    return false;
  });
  $('.screen-login').on('click touchend', ()=>{
    launchScreen();
    return false;
  });
}

/********************************************************************************
 * Editor Mode                                                                  *
 ********************************************************************************/