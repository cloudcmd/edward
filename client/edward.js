/* global ace */
/* global join */
/* global loadRemote */

'use strict';

require('../css/edward.css');

const {createPatch} = require('daffy');
const exec = require('execon');
const Emitify = require('emitify/legacy');
const load = require('load.js');
const wraptile = require('wraptile/legacy');
const smalltalk = require('smalltalk');
const {promisify} = require('es6-promisify');
const jssha = require('jssha');
const restafary = require('restafary/legacy/client');

window.load = window.load || load;
window.exec = window.exec || exec;

const loadJSON = promisify(load.json);

const Story = require('./story');
const _clipboard = require('./_clipboard');
const _setEmmet = require('./_set-emmet');
const _initSocket = require('./_init-socket');
const setKeyMap = require('./set-key-map');
const showMessage = require('./show-message');
const save = require('./save');

function empty() {}

module.exports = (el, options, callback) => {
    Edward(el, options, callback);
};

function Edward(el, options, callback) {
    if (!(this instanceof Edward))
        return new Edward(el, options, callback);
    
    this._Ace;
    this._Emmet;
    this._Value;
    
    this._Config = {
        options: {},
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
    
    this._maxSize = options._maxSize || 512000;
    this._PREFIX = options.prefix || '/edward';
    this._prefixSocket = options.prefixSocket || '/edward';
    this._SOCKET_PATH = options.socketPath || '';
    
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

Edward.prototype.showMessage = showMessage;

Edward.prototype.isKey = function() {
    return this._isKey;
};

Edward.prototype.disableKey = function() {
    this._isKey = false;
};

Edward.prototype.enableKey = function() {
    this._isKey = true;
    return this;
};

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
                };
                
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
    
    const call = (fn) => fn.call(this);
    const wrapCall = wraptile(call);
    
    const callIfKey = wraptile((fn) => {
        edward.isKey() && call(fn);
    });
    
    const commands = [{
        name    : 'goToLine',
        bindKey : { win: 'Ctrl-G', mac: 'Command-G' },
        exec    : wrapCall(edward.goToLine),
    }, {
        name    : 'save',
        bindKey : { win: 'Ctrl-S', mac: 'Command-S' },
        exec    : callIfKey(edward.save),
    }, {
        name    : 'saveMC',
        bindKey : { win: 'F2', mac: 'F2' },
        exec    : callIfKey(edward.save),
    }, {
        name    : 'evaluate',
        bindKey : { win: 'Ctrl-E', mac: 'Command-E' },
        exec    : callIfKey(edward.evaluate),
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
                mac : name.replace('Ctrl', 'Command'),
            },
            exec: keyMap[name],
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
    };
    
    smalltalk.prompt(this._TITLE, msg, number)
        .then(goToLine)
        .catch(empty)
        .then(focus);
    
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

Edward.prototype.emit = function(...args) {
    this._Emitter.emit(...args);
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
    const {UndoManager} = ace.require('ace/undomanager');
    
    this._FileName = name;
    this._Value = value;
    
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
        this.setKeyMap(value);
        
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

Edward.prototype.setKeyMap = setKeyMap;
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
    const {modesByName} = this._Modelist;
    
    if (!modesByName[mode])
        return this;
    
    const [ext] = modesByName[mode].extensions.split('|');
    this.setModeForPath('.' + ext);
    
    return this;
};

Edward.prototype.setModeForPath = function(path) {
    const session = this._getSession();
    const {modesByName} = this._Modelist;
    const name = path.split('/').pop();
    
    this._addExt(name, (name) => {
        const {mode} = this._Modelist.getModeForPath(name);
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
    
    this._clipboard('copy')
        .catch(wraptile(smalltalk.alert, this._TITLE, msg));
    
    return this;
};

Edward.prototype.cutToClipboard = function() {
    const msg = 'Could not cut, use &ltCtrl&gt + &ltX&gt insted!';
    const remove = this.remove.bind(this);
    
    this._clipboard('cut')
        .then(wraptile(remove, 'right'))
        .catch(wraptile(smalltalk.alert, this._TITLE, msg));
    
    return this;
};

Edward.prototype.pasteFromClipboard = function() {
    const msg = 'Could not paste, use &ltCtrl&gt + &ltV&gt insted!';
    
    this._clipboard('paste')
        .catch(wraptile(smalltalk.alert, this._TITLE, msg));
    
    return this;
};

Edward.prototype._clipboard = _clipboard;

Edward.prototype._getSession = function() {
    return this._Ace.getSession();
};

Edward.prototype.sha = function() {
    const value = this.getValue();
    const shaObj = new jssha('SHA-1', 'TEXT');
    shaObj.update(value);
    
    return shaObj.getHash('HEX');
};

Edward.prototype.save = save;

Edward.prototype._loadOptions = async function() {
    const url = this._PREFIX + '/options.json';
    
    if (this._Options)
        return this._Options;
    
    const data = await loadJSON(url);
    
    this._Options = data;
    
    return data;
};

Edward.prototype._patchHttp = function(path, patch) {
    const onSave = this._onSave.bind(this);
    restafary.patch(path, patch, onSave);
};

Edward.prototype._writeHttp = function(path, result) {
    const onSave = this._onSave.bind(this);
    restafary.write(path, result, onSave);
};

Edward.prototype._onSave = require('./_on-save');

Edward.prototype._doDiff = async function(path) {
    const value = this.getValue();
    const patch = this._diff(value);
    const equal = await this._story.checkHash(path);
    
    return equal ? patch : '';
};

Edward.prototype._diff = function(newValue) {
    this._Value = this._story.getData(this._FileName) || this._Value;
    return createPatch(this._Value, newValue);
};

Edward.prototype._setEmmet = _setEmmet;

Edward.prototype._setJsHintConfig = function(callback) {
    const JSHINT_PATH = this._PREFIX + '/jshint.json';
    
    const func = () => {
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

/**
 * In Mac OS Chrome dropEffect = 'none'
 * so drop do not firing up when try
 * to upload file from download bar
 */
Edward.prototype._onDragOver = function(event) {
    const {dataTransfer} = event;
    const {effectAllowed} = dataTransfer;
    
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
        libdir = '/' + lib + '/';
    
    const path = dir + name + libdir + name + ext;
    
    return path;
}

Edward.prototype._loadFiles = function(callback) {
    const PREFIX = this._PREFIX;
    const DIR = this._DIR;
    
    exec.series([
        function(callback) {
            const obj = {
                loadRemote  : getModulePath('loadremote', 'lib'),
                join        : '/join/join.js',
            };
            
            const scripts = Object.keys(obj)
                .filter((name) => {
                    return !window[name];
                })
                .map((name) => {
                    return PREFIX + obj[name];
                });
            
            exec.if(!scripts.length, callback, () => {
                load.parallel(scripts, callback);
            });
        },
        
        function(callback) {
            loadRemote.load('ace', {prefix: PREFIX}, callback);
        },
        
        function(callback) {
            const ace = DIR + 'ace-builds/src-min/';
            const url = PREFIX + join([
                'language_tools',
                'searchbox',
                'modelist',
            ].map((name) => {
                return 'ext-' + name;
            })
                .map((name) => {
                    return ace + name + '.js';
                }));
            
            load.js(url, callback);
        },
        
        function() {
            restafary.prefix(PREFIX + '/api/v1/fs');
            callback();
        },
    ]);
};

