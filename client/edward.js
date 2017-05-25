/* global smalltalk */
/* global ace */
/* global exec */
/* global load */
/* global io */
/* global join */
/* global daffy */
/* global restafary */
/* global Emitify */
/* global loadRemote */

'use strict';

const Story = require('./story');
const _clipboard = require('./_clipboard');
const save = require('./save');

module.exports = (el, options, callback) => {
    Edward(el, options, callback);
}

function Edward(el, options, callback) {
    if (!(this instanceof Edward))
        return new Edward(el, options, callback);
    
    this._Ace;
    this._Emmet;
    this._Value;
    
    this._Config = {
        options: {}
    };
    
    this._Options;
    this._FileName;
    this._Modelist;
    this._ElementMsg;
    this._JSHintConfig;
    this._Ext;
    this._TITLE = 'Edward';
    this._DIR = '/modules/';
    this._story = Story();
    this._Emitter;
    this._isKey = true;
    
    if (!callback)
        callback = options;
    
    if (typeof el === 'string')
        el = document.querySelector(el);
    
    this._MAX_FILE_SIZE   = options.maxSize || 512000;
    this._PREFIX          = options.prefix || '/edward';
    this._SOCKET_PATH     = options.socketPath || '';
    
    this._Element = el || document.body;
    
    const onDrop = this._onDrop.bind(this);
    const onDragOver = this._onDragOver.bind(this);
    
    this._Element.addEventListener('drop', onDrop);
    this._Element.addEventListener('dragover', onDragOver);
    
    loadScript(this._PREFIX + '/modules/execon/lib/exec.js', () => {
        this._init(() => {
            callback(this);
        });
    });
    
    this._patch = function(path, patch) {
        this._patchHttp(path, patch);
    };
    
    this._write = function(path, result) {
        this._writeHttp(path, result);
    };
}

Edward.prototype.isKey = function() {
    return this._isKey;
}

Edward.prototype.disableKey = function() {
    this._isKey = false;
}

Edward.prototype.enableKey = function() {
    this._isKey = true;
    return this;
}

Edward.prototype._showMessageOnce = function(msg) {
    if (!this._showedOnce) {
        this.showMessage(msg);
        this._showedOnce = true;
    }
};

function empty() {}

Edward.prototype._init = function(fn) {
    const self = this;
    const edward = this;
    const loadFiles = this._loadFiles.bind(this);
    const initSocket = this._initSocket.bind(this);
    
    exec.series([
        loadFiles,
        function(callback) {
            loadRemote('socket', {
                name : 'io',
                prefix: self._SOCKET_PATH,
            }, function(error) {
                initSocket(error);
                callback();
            });
        },
        function() {
            self._Emitter = Emitify();
            self._Ace = ace.edit(self._Element);
            self._Modelist = ace.require('ace/ext/modelist');
            
            self._Emitter.on('auth', function(username, password) {
                self._socket.emit('auth', username, password);
            });
            
            ace.require('ace/ext/language_tools');
            
            self._addCommands();
            self._Ace.$blockScrolling = Infinity;
            
            load.json(self._PREFIX + '/edit.json', (error, config) => {
                const options = config.options || {};
                const preventOverwrite = () => {
                    Object.keys(self._Config.options).forEach((name) => {
                         options[name] = self._Config.options[name];
                    });
                }
                
                fn();
                preventOverwrite();
                
                self._Config = config;
                
                edward.setOptions(options);
            });
        },
    ]);
};

