'use strict';

const {app, BrowserWindow} = require('electron');
const path = require('path');
const url = require('url');
const settings = require('electron-settings');
const fs = require('fs');

// Debug (in development mode)
const electronDebug = require('electron-debug');
electronDebug();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

function createWindow(sanityCheckResult, pageToLoad) {
  // Create the browser window.
  const width = (sanityCheckResult ? 1800 : 400);
  const height = (sanityCheckResult ? 900 : 300);
  win = new BrowserWindow({width: width, height: height, show: true, icon: 'icon.ico', webPreferences: { experimentalFeatures: true }, blinkFeatures: 'CSSGridLayout'});

  // and load the index.html of the app.
  win.loadURL(url.format({
    pathname: path.join(__dirname, pageToLoad),
    protocol: 'file:',
    slashes: true
  }));
  win.setMenu(null);

  // show window once initial load complete
  win.once('ready-to-show', win.show);
}

// Sanity-checks
fs.access('js/firebase.js', (err)=>{
  let nextStep;
  if(!err) {
    console.log('sanity checks passed');
    nextStep = ()=>{ createWindow(true, 'pages/start.html') };
  } else {
    console.error('js/firebase.js missing');
    nextStep = ()=>{ createWindow(false, 'pages/no-firebase-config.html') };
  }
  if(app.isReady()) { nextStep(); } else { app.on('ready', nextStep); };
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  app.quit(); // even on MacOS, we kill the app when the last window is closed
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
