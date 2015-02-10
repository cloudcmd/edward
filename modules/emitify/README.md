# Emitify

Dead simple event emitter.

## Install

```
npm i emitify --save
bower i emitify --save
```

## How to use?

```js
var Emitify = require('emitify'),
    emitter = new Emitify(),
    log     = function(data) {
        console.log(data);
    });

emitter.on('data', log);

emitter.emit('data', 'hello');
// result
'hello'

emitter.off('data', log);

```

## License

MIT
