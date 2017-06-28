# BodLight

Experimental digital signage powered by Electron and Firebase. Not even remotely for production use.

## Getting started

1. Create a Firebase database protected by email/password credentials and at least one user. Lock read/write access to authorised users.
2. cp js/firebase.js.sample js/firebase.js
3. Edit js/firebase.js with your database settings.
4. npm install
5. npm start (or electron .)

## Building binaries

To build for all platforms for which your platform is capable:

    npm run build