Edward.prototype._addCommands = function() {
    const edward = this;
    const addKey = this._addKey.bind(this);
    const run = (fn) => {
        return () => {
            edward.isKey() && fn();
        }
    }
    const commands    = [{
            name    : 'goToLine',
            bindKey : { win: 'Ctrl-G',  mac: 'Command-G' },
            exec    : () => {
                edward.goToLine();
            }
        }, {
            name    : 'save',
            bindKey : { win: 'Ctrl-S',  mac: 'Command-S' },
            exec    : run(() => {
                edward.save();
            })
        }, {
            name    : 'saveMC',
            bindKey : { win: 'F2',  mac: 'F2' },
            exec    : run(() => {
                edward.save();
            })
        }, {
            name    : 'beautify',
            bindKey : { win: 'Ctrl-B',  mac: 'Command-B' },
            exec    : run(() => {
                edward.beautify();
            })
        }, {
            name    : 'minify',
            bindKey : { win: 'Ctrl-M',  mac: 'Command-M' },
            exec    : run(() => {
                edward.minify();
            })
        }, {
            name    : 'evaluate',
            bindKey : { win: 'Ctrl-E',  mac: 'Command-E' },
            exec    : run(() => {
                edward.evaluate();
            })
        }];
    
    commands.forEach(addKey);
};
    
Edward.prototype.evaluate = function() {
    const edward = this;
    const focus = edward.focus.bind(this);
    const isJS = /\.js$/.test(this._FileName);
    
    if (!isJS)
        return smalltalk.alert(this._TITLE, 'Evaluation supported for JavaScript only')
            .then(focus);
    
    const value = edward.getValue();
    const msg = exec.try(Function(value));
    
    msg && smalltalk.alert(this._TITLE, msg)
        .then(focus);
};

function createMsg() {
    const wrapper = document.createElement('div');
    const html = '<div class="edward-msg">/div>';
    
    wrapper.innerHTML = html;
    const msg = wrapper.firstChild;
    
    return msg;
}
    
Edward.prototype._addKey = function(options) {
    this._Ace.commands.addCommand(options);
};

Edward.prototype.addKeyMap = function(keyMap) {
    const self = this;
    
    if (typeof keyMap !== 'object')
        throw Error('map should be object!');
    
    const map = Object.keys(keyMap).map((name, i) => {
        const key = {
            name: String(Math.random()) + i,
            bindKey : {
                win : name,
                mac : name.replace('Ctrl', 'Command')
            },
            exec: keyMap[name]
        };
        
        return key;
    });
    
    map.forEach(self._addKey());
    
    return this;
};

Edward.prototype.goToLine = function() {
    const self = this;
    const msg = 'Enter line number:';
    const cursor = self.getCursor();
    const number = cursor.row + 1;
    
    const gotToLine = (line) => {
        this._Ace.gotoLine(line);
    };
    
    const focus = () => {
        this._Ace.focus();
    }
    
    smalltalk.prompt(this._TITLE, msg, number)
        .then(goToLine)
        .catch(empty)
        .then(focus)
    
    return this;
};

Edward.prototype.moveCursorTo = function(row, column) {
    this._Ace.moveCursorTo(row, column);
    return this;
};

Edward.prototype.refresh = function() {
    this._Ace.resize();
    return this;
};

Edward.prototype.focus = function() {
    this._Ace.focus();
    return this;
};

Edward.prototype.remove = function(direction) {
    this._Ace.remove(direction);
    return this;
};

Edward.prototype.getCursor = function() {
    return this._Ace.selection.getCursor();
};

Edward.prototype.getValue = function() {
    return this._Ace.getValue();
};

Edward.prototype.on = function(event, fn) {
    this._Emitter.on(event, fn);
    return this;
};

Edward.prototype.once = function(event, fn) {
    this._Emitter.once(event, fn);
    return this;
};

Edward.prototype.emit = function(event) {
    this._Emitter.emit.apply(this._Emitter, arguments);
    return this;
};

Edward.prototype.isChanged = function() {
    const value = this.getValue();
    const isEqual = value === this._Value;
    
    return !isEqual;
};

Edward.prototype.setValue = function(value) {
    const session = this._getSession();
    
    session.setScrollTop(0);
    
    this._Ace.setValue(value);
    this._Ace.clearSelection();
    
    this._Emitter.emit('change');
    
    return this;
};

