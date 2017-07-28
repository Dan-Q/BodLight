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

// Sanity-checks
let sanityCheckPassed = false;
let startPage = 'pages/start.html';
fs.access(path.join(__dirname, 'js/firebase.js'), (err)=>{
  if(!err) { sanityCheckPassed = true; return; }
  // Show a warning about what went wrong
  startPage = 'pages/no-firebase-config.html';
});

function createWindow() {
  // Create the browser window.
  const width = (sanityCheckPassed ? 1800 : 400);
  const height = (sanityCheckPassed ? 900 : 300);
  win = new BrowserWindow({width: width, height: height, show: false, icon: 'icon.ico', webPreferences: { experimentalFeatures: true }, blinkFeatures: 'CSSGridLayout'});

  // and load the index.html of the app.
  win.loadURL(url.format({
    pathname: path.join(__dirname, startPage),
    protocol: 'file:',
    slashes: true
  }));
  win.setMenu(null);

  // show window once initial load complete
  win.once('ready-to-show', win.show);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  app.quit(); // even on MacOS, we kill the app when the last window is closed
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
