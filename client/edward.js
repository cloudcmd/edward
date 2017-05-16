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

(function(global) {
    'use strict';
    
    if (typeof module !== 'undefined' && module.exports)
        module.exports  = init;
    else
        global.edward   = init;
    
    function init(el, options, callback) {
        Edward(el, options, callback);
    }
    
    function Edward(el, options, callback) {
        var onDrop, onDragOver;
        var self = this;
        
        if (!(this instanceof Edward))
            return new Edward(el, options, callback);
        
        this._Ace;
        this._Emmet;
        this._Value;
        this._Config;
        this._Options;
        this._FileName;
        this._Modelist;
        this._ElementMsg;
        this._JSHintConfig;
        this._Ext;
        this._TITLE           = 'Edward';
        this._DIR             = '/modules/';
        this._story           = new Story();
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
        
        onDrop      = this._onDrop.bind(this);
        onDragOver  = this._onDragOver.bind(this);
        
        this._Element.addEventListener('drop', onDrop);
        this._Element.addEventListener('dragover', onDragOver);
        
        loadScript(this._PREFIX + '/modules/execon/lib/exec.js', function() {
            self._init(function() {
                callback(self);
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
        var self    = this;
        var edward  = this;
        var loadFiles = this._loadFiles.bind(this);
        var initSocket = this._initSocket.bind(this);
        
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
                self._Emitter     = Emitify();
                self._Ace         = ace.edit(self._Element);
                self._Modelist    = ace.require('ace/ext/modelist');
                
                self._Emitter.on('auth', function(username, password) {
                    self._socket.emit('auth', username, password);
                });
                
                ace.require('ace/ext/language_tools');
                
                self._addCommands();
                
                self._Ace.$blockScrolling = Infinity;
                
                load.json(self._PREFIX + '/edit.json', function(error, config) {
                    var options = config.options;
                    
                    fn();
                    
                    self._Config     = config;
                    edward.setOptions(options);
                });
            },
        ]);
    };
    
    Edward.prototype._addCommands = function() {
        var edward      = this;
        var addKey      = this._addKey.bind(this);
        var run = function(fn) {
            return function() {
                edward.isKey() && fn();
            }
        }
        var commands    = [{
                name    : 'goToLine',
                bindKey : { win: 'Ctrl-G',  mac: 'Command-G' },
                exec    : function () {
                    edward.goToLine();
                }
            }, {
                name    : 'save',
                bindKey : { win: 'Ctrl-S',  mac: 'Command-S' },
                exec    : run(function() {
                    edward.save();
                })
            }, {
                name    : 'saveMC',
                bindKey : { win: 'F2',  mac: 'F2' },
                exec    : run(function() {
                    edward.save();
                })
            }, {
                name    : 'beautify',
                bindKey : { win: 'Ctrl-B',  mac: 'Command-B' },
                exec    : run(function() {
                    edward.beautify();
                })
            }, {
                name    : 'minify',
                bindKey : { win: 'Ctrl-M',  mac: 'Command-M' },
                exec    : run(function() {
                    edward.minify();
                })
            }, {
                name    : 'evaluate',
                bindKey : { win: 'Ctrl-E',  mac: 'Command-E' },
                exec    : run(function() {
                    edward.evaluate();
                })
            }];
        
        commands.forEach(addKey);
    };
        
    Edward.prototype.evaluate = function() {
        var edward  = this,
            focus   = edward.focus.bind(this),
            value,
            msg,
            isJS    = /\.js$/.test(this._FileName);
        
        if (!isJS) {
            msg = 'Evaluation supported for JavaScript only';
        } else {
            value = edward.getValue();
            msg = exec.try(Function(value));
        }
        
        msg && smalltalk.alert(this._TITLE, msg)
            .then(focus);
    };
        
    function createMsg() {
        var msg,
            wrapper = document.createElement('div'),
            html    = '<div class="edward-msg">/div>';
        
        wrapper.innerHTML = html;
        msg = wrapper.firstChild;
        
        return msg;
    }
        
    Edward.prototype._addKey = function(options) {
        this._Ace.commands.addCommand(options);
    };
        
    Edward.prototype.addKeyMap        = function(keyMap) {
        var self = this;
        var map = [];
        
        if (typeof map !== 'object')
            throw Error('map should be object!');
        
        map = Object.keys(keyMap).map(function(name, i) {
            var key = {
                name: String(Math.random()) + i,
                bindKey : {
                    win : name,
                    mac : name.replace('Ctrl', 'Command')
                },
                exec    : keyMap[name]
            };
            
            return key;
        });
        
        map.forEach(self._addKey());
        
        return this;
    };
    
    Edward.prototype.goToLine         = function() {
        var self    = this,
            msg     = 'Enter line number:',
            cursor  = self.getCursor(),
            number  = cursor.row + 1;
            
        smalltalk.prompt(this._TITLE, msg, number).then(function(line) {
            self._Ace.gotoLine(line);
        }).catch(empty).then(function() {
            self._Ace.focus();
        });
        
        return this;
    };
    
    Edward.prototype.moveCursorTo     = function(row, column) {
        this._Ace.moveCursorTo(row, column);
        return this;
    };
    
    Edward.prototype.refresh          = function() {
        this._Ace.resize();
        return this;
    };
    
    Edward.prototype.focus            = function() {
        this._Ace.focus();
        return this;
    };
    
    Edward.prototype.remove           = function(direction) {
        this._Ace.remove(direction);
        return this;
    };
    
    Edward.prototype.getCursor        = function() {
        return this._Ace.selection.getCursor();
    };
    
    Edward.prototype.getValue         = function() {
        return this._Ace.getValue();
    };
    
    Edward.prototype.on               = function(event, fn) {
        this._Emitter.on(event, fn);
        return this;
    };
    
    Edward.prototype.once             = function(event, fn) {
        this._Emitter.once(event, fn);
        return this;
    };
    
    Edward.prototype.emit             = function(event) {
        this._Emitter.emit.apply(this._Emitter, arguments);
        return this;
    };
    
    Edward.prototype.isChanged        = function() {
        var value = this.getValue();
        var isEqual = value === this._Value;
        
        return !isEqual;
    };
    
    Edward.prototype.setValue = function(value) {
        var session = this._getSession();
        
        session.setScrollTop(0);
        
        this._Ace.setValue(value);
        this._Ace.clearSelection();
        
        this._Emitter.emit('change');
        
        return this;
    };
    
    Edward.prototype.setValueFirst = function(name, value) {
        var session     = this._getSession(),
            UndoManager = ace.require('ace/undomanager').UndoManager;
        
        this._FileName  = name;
        this._Value     = value;
        
        this.setValue(value);
        
        session.setUndoManager(new UndoManager());
        
        return this;
    };
    
    Edward.prototype.setOption = function(name, value) {
        this._Ace.setOption(name, value);
        return this;
    };
    
    Edward.prototype.setOptions = function(options) {
        this._setKeyMap(options);
        this._Ace.setOptions(options);
        return this;
    };
   
   Edward.prototype._setKeyMap = function(options) {
        var keyMap = options && options.keyMap;
        
        if (keyMap && keyMap !== 'default')
            this._Ace.setKeyboardHandler('ace/keyboard/' + keyMap);
        
        delete options.keyMap;
   };
    
    Edward.prototype._setUseOfWorker = function(mode) {
        var isMatch,
            session = this._getSession(),
            isStr   = typeof mode === 'string',
            regStr  = 'coffee|css|html|javascript|json|lua|php|xquery',
            regExp  = new RegExp(regStr);
        
        if (isStr)
            isMatch = regExp.test(mode);
        
        session.setUseWorker(isMatch);
        
        return this;
    };
    
    Edward.prototype.setMode          = function(mode) {
        var ext,
            modesByName = this._Modelist.modesByName;
            
        if (modesByName[mode]) {
            ext = modesByName[mode].extensions.split('|')[0];
            this.setModeForPath('.' + ext);
        }
        
        return this;
    };
    
    Edward.prototype.setModeForPath   = function(path) {
        var mode, htmlMode, jsMode, isHTML, isJS,
            self        = this,
            session     = this._getSession(),
            modesByName = this._Modelist.modesByName,
            name        = path.split('/').pop();
        
        this._addExt(name, function(name) {
            mode        = self._Modelist.getModeForPath(name).mode;
            htmlMode    = modesByName.html.mode;
            jsMode      = modesByName.javascript.mode;
            
            isHTML      = mode === htmlMode;
            isJS        = mode === jsMode;
                
            session.setMode(mode, function() {
                self._setUseOfWorker(mode);
                
                if (isHTML)
                    self._setEmmet();
                
                if (isJS && session.getUseWorker())
                    self._setJsHintConfig();
            });
        });
        
        return this;
    };
    
    Edward.prototype.selectAll    = function() {
        this._Ace.selectAll();
        return this;
    };
    
    Edward.prototype.copyToClipboard = function() {
        var msg = 'Could not copy, use &ltCtrl&gt + &ltС&gt insted!';
        
        if (!this._clipboard('copy'))
            smalltalk.alert(this._TITLE, msg);
        
        return this;
    };
    
    Edward.prototype.cutToClipboard = function() {
        var msg = 'Could not cut, use &ltCtrl&gt + &ltX&gt insted!';
        
        if (!this._clipboard('cut'))
            smalltalk.alert(this._TITLE, msg);
        else
            this.remove('right');
        
        return this;
    };
    
    Edward.prototype.pasteFromClipboard = function() {
        var msg = 'Could not paste, use &ltCtrl&gt + &ltV&gt insted!';
        
        if (!this._clipboard('paste'))
            smalltalk.alert(this._TITLE, msg);
        
        return this;
    };
    
    Edward.prototype._clipboard = function(cmd) {
        var result,
            value,
            NAME        = 'editor-clipboard',
            body        = document.body,
            textarea    = document.createElement('textarea');
        
        if (!/^cut|copy|paste$/.test(cmd))
            throw Error('cmd could be "paste", "cut" or "copy" only!');
        
        body.appendChild(textarea);
        
        if (cmd === 'paste') {
            textarea.focus();
            result = document.execCommand(cmd);
            value = textarea.value;
            
            if (!result) {
                this._showMessageOnce('Could not paste from clipboard. Inner buffer used.');
                result  = true;
                value   = this._story.getData(NAME);
            }
            
            if (value)
                this._Ace.insert(value);
        } else {
            textarea.value = this._Ace.getSelectedText();
            this._story.setData(this._NAME, textarea.value);
            textarea.select();
            result = document.execCommand(cmd);
        }
        
        body.removeChild(textarea);
        
        return result;
    };
    
    Edward.prototype._getSession = function() {
        return this._Ace.getSession();
    };
    
    Edward.prototype.showMessage = function(text) {
        var self = this;
        
        var HIDE_TIME   = 2000;
        
        if (!this._ElementMsg) {
            this._ElementMsg = createMsg();
            this._Element.appendChild(this._ElementMsg);
        }
        
        this._ElementMsg.textContent = text;
        this._ElementMsg.hidden = false;
        
        setTimeout(function() {
            self._ElementMsg.hidden = true;
        }, HIDE_TIME);
        
        return this;
    };
    
    Edward.prototype.sha          = function(callback) {
        var self    = this;
        var url     = this._PREFIX + this._DIR + 'jsSHA/src/sha.js';
        
        load.js(url, function() {
            var shaObj, hash, error,
                value   = self.getValue();
            
            error = exec.try(function() {
                shaObj  = new window.jsSHA('SHA-1', 'TEXT');
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
    
    Edward.prototype.save = function() {
        var self    = this;
        var value   = this.getValue();
        
        this._loadOptions(function(error, config) {
            var isDiff      = config.diff,
                isZip       = config.zip,
                doDiff      = self._doDiff.bind(self);
            
            exec.if(!isDiff, function(patch) {
                var query           = '',
                    patchLength     = patch && patch.length || 0,
                    length          = self._Value.length,
                    isLessMaxLength = length < self._MAX_FILE_SIZE,
                    isLessLength    = isLessMaxLength && patchLength < length,
                    isStr           = typeof patch === 'string',
                    isPatch         = patch && isStr && isLessLength;
                
                self._Value               = value;
                
                exec.if(!isZip || isPatch, function(equal, data) {
                    var result  = data || self._Value;
                    
                    if (isPatch)
                        self._patch(self._FileName, patch);
                    else
                        self._write(self._FileName + query, result);
                }, function(func) {
                    self._zip(value, function(error, data) {
                        if (error)
                            console.error(error);
                        
                        query = '?unzip';
                        func(null, data);
                    });
                });
                
            }, exec.with(doDiff, self._FileName));
        });
        
        return this;
    };
    
    Edward.prototype._loadOptions = function(callback) {
        var self    = this,
            url     = this._PREFIX + '/options.json';
        
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
        var self        = this;
        var PREFIX      = this._PREFIX;
        var DIR         = this._DIR;
        var dir         = PREFIX + DIR + 'ace-builds/src-min/',
            dirClient   = PREFIX + '/client/',
            extensions  = this._Config.extensions,
            isEmmet     = extensions.emmet;
        
        if (isEmmet)
            exec.if(this._Emmet, function() {
                this.setOption('enableEmmet', true);
            }, function(callback) {
                var url;
                
                url = PREFIX + join([
                    dirClient   + 'emmet.js',
                    dir         + 'ext-emmet.js'
                ]);
                
                load.js(url, function() {
                    self._Emmet = ace.require('ace/ext/emmet');
                    self._Emmet.setCore(window.emmet);
                    
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
        var self    = this;
        var edward  = this;
        var path    = this._FileName + '?' + flag;
        
        restafary.read(path, function(error, data) {
            if (error)
                smalltalk.alert(self._TITLE, error);
            else
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
        var dataTransfer    = event.dataTransfer,
            effectAllowed   = dataTransfer.effectAllowed;
        
        if (/move|linkMove/.test(effectAllowed))
            dataTransfer.dropEffect = 'move';
        else
            dataTransfer.dropEffect = 'copy';
        
        event.preventDefault();
    };
    
    Edward.prototype._onDrop = function(event) {
        var edward = this;
        var reader, files,
            onLoad   =  function(event) {
                var data    = event.target.result;
                
                edward.setValue(data);
            };
        
        event.preventDefault();
        
        files   = event.dataTransfer.files;
        
        [].forEach.call(files, function(file) {
            reader  = new FileReader();
            reader.addEventListener('load', onLoad);
            reader.readAsBinaryString(file);
        });
    };
    
    function getModulePath(name, lib) {
        var path = '';
        var libdir = '/';
        var dir = '/modules/';
        
        if (lib)
            libdir  = '/' + lib + '/';
        
        path    = dir + name + libdir + name + '.js';
        
        return path;
    }
    
    Edward.prototype._loadFiles = function(callback) {
        var PREFIX  = this._PREFIX;
        var DIR     = this._DIR;
        
        exec.series([
            function(callback) {
                var obj     = {
                    loadRemote  : getModulePath('loadremote', 'lib'),
                    load        : getModulePath('load'),
                    Emitify     : getModulePath('emitify.min', 'dist'),
                    join        : '/join/join.js'
                };
                
                var scripts = Object.keys(obj)
                    .filter(function(name) {
                        return !window[name];
                    })
                    .map(function(name) {
                        return PREFIX + obj[name];
                    });
                
                exec.if(!scripts.length, callback, function() {
                    loadScript(scripts, callback);
                });
            },
            
            function(callback) {
                var names,
                    name        = 'smalltalk',
                    is          = window.Promise,
                    js          = '.min.js',
                    jsName      = is ? js : '.poly' + js,
                    dir         = '/modules/' + name + '/dist/',
                    isFlex      = function() {
                        return document.body.style.flex !== 'undefined';
                    };
                
                if (!isFlex())
                    jsName = '.native' + jsName;
                
                names = [jsName, '.min.css'].map(function(ext) {
                    return PREFIX + dir + name + ext;
                });
                
                load.parallel(names, callback);
            },
            
            function(callback) {
                loadRemote.load('ace', {prefix: PREFIX}, callback);
            },
            
            function(callback) {
                var css     = PREFIX + '/css/edward.css',
                    js      = PREFIX + '/restafary.js',
                    ace     = DIR + 'ace-builds/src-min/',
                    
                    url     = PREFIX + join([
                        'language_tools',
                        'searchbox',
                        'modelist'
                    ].map(function(name) {
                        return 'ext-' + name;
                    })
                    .map(function(name) {
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
        var i,
            func    = function() {
                --i;
                
                if (!i)
                    callback();
            };
        
        if (typeof srcs === 'string')
            srcs = [srcs];
        
        i = srcs.length;
        
        srcs.forEach(function(src) {
            var element = document.createElement('script');
        
            element.src = src;
            element.addEventListener('load', function load() {
                func();
                element.removeEventListener('load', load);
            });
        
            document.body.appendChild(element);
        });
    }
    
    function Story() {
        if (!(this instanceof Story))
            return new Story();
    }
    
    Story.prototype.checkHash              = function(name, callback) {
        this.loadHash(name, function(error, loadHash) {
            var nameHash    = name + '-hash',
                storeHash   = localStorage.getItem(nameHash),
                equal       = loadHash === storeHash;
            
            callback(error, equal);
        });
        
        return this;
    };
    
    Story.prototype.loadHash               = function(name, callback) {
        var query       = '?hash';
        
        restafary.read(name + query, callback);
        
        return this;
    };
    
    Story.prototype.setData                = function(name, data) {
        var nameData    = name + '-data';
        
        localStorage.setItem(nameData, data);
        
        return this;
    };
    
    Story.prototype.setHash                = function(name, hash) {
        var nameHash    = name + '-hash';
        
        localStorage.setItem(nameHash, hash);
        
        return this;
    };
    
    Story.prototype.getData                = function(name) {
        var nameData    = name + '-data',
            data        = localStorage.getItem(nameData);
        
        return data || '';
    };
    
    Story.prototype.getHash                = function(name) {
        var item    = name + '-hash',
            data    = localStorage.getItem(item);
        
        return data || '';
    };

})(this);