Edward.prototype.setValueFirst = function(name, value) {
    const session = this._getSession();
    const UndoManager = ace.require('ace/undomanager').UndoManager;
    
    this._FileName  = name;
    this._Value     = value;
    
    this.setValue(value);
    
    session.setUndoManager(new UndoManager());
    
    return this;
};

Edward.prototype.setOption = function(name, value) {
    const preventOverwrite = () => {
        this._Config.options[name] = value;
    };
    
    preventOverwrite();
    
    if (name === 'keyMap') {
        this._setKeyMap({
            keyMap: value
        });
        
        return this;
    }
    
    this._Ace.setOption(name, value);
    
    return this;
};

Edward.prototype.setOptions = function(options) {
    Object.keys(options).forEach((name) => {
        this.setOption(name, options[name]);
    });
    
    return this;
};

Edward.prototype._setKeyMap = function(options) {
    let keyMap = options && options.keyMap;
    
    if (keyMap === 'default')
        keyMap = 'hash_handler';
    
    if (keyMap)
        this._Ace.setKeyboardHandler('ace/keyboard/' + keyMap);
    
    delete options.keyMap;
};

Edward.prototype._setUseOfWorker = function(mode) {
    const session = this._getSession();
    const isStr = typeof mode === 'string';
    const regStr = 'coffee|css|html|javascript|json|lua|php|xquery';
    const regExp = new RegExp(regStr);
    
    let isMatch;
    if (isStr)
        isMatch = regExp.test(mode);
    
    session.setUseWorker(isMatch);
    
    return this;
};

Edward.prototype.setMode = function(mode) {
    const modesByName = this._Modelist.modesByName;
    
    if (!modesByName[mode])
        return this;
    
    const ext = modesByName[mode].extensions.split('|')[0];
    this.setModeForPath('.' + ext);
    
    return this;
};

Edward.prototype.setModeForPath = function(path) {
    const session = this._getSession();
    const modesByName = this._Modelist.modesByName;
    const name = path.split('/').pop();
    
    this._addExt(name, (name) => {
        const mode = this._Modelist.getModeForPath(name).mode;
        const htmlMode = modesByName.html.mode;
        const jsMode = modesByName.javascript.mode;
        
        const isHTML = mode === htmlMode;
        const isJS = mode === jsMode;
        
        session.setMode(mode, () => {
            this._setUseOfWorker(mode);
            
            if (isHTML)
                this._setEmmet();
            
            if (isJS && session.getUseWorker())
                this._setJsHintConfig();
        });
    });
    
    return this;
};

Edward.prototype.selectAll = function() {
    this._Ace.selectAll();
    return this;
};

Edward.prototype.copyToClipboard = function() {
    const msg = 'Could not copy, use &ltCtrl&gt + &ltС&gt insted!';
    
    if (!this._clipboard('copy'))
        smalltalk.alert(this._TITLE, msg);
    
    return this;
};

Edward.prototype.cutToClipboard = function() {
    const msg = 'Could not cut, use &ltCtrl&gt + &ltX&gt insted!';
    
    if (!this._clipboard('cut'))
        smalltalk.alert(this._TITLE, msg);
    else
        this.remove('right');
    
    return this;
};

Edward.prototype.pasteFromClipboard = function() {
    const msg = 'Could not paste, use &ltCtrl&gt + &ltV&gt insted!';
    
    if (!this._clipboard('paste'))
        smalltalk.alert(this._TITLE, msg);
    
    return this;
};

Edward.prototype._clipboard = _clipboard;

Edward.prototype._getSession = function() {
    return this._Ace.getSession();
};

Edward.prototype.showMessage = function(text) {
    var HIDE_TIME   = 2000;
    
    if (!this._ElementMsg) {
        this._ElementMsg = createMsg();
        this._Element.appendChild(this._ElementMsg);
    }
    
    this._ElementMsg.textContent = text;
    this._ElementMsg.hidden = false;
    
    setTimeout(() => {
        this._ElementMsg.hidden = true;
    }, HIDE_TIME);
    
    return this;
};

