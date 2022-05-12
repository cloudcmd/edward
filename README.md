# Edward [![License][LicenseIMGURL]][LicenseURL] [![NPM version][NPMIMGURL]][NPMURL]

[NPMIMGURL]: https://img.shields.io/npm/v/edward.svg?style=flat
[BuildStatusURL]: https://github.com/cloudcmd/edward/actions?query=workflow%3A%22Node+CI%22 "Build Status"
[BuildStatusIMGURL]: https://github.com/cloudcmd/edward/workflows/Node%20CI/badge.svg
[LicenseIMGURL]: https://img.shields.io/badge/license-MIT-317BF9.svg?style=flat
[NPM_INFO_IMG]: https://nodei.co/npm/edward.png?downloads=true&&stars&&downloadRank "npm install edward"
[NPMURL]: https://npmjs.org/package/edward "npm"
[LicenseURL]: https://tldrlegal.com/license/mit-license "MIT License"
[edit.json]: https://github.com/cloudcmd/edward/tree/master/json/edit.json "edit.json"

Web editor used in [Cloud Commander](http://cloudcmd.io) based on [Ace](http://ace.c9.io "Ace").

![Edward](https://raw.githubusercontent.com/cloudcmd/edward/master/img/edward.png "Edward")

## Features

- Syntax highlighting based on extension of file for over 110 languages.
- Built-in `emmet` (for html files)
- Drag n drop (drag file from desktop to editor).
- Configurable options ([json/edit.json][edit.json] could be overriden by `~/.edward.json`)

## Install

```
npm i edward -g
```

![NPM\_INFO][NPM_INFO_IMG]

## Command line parameters

Usage: `edward [filename]`

|Parameter              |Operation
|:----------------------|:--------------------------------------------
| `-h, --help`          | display help and exit
| `-v, --version`       | output version information and exit

## Hot keys

|Key                    |Operation
|:----------------------|:--------------------------------------------
| `Ctrl + s`            | save
| `Ctrl + f`            | find
| `Ctrl + h`            | replace
| `Ctrl + g`            | go to line
| `Ctrl + e`            | evaluate (JavaScript only supported)

For more details see [Ace keyboard shortcuts](https://github.com/ajaxorg/ace/wiki/Default-Keyboard-Shortcuts "Ace keyboard shortcuts").

## API

Edward could be used as middleware for [express](http://expressjs.com "Express").
For this purpuse API could be used.

### Server

#### edward(options)

Middleware of `edward`. Options could be omitted.

```js
const edward = require('edward');
const express = require('express');
const app = express();

app.use(edward({
    root: '/', // default
    online: true, // default
    diff: true, // default
    zip: true, // default
    dropbox: false, // optional
    dropboxToken: 'token', // optional
}));

app.listen(31_337);
```

#### edward.listen(socket)

Could be used with [socket.io](http://socket.io "Socket.io") to handle editor events with.

```js
const io = require('socket.io');
const socket = io.listen(server);

edward.listen(socket, {
    root: '/', // optional
    prefixSocket: '/edward', //optional
    auth: (accept, reject) => (username, password) => {
        accept();
    },
});
```

### Client

Edward uses [ace](http://ace.c9.io/ "Ace") on client side, so API is similar.
All you need is put minimal `html`, `css`, and `js` into your page.

Minimal html:

```html
<div class="edit" data-name="js-edit"></div>
<script src="/edward/edward.js"></script>
```

Minimal css:

```css
html, body, .edit {
    height: 100%;
    margin: 0;
}
```

Minimal js:

```js
edward('[data-name="js-edit"]', (editor) => {
    editor.setValue('Hello edward!');
});
```

For more information you could always look around into `assets` and `bin` directory.

## Related

- [Dword](https://github.com/cloudcmd/dword "Dword") - web editor based on [Codemirror](https://codemirror.net "Codemirror").
- [Deepword](https://github.com/cloudcmd/deepword "Deepword") - web editor based on [Monaco](https://microsoft.github.io/monaco-editor/ "Monaco").

## License

MIT
