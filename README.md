Edward [![License][LicenseIMGURL]][LicenseURL] [![NPM version][NPMIMGURL]][NPMURL] [![Dependency Status][DependencyStatusIMGURL]][DependencyStatusURL]
=======
[NPMIMGURL]:                https://img.shields.io/npm/v/edward.svg?style=flat
[BuildStatusIMGURL]:        https://img.shields.io/travis/cloudcmd/edward/master.svg?style=flat
[DependencyStatusIMGURL]:   https://img.shields.io/gemnasium/cloudcmd/edward.svg?style=flat
[LicenseIMGURL]:            https://img.shields.io/badge/license-MIT-317BF9.svg?style=flat
[NPM_INFO_IMG]:             https://nodei.co/npm/edward.png
[NPMURL]:                   https://npmjs.org/package/edward "npm"
[DependencyStatusURL]:      https://gemnasium.com/cloudcmd/edward "Dependency Status"
[LicenseURL]:               https://tldrlegal.com/license/mit-license "MIT License"

Web editor used in [Cloud Commander](http://cloudcmd.io).

## Install

`npm i edward`

## API
Edward could be used as middleware for [express](http://expressjs.com "Express").
For this purpuse API could be used.

### Server

#### edward(options)
Middleware of `edward`. Options could be omitted.

```js
var express = require('express'),
    app     = express();

app.use(edward({
    minify  : false, /* default */
    online  : false, /* default */
    diff    : true,  /* default */
    zip     : true   /* default */
}));

app.listen(31337);
```

#### edward.listen(socket)
Could be used with [socket.io](http://socket.io "Socket.io") to handle editor events with.

```js
var io      = require('socket.io'),
    socket  = io.listen(server);

edward.listen(socket);
```

### Client

## License

MIT