Edward.prototype.sha = function(callback) {
    var self    = this;
    var url     = this._PREFIX + this._DIR + 'jsSHA/src/sha.js';
    
    load.js(url, function() {
        let hash;
        
        const value = self.getValue();
        
        const error = exec.try(() => {
            const shaObj = new window.jsSHA('SHA-1', 'TEXT');
            shaObj.update(value);
            hash    = shaObj.getHash('HEX');
        });
        
        callback(error, hash);
    });
    
    return this;
};

Edward.prototype.beautify = function() {
   this._readWithFlag('beautify');
   return this;
};

Edward.prototype.minify = function() {
    this._readWithFlag('minify');
    return this;
};

Edward.prototype.save = save;

Edward.prototype._loadOptions = function(callback) {
    var self = this;
    var url = this._PREFIX + '/options.json';
    
    if (self._Options)
        callback(null, self._Options);
    else
        load.json(url, function(error, data) {
            self._Options = data;
            callback(error, data);
        });
};
    
Edward.prototype._patchHttp = function(path, patch) {
    var onSave = this._onSave.bind(this);
    restafary.patch(path, patch, onSave);
};

Edward.prototype._writeHttp = function(path, result) {
    var onSave = this._onSave.bind(this);
    restafary.write(path, result, onSave);
};

Edward.prototype._onSave = function(error, text) {
    var self        = this,
        dword       = this,
        Value       = self._Value,
        FileName    = self._FileName,
        msg         = 'Try again?';
        
    if (error) {
        if (error.message)
            msg = error.message + '\n' + msg;
        else
            msg = 'Can\'t save.' + msg;
        
        smalltalk.confirm(this._TITLE, msg).then(function() {
            var onSave = self._onSave.bind(self);
            restafary.write(self._FileName, self._Value, onSave);
        }).catch(empty).then(function(){
            dword.focus();
        });
    } else {
        dword.showMessage(text);
        
        dword.sha(function(error, hash) {
            if (error)
                console.error(error);
            
            self._story.setData(FileName, Value)
                 .setHash(FileName, hash);
        });
        
        self._Emitter.emit('save', Value.length);
    }
};

Edward.prototype._doDiff = function(path, callback) {
    var self    = this;
    var value   = this.getValue();
    
    this._diff(value, function(patch) {
        self._story.checkHash(path, function(error, equal) {
            if (!equal)
                patch = '';
            
            callback(patch);
        });
    });
};

Edward.prototype._diff = function(newValue, callback) {
    var self = this;
    
    this._loadDiff(function(error) {
        var patch;
        
        if (error) {
            smalltalk.alert(self._TITLE, error);
        } else {
            self._Value   = self._story.getData(self._FileName);
            patch   = daffy.createPatch(self._Value, newValue);
            callback(patch);
        }
    });
};

Edward.prototype._loadDiff = function(callback) {
    var DIR = this._DIR;
    var url = this._PREFIX + join([
            'google-diff-match-patch/diff_match_patch.js',
            'daffy/lib/daffy.js'
        ].map(function(name) {
            return DIR + name;
        }));
    
    load.js(url, callback);
};

Edward.prototype._zip = function(value, callback) {
    var self = this;
    
    exec.parallel([
        function(callback) {
            var url = self._PREFIX + self._DIR + 'zipio/lib/zipio.js';
            load.js(url, callback);
        },
        function(callback) {
            loadRemote('pako', {prefix: self._PREFIX}, callback);
        }
    ], function(error) {
        if (error)
            smalltalk.alert(self._TITLE, error);
        else
            global.zipio(value, callback);
    });
};

