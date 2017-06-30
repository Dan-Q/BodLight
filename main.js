'use strict';

const {app, BrowserWindow} = require('electron');
const path = require('path');
const url = require('url');
const settings = require('electron-settings');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({width: 1800, height: 900, show: false, icon: 'icon.ico', webPreferences: { experimentalFeatures: true }, blinkFeatures: 'CSSGridLayout'});

  // and load the index.html of the app.
  win.loadURL(url.format({
    pathname: path.join(__dirname, 'pages/start.html'),
    protocol: 'file:',
    slashes: true
  }));
  win.setMenu(null);

  // show window once initial load complete
  win.once('ready-to-show', win.show)

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });
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
