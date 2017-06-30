const electron = require('electron');
const currentWindow = electron.remote.getCurrentWindow();
const settings = require('electron-settings');
const fs = require('fs');
const path = require('path');
const mime = require('mime');
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
let vueApp, vueScreenData = { screenData: null, screenDisplayData: null };

// Updates the current Screen's 'lastSeen' and 'resolution'. Run periodically.
updateScreenLastSeenAt = ()=>{
  db.ref(`screens/${identity}`).update({
    lastSeen: firebase.database.ServerValue.TIMESTAMP,
    resolution: {
      height: window.innerHeight,
      width: window.innerWidth
    },
    version: electron.remote.app.getVersion()
  });
}

// Called with a Firebase Database snapshot when a Screen's Display data changes.
updateScreenDisplay = (snapshot)=>{
  screenDisplayData = snapshot.val();
  vueScreenData.screenDisplayData = screenDisplayData;
  if((screenDisplayData === null) || typeof(screenDisplayData['template']) === 'undefined') return;
  if(screenDisplayTemplateName !== screenDisplayData['template']){
    // template has changed - re-render
    let wrapperId = Guid.raw();
    let template = fs.readFileSync(`templates/${screenDisplayData['template']}/template.html`, { encoding: 'utf-8' });
    $('body').html(`<div class="vue-app" id="app-${wrapperId}">${template}</div>`);
    // connect Vue
    vueApp = new Vue({
      el: `#app-${wrapperId}`,
      data: vueScreenData
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
  $('body').toggle((typeof(newScreenData['display']) !== 'undefined') && (newScreenData['display'] !== '')); // hide screen contents if no display defined
  vueScreenData.screenData = screenData = newScreenData;
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
    // fix title
    document.title = `BodLight | ${identity} | v${electron.remote.app.getVersion()}`;
    // set up last-seen-at updater
    setTimeout(updateScreenLastSeenAt, 2000); // 2 seconds - an 'early' re-hit to make sure the resolution is set correctly even if fullscreenifying is slow
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
 * Tab Groups                                                                   *
 ********************************************************************************/

$('body').on('click touchend', '.tab-item', function(){
  $(this).closest('.tab-group').find('.tab-item').removeClass('active');
  $(this).addClass('active');
  let area = $(`#${$(this).data('tab-area-id')}`);
  area.closest('.tab-area').find('.tab-area-section').removeClass('active');
  area.addClass('active');
});
$('.tab-group .tab-item:first').click();

/********************************************************************************
 * Start Page                                                                   *
 ********************************************************************************/

if($('body').hasClass('start-page')){
  // Load any saved settings, save settings in real-time
  $('input').each(function(){
    if($(this).is(':checkbox')){
      $(this).prop('checked', settings.get(`settings.${$(this).attr('id')}`, false));
    } else {
      $(this).val(settings.get(`settings.${$(this).attr('id')}`, ''));
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
    window.location.href = 'editor.html';
    return false;
  });
  $('.screen-login').on('click touchend', ()=>{
    launchScreen();
    return false;
  });
  $('.dev-tools').on('click touchend', ()=>{
    currentWindow.webContents.openDevTools();
    return false;
  });
}

/********************************************************************************
 * Editor Mode                                                                  *
 ********************************************************************************/

let vueEditorData = { screens: {}, displays: {}, mediaItems: {}, serverTime: 0,
                      selectedScreen: null, selectedDisplay: null, selectedMediaItem: null
                    };
let serverTimeOffset = 0;
let templates = {};

setServerTimeOffset = ()=>{
  db.ref("/.info/serverTimeOffset").on('value', function(offset) {
    serverTimeOffset = offset.val() || 0;
  });
}

serverTime = ()=>{
  return Date.now() + serverTimeOffset;
}

loadTemplates = ()=>{
  templates = {};
  fs.readdirSync('templates').forEach((template)=> {
    templates[template] = {
      form: fs.readFileSync(`templates/${template}/form.html`, { encoding: 'utf-8' }),
      formJs: fs.readFileSync(`templates/${template}/form.js`, { encoding: 'utf-8' }),
    }
  })
}

if($('body').hasClass('editor-page')){
  // connect Firebase
  firebaseAuth().catch((error) => {
    firebase.auth().signOut(); // force signout to ensure any old sessions are killed
    window.location.href = 'start.html';
  }).then(()=>{
    let user = firebase.auth().currentUser;
    if(user === null) return (window.location.href = 'start.html');
    // fix title
    document.title = `BodLight | Editor | v${electron.remote.app.getVersion()}`;
    // preload templates
    loadTemplates();
    // monitor Firebase database
    db.ref('/').on('value', (snapshot)=>{
      let data = snapshot.val();
      vueEditorData.screens = data.screens || {};
      vueEditorData.displays = data.displays || {};
      vueEditorData.mediaItems = data.media || {};
      vueEditorData.serverTime = serverTime();
    });
    // watch the clock
    setInterval(()=>{
      vueEditorData.serverTime = serverTime();
    }, 1000);
    // allow clicking on screens/displays tables
    $('body').on('click touchend', '#screens-table tr', function(){
      vueEditorData.selectedScreen = $(this).find('td:first').text().trim();
      $('#selected-screen [data-field-id]').each(function(){
        $(this).val(vueEditorData.screens[vueEditorData.selectedScreen][$(this).data('field-id')]);
      });
    });
    $('body').on('click touchend', '#displays-table tr', function(){
      vueEditorData.selectedDisplay = $(this).find('td:first').text().trim();
      let display = vueEditorData.displays[vueEditorData.selectedDisplay];
      let template = templates[display.template];
      $('#selected-display-form').html(template.form).data('return-json', null);
      eval(template.formJs);
    });
    // allow saving edited screens
    $('body').on('click touchend', '#selected-screen .save', function(){
      let params = {};
      $('#selected-screen [data-field-id]').each(function(){ params[$(this).data('field-id')] = $(this).val(); });
      db.ref(`screens/${vueEditorData.selectedScreen}`).update(params);
    });
    // allow saving edited displays
    $('body').on('click touchend', '#selected-display .save', function(){
      db.ref(`displays/${vueEditorData.selectedDisplay}`).update($('#selected-display-form').data('return-json'));
    });
    // allow adding new media items
    $('body').on('click touchend', '#add-media', ()=>{
      electron.remote.dialog.showOpenDialog({title: 'Select media files', buttonLabel: 'Upload', properties: ['openFile', 'multiSelections']}, (files)=>{
        files.forEach((file)=>{
          let shortName = path.basename(file); // TODO: use path.posix.basename on POSIX-compliant OSes? [TESTME]
          let ref = storage.ref(`/media/${shortName}`);
          let data = fs.readFileSync(file);
          ref.put(data, { contentType: mime.lookup(file) }).then((snapshot)=>{
            console.log(snapshot);
            db.ref('/media').push({
              name: snapshot.metadata.name,
              url: snapshot.metadata.downloadURLs[0],
              contentType: snapshot.metadata.contentType
            });
          });
        })
      });
      return false;
    })
    // connect Vue
    vueApp = new Vue({
      el: '#editor',
      data: vueEditorData
    });
  });
}