Edward.prototype._setEmmet = function() {
    const {
        _DIR,
        _PREFIX,
    } = this
    
    const dir = _DIR + 'ace-builds/src-min/';
    const dirVendor = '/vendor/';
    
    const {extensions} = this._Config;
    const isEmmet = extensions.emmet;
    
    if (!isEmmet)
        return;
    
    exec.if(this._Emmet, () => {
        this.setOption('enableEmmet', true);
    }, (callback) => {
        const url = _PREFIX + join([
            dirVendor + 'emmet.js',
            dir + 'ext-emmet.js'
        ]);
        
        load.js(url, () => {
            this._Emmet = ace.require('ace/ext/emmet');
            this._Emmet.setCore(window.emmet);
            
            callback();
        });
    });
};

Edward.prototype._setJsHintConfig = function(callback) {
    var self        = this;
    var JSHINT_PATH = this._PREFIX + '/jshint.json',
        func        = function() {
            var session = self._getSession(),
                worker  = session.$worker;
            
            if (worker)
                worker.send('changeOptions', [self._JSHintConfig]);
            
            exec(callback);
        };
    
    exec.if(this._JSHintConfig, func, function() {
        load.json(JSHINT_PATH, function(error, json) {
                if (error)
                    smalltalk.alert(self._TITLE, error);
                else
                    self._JSHintConfig = json;
                
                func();
        });
    });
};

Edward.prototype._addExt = function(name, fn) {
    var self = this;
    
    if (!this._Ext)
        load.json(this._PREFIX + '/json/ext.json', function(error, data) {
            self._Ext = data;
            add(error, self._Ext);
        });
    else
        add(null, this._Ext);
    
    function add(error, exts) {
        if (error)
            console.error(Error('Could not load ext.json!'));
        else
            Object.keys(exts).some(function(ext) {
                var arr = exts[ext],
                    is  = ~arr.indexOf(name);
                
                if (is)
                    name += '.' + ext;
                
                return is;
            });
        
        fn(name);
    }
};

function getHost() {
    var l       = location,
        href    = l.origin || l.protocol + '//' + l.host;
    
    return href;
}

Edward.prototype._initSocket = function(error) {
    var socket,
        self            = this,
        edward          = this,
        href            = getHost(),
        FIVE_SECONDS    = 5000,
        patch    = function(name, data) {
            socket.emit('patch', name, data);
        };
        
    if (!error) {
        socket  = io.connect(href + this._PREFIX, {
            'max reconnection attempts' : Math.pow(2, 32),
            'reconnection limit'        : FIVE_SECONDS,
            path                        : this._SOCKET_PATH + '/socket.io'
        });
        
        self._socket = socket;
        
        socket.on('reject', function() {
            self.emit('reject');
        });
        
        socket.on('connect', function() {
            edward._patch = patch;
        });
        
        socket.on('message', function(msg) {
            self._onSave(null, msg);
        });
        
        socket.on('file', function(name, data) {
            edward.setModeForPath(name)
                .setValueFirst(name, data)
                .moveCursorTo(0, 0);
        });
        
        socket.on('patch', function(name, data, hash) {
            if (name !== self._FileName)
                return;
            
            self._loadDiff(function(error) {
                var cursor, value;
                
                if (error)
                    return console.error(error);
                
                if (hash !== self._story.getHash(name))
                    return;
                    
                cursor  = edward.getCursor(),
                value   = edward.getValue();
                value   = daffy.applyPatch(value, data);
                
                edward.setValue(value);
                
                edward.sha(function(error, hash) {
                    self._story.setData(name, value)
                         .setHash(name, hash);
                    
                    edward.moveCursorTo(cursor.row, cursor.column);
                });
            });
        });
        
        socket.on('disconnect', function() {
            edward.save.patch = self._patchHttp;
        });
        
        socket.on('err', function(error) {
            smalltalk.alert(self._TITLE, error);
        });
    }
};

