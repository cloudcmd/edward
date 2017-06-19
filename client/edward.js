/* global smalltalk */
/* global ace */
/* global load */
/* global join */
/* global restafary */
/* global Emitify */
/* global loadRemote */
/* global daffy */

'use strict';

const exec = require('execon');

window.exec = window.exec || exec;

const Story = require('./story');
const _clipboard = require('./_clipboard');
const _setEmmet = require('./_set-emmet');
const _initSocket = require('./_init-socket');

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
    
    this._init(() => {
        callback(this);
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
    const edward = this;
    const loadFiles = this._loadFiles.bind(this);
    const initSocket = _initSocket.bind(this);
    
    exec.series([
        loadFiles,
        (callback) => {
            loadRemote('socket', {
                name : 'io',
                prefix: this._SOCKET_PATH,
            }, (error) => {
                !error && initSocket();
                callback();
            });
        },
        () => {
            this._Emitter = Emitify();
            this._Ace = ace.edit(this._Element);
            this._Modelist = ace.require('ace/ext/modelist');
            
            this._Emitter.on('auth', (username, password) => {
                this._socket.emit('auth', username, password);
            });
            
            ace.require('ace/ext/language_tools');
            
            this._addCommands();
            this._Ace.$blockScrolling = Infinity;
            
            load.json(this._PREFIX + '/edit.json', (error, config) => {
                const options = config.options || {};
                const preventOverwrite = () => {
                    Object.keys(this._Config.options).forEach((name) => {
                        options[name] = this._Config.options[name];
                    });
                }
                
                fn();
                preventOverwrite();
                
                this._Config = config;
                
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
    
    map.forEach(this._addKey());
    
    return this;
};

Edward.prototype.goToLine = function() {
    const msg = 'Enter line number:';
    const cursor = this.getCursor();
    const number = cursor.row + 1;
    
    const goToLine = (line) => {
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

Edward.prototype.emit = function() {
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
    const HIDE_TIME = 2000;
    
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
    const url = this._PREFIX + this._DIR + 'jsSHA/src/sha.js';
    
    load.js(url, () => {
        let hash;
        
        const value = this.getValue();
        
        const error = exec.try(() => {
            const shaObj = new window.jsSHA('SHA-1', 'TEXT');
            shaObj.update(value);
            hash = shaObj.getHash('HEX');
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
    const url = this._PREFIX + '/options.json';
    
    if (this._Options)
        return callback(null, this._Options);
    
    load.json(url, (error, data) => {
        this._Options = data;
        callback(error, data);
    });
};
    
Edward.prototype._patchHttp = function(path, patch) {
    const onSave = this._onSave.bind(this);
    restafary.patch(path, patch, onSave);
};

Edward.prototype._writeHttp = function(path, result) {
    const onSave = this._onSave.bind(this);
    restafary.write(path, result, onSave);
};

Edward.prototype._onSave = function(error, text) {
    const edward = this;
    
    const Value = this._Value;
    const FileName = this._FileName;
    let msg = 'Try again?';
    
    if (error) {
        if (error.message)
            msg = error.message + '\n' + msg;
        else
            msg = 'Can\'t save.' + msg;
        
        const onSave = this._onSave.bind(this);
        
        return smalltalk.confirm(this._TITLE, msg).then(() => {
            restafary.write(this._FileName, this._Value, onSave);
        }).catch(empty).then(()=> {
            edward.focus();
        });
    }
    
    edward.showMessage(text);
    
    edward.sha((error, hash) => {
        if (error)
            return console.error(error);
    
        this._story.setData(FileName, Value)
            .setHash(FileName, hash);
    });

    this._Emitter.emit('save', Value.length);
};

Edward.prototype._doDiff = function(path, callback) {
    const value = this.getValue();
    
    this._diff(value, (patch) => {
        this._story.checkHash(path, (error, equal) => {
            if (!equal)
                patch = '';
            
            callback(patch);
        });
    });
};

Edward.prototype._diff = function(newValue, callback) {
    this._loadDiff((error) => {
        if (error)
            return smalltalk.alert(this._TITLE, error);
        
        this._Value = this._story.getData(this._FileName);
        const patch = daffy.createPatch(this._Value, newValue);
        callback(patch);
    });
};

Edward.prototype._loadDiff = function(callback) {
    const DIR = this._DIR;
    const url = this._PREFIX + join([
        'google-diff-match-patch/diff_match_patch.js',
        'daffy/lib/daffy.js'
    ].map((name) => {
        return DIR + name;
    }));
    
    load.js(url, callback);
};

Edward.prototype._zip = function(value, callback) {
    const prefix = this._PREFIX;
    
    exec.parallel([
        (callback) => {
            const url = prefix + this._DIR + 'zipio/lib/zipio.js';
            load.js(url, callback);
        },
        (callback) => {
            loadRemote('pako', {prefix}, callback);
        }
    ], (error) => {
        if (error)
            return smalltalk.alert(this._TITLE, error);
        
        global.zipio(value, callback);
    });
};

Edward.prototype._setEmmet = _setEmmet;

Edward.prototype._setJsHintConfig = function(callback) {
    const JSHINT_PATH = this._PREFIX + '/jshint.json',
        func = () => {
            const session = this._getSession();
            const worker = session.$worker;
            
            if (worker)
                worker.send('changeOptions', [this._JSHintConfig]);
            
            exec(callback);
        };
    
    exec.if(this._JSHintConfig, func, () => {
        load.json(JSHINT_PATH, (error, json) => {
            if (error)
                smalltalk.alert(this._TITLE, error);
            else
                this._JSHintConfig = json;
            
            func();
        });
    });
};

Edward.prototype._addExt = function(name, fn) {
    if (this._Ext)
        return add(null, this._Ext);
    
    load.json(this._PREFIX + '/json/ext.json', (error, data) => {
        this._Ext = data;
        add(error, this._Ext);
    });
    
    function add(error, exts) {
        if (error)
            return console.error(Error('Could not load ext.json!'));
        
        Object.keys(exts).some((ext) => {
            const arr = exts[ext];
            const is = ~arr.indexOf(name);
            
            if (is)
                name += '.' + ext;
            
            return is;
        });
        
        fn(name);
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