Edward.prototype._readWithFlag = function(flag) {
    const edward = this;
    const path = this._FileName + '?' + flag;
    
    restafary.read(path, (error, data) => {
        if (error)
            return smalltalk.alert(this._TITLE, error);
        
        edward
            .setValue(data)
            .moveCursorTo(0, 0);
    });
};

/**
 * In Mac OS Chrome dropEffect = 'none'
 * so drop do not firing up when try
 * to upload file from download bar
 */
Edward.prototype._onDragOver = function(event) {
    const dataTransfer = event.dataTransfer;
    const effectAllowed = dataTransfer.effectAllowed;
    
    if (/move|linkMove/.test(effectAllowed))
        dataTransfer.dropEffect = 'move';
    else
        dataTransfer.dropEffect = 'copy';
    
    event.preventDefault();
};

Edward.prototype._onDrop = function(event) {
    const edward = this;
    const onLoad = ({target}) => {
        const {result} = target;
        
        edward.setValue(result);
    };
    
    event.preventDefault();
    
    const files = [...event.dataTransfer.files];
    
    files.forEach((file) => {
        const reader = new FileReader();
        reader.addEventListener('load', onLoad);
        reader.readAsBinaryString(file);
    });
};

function getModulePath(name, lib, ext = '.js') {
    let libdir = '/';
    const dir = '/modules/';
    
    if (lib)
        libdir  = '/' + lib + '/';
    
    const path = dir + name + libdir + name + ext;
    
    return path;
}

Edward.prototype._loadFiles = function(callback) {
    const PREFIX = this._PREFIX;
    const DIR = this._DIR;
    
    exec.series([
        function(callback) {
            const obj     = {
                loadRemote  : getModulePath('loadremote', 'lib'),
                load        : getModulePath('load'),
                Emitify     : getModulePath('emitify', 'dist', '.min.js'),
                join        : '/join/join.js'
            };
            
            const scripts = Object.keys(obj)
                .filter((name) => {
                    return !window[name];
                })
                .map((name) => {
                    return PREFIX + obj[name];
                });
            
            exec.if(!scripts.length, callback, () => {
                loadScript(scripts, callback);
            });
        },
        
        function(callback) {
            const name = 'smalltalk';
            const is = window.Promise;
            const js = '.min.js';
            const dir = '/modules/' + name + '/dist/';
            const isFlex = () => {
                return document.body.style.flex !== undefined;
            };
            
            let jsName = is ? js : '.poly' + js;
            
            if (!isFlex())
                jsName = '.native' + jsName;
            
            const names = [jsName, '.min.css'].map((ext) => {
                return PREFIX + dir + name + ext;
            });
            
            load.parallel(names, callback);
        },
        
        function(callback) {
            loadRemote.load('ace', {prefix: PREFIX}, callback);
        },
        
        function(callback) {
            const css = PREFIX + '/css/edward.css';
            const js = PREFIX + '/restafary.js';
            const ace = DIR + 'ace-builds/src-min/';
            const url = PREFIX + join([
                'language_tools',
                'searchbox',
                'modelist'
            ].map((name) => {
                return 'ext-' + name;
            })
            .map((name) => {
                return ace + name + '.js';
            }));
            
            load.parallel([url, js, css], callback);
        },
        
        function() {
            restafary.prefix(PREFIX + '/api/v1/fs');
            callback();
        }
    ]);
};

function loadScript(srcs, callback) {
    const func = () => {
        --i;
        
        if (!i)
            callback();
    };
    
    const toArray = (value) => {
        if (typeof value === 'string')
            return [value];
        
        return value;
    };
    
    const array = toArray(srcs);
    let i = array.length;
    
    array.map((src) => {
        const element = document.createElement('script');
         
        element.src = src;
        element.addEventListener('load', function load() {
            func();
            element.removeEventListener('load', load);
        });
        
        return element;
    }).forEach((element) => {
        document.body.appendChild(element);
    });
}

