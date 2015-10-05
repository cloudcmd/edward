var ace, exec, load, io, join, daffy, restafary, Emitify, loadRemote;
/* global smalltalk */

(function(global) {
    'use strict';
    
    if (typeof module !== 'undefined' && module.exports)
        module.exports  = new Edward();
    else
        global.edward   = new Edward();
    
    function Edward() {
        var Ace,
            Emmet,
            Value,
            Config,
            Options,
            PREFIX,
            Element,
            FileName,
            Modelist,
            ElementMsg,
            JSHintConfig,
            
            Ext,
            
            TITLE           = 'Edward',
            
            DIR             = '/modules/',
            story           = new Story(),
            Emitter,
            MAX_FILE_SIZE   = 512000,
            
            empty       = function() {},
            
            edward      = function(el, options, callback) {
                if (!callback)
                    callback = options;
                
                if (typeof el === 'string')
                    el = document.querySelector(el);
                
                MAX_FILE_SIZE   = options.maxSize || 512000;
                PREFIX          = options.prefix || '/edward';
                
                Element = el || document.body;
                
                Element.addEventListener('drop', onDrop);
                Element.addEventListener('dragover', onDragOver);
                
                loadScript(PREFIX + '/modules/execon/lib/exec.js', function() {
                    init(function() {
                        callback(el);
                    });
                });
                
                return edward;
            };
        
        function init(fn) {
            exec.series([
                loadFiles,
                function(callback) {
                    loadRemote('socket', {
                        name : 'io',
                        prefix: PREFIX,
                        noPrefix: true
                    }, initSocket);
                    
                    callback();
                },
                function() {
                    Emitter     = Emitify();
                    Ace         = ace.edit(Element);
                    Modelist    = ace.require('ace/ext/modelist');
                    
                    ace.require('ace/ext/language_tools');
                    
                    addCommands();
                    
                    Ace.$blockScrolling = Infinity;
                    
                    load.json(PREFIX + '/edit.json', function(error, config) {
                        var options = config.options;
                        
                        fn();
                        
                        Config     = config;
                        edward.setOptions(options);
                    });
                },
            ]);
        }
        
        function addCommands() {
            var commands = [{
                    name    : 'goToLine',
                    bindKey : { win: 'Ctrl-G',  mac: 'Command-G' },
                    exec    : function () {
                        edward.goToLine();
                    }
                }, {
                    name    : 'save',
                    bindKey : { win: 'Ctrl-S',  mac: 'Command-S' },
                    exec    : function() {
                        edward.save();
                    }
                }, {
                    name    : 'saveMC',
                    bindKey : { win: 'F2',  mac: 'F2' },
                    exec    : function() {
                        edward.save();
                    }
                }, {
                    name    : 'beautify',
                    bindKey : { win: 'Ctrl-B',  mac: 'Command-B' },
                    exec    : function() {
                        edward.beautify();
                    }
                }, {
                    name    : 'minify',
                    bindKey : { win: 'Ctrl-M',  mac: 'Command-M' },
                    exec    : function() {
                        edward.minify();
                    }
                }];
            
            commands.forEach(function(command) {
                edward.addCommand(command);
            });
        }
        
        function createMsg() {
            var msg,
                wrapper = document.createElement('div'),
                html    = '<div class="edward-msg">/div>';
            
            wrapper.innerHTML = html;
            msg = wrapper.firstChild;
            
            return msg;
        }
        
        edward.addCommand       = function(options) {
            Ace.commands.addCommand(options);
            
            return edward;
        };
        
        edward.goToLine         = function() {
            var msg     = 'Enter line number:',
                cursor  = edward.getCursor(),
                number  = cursor.row + 1;
                
            smalltalk.prompt(TITLE, msg, number).then(function(line) {
                Ace.gotoLine(line);
            }).catch(empty).then(function() {
                Ace.focus();
            });
            
            return edward;
        };
        
        edward.moveCursorTo     = function(row, column) {
            Ace.moveCursorTo(row, column);
            return edward;
        };
        
        edward.focus            = function() {
            Ace.focus();
            return edward;
        };
        
        edward.remove           = function(direction) {
            Ace.remove(direction);
            return edward;
        };
        
        edward.getCursor        = function() {
            return Ace.selection.getCursor();
        };
        
        edward.getValue         = function() {
            return Ace.getValue();
        };
        
        edward.on               = function(event, fn) {
            Emitter.on(event, fn);
            return edward;
        };
        
        edward.once             = function(event, fn) {
            Emitter.once(event, fn);
            return edward;
        };
        
        edward.isChanged        = function() {
            var value   = edward.getValue(),
                isEqual = value === Value;
            
            return !isEqual;
        };
        
        edward.setValue         = function(value) {
            var session = getSession();
            
            session.setScrollTop(0);
            
            Ace.setValue(value);
            Ace.clearSelection();
            
            Emitter.emit('change');
            
            return edward;
        };
        
        edward.setValueFirst    = function(name, value) {
            var session     = getSession(),
                UndoManager = ace.require('ace/undomanager').UndoManager;
            
            FileName        = name;
            Value           = value;
            
            edward.setValue(value);
            
            session.setUndoManager(new UndoManager());
            
            return edward;
        };
        
        edward.setOption        = function(name, value) {
            Ace.setOption(name, value);
            return edward;
        };
        
        edward.setOptions       = function(options) {
            Ace.setOptions(options);
            return edward;
        };
        
        function setUseOfWorker(mode) {
            var isMatch,
                session = getSession(),
                isStr   = typeof mode === 'string',
                regStr  = 'coffee|css|html|javascript|json|lua|php|xquery',
                regExp  = new RegExp(regStr);
            
            if (isStr)
                isMatch = regExp.test(mode);
            
            session.setUseWorker(isMatch);
            
            return edward;
        }
        
        edward.setMode          = function(mode) {
            var ext,
                modesByName = Modelist.modesByName;
                
            if (modesByName[mode]) {
                ext = modesByName[mode].extensions.split('|')[0];
                edward.setModeForPath('.' + ext);
            }
            
            return edward;
        };
        
        edward.setModeForPath   = function(name) {
            var mode, htmlMode, jsMode, isHTML, isJS,
                session     = getSession(),
                modesByName = Modelist.modesByName;
                
            addExt(name, function(name) {
                mode        = Modelist.getModeForPath(name).mode;
                htmlMode    = modesByName.html.mode;
                jsMode      = modesByName.javascript.mode;
                
                isHTML      = mode === htmlMode;
                isJS        = mode === jsMode;
                    
                session.setMode(mode, function() {
                    setUseOfWorker(mode);
                    
                    if (isHTML)
                        setEmmet();
                    
                    if (isJS && session.getUseWorker())
                        setJsHintConfig();
                });
            });
            
            return edward;
        };
        
        edward.selectAll    = function() {
            Ace.selectAll();
            return edward;
        };
        
        function getSession() {
            return Ace.getSession();
        }
        
        edward.showMessage = function(text) {
            var HIDE_TIME   = 2000;
            
            if (!ElementMsg) {
                ElementMsg = createMsg();
                Element.appendChild(ElementMsg);
            }
            
            ElementMsg.textContent = text;
            ElementMsg.hidden = false;
            
            setTimeout(function() {
                ElementMsg.hidden = true;
            }, HIDE_TIME);
            
            return edward;
        };
        
        edward.sha          = function(callback) {
            var url = PREFIX + DIR + 'jsSHA/src/sha.js';
            
            load.js(url, function() {
                var shaObj, hash, error,
                    value   = edward.getValue();
                
                error = exec.try(function() {
                    shaObj  = new window.jsSHA('SHA-1', 'TEXT');
                    shaObj.update(value);
                    hash    = shaObj.getHash('HEX');
                });
                
                callback(error, hash);
            });
            
            return edward;
        };
        
        edward.beautify = function() {
           readWithFlag('beautify');
           return edward;
        };
        
        edward.minify = function() {
            readWithFlag('minify');
            return edward;
        };
        
        edward.save = function() {
            var value   = edward.getValue();
            
            loadOptions(function(error, config) {
                var isDiff      = config.diff,
                    isZip       = config.zip;
                
                exec.if(!isDiff, function(patch) {
                    var query           = '',
                        patchLength     = patch && patch.length || 0,
                        length          = Value.length,
                        isLessMaxLength = length < MAX_FILE_SIZE,
                        isLessLength    = isLessMaxLength && patchLength < length,
                        isStr           = typeof patch === 'string',
                        isPatch         = patch && isStr && isLessLength;
                    
                    Value               = value;
                    
                    exec.if(!isZip || isPatch, function(equal, data) {
                        var result  = data || Value;
                        
                        if (isPatch)
                            edward.save.patch(FileName, patch);
                        else
                            edward.save.write(FileName + query, result);
                    }, function(func) {
                        zip(value, function(error, data) {
                            if (error)
                                console.error(error);
                            
                            query = '?unzip';
                            func(null, data);
                        });
                    });
                    
                }, exec.with(doDiff, FileName));
            });
            
            return edward;
        };
        
        edward.save.patch = patchHttp;
        edward.save.write = writeHttp;
        
        function loadOptions(callback) {
            var url = PREFIX + '/options.json';
            
            if (Options)
                callback(null, Options);
            else
                load.json(url, function(error, data) {
                    Options = data;
                    callback(error, data);
                });
        }
        
        function patchHttp(path, patch) {
            restafary.patch(path, patch, onSave);
        }
        
        function writeHttp(path, result) {
            restafary.write(path, result, onSave);
        }
        
        function onSave(error, text) {
            var msg     = 'Try again?';
                
            if (error) {
                if (error.message)
                    msg = error.message + '\n' + msg;
                else
                    msg = 'Can\'t save.' + msg;
                
                smalltalk.confirm(TITLE, msg).then(function() {
                    restafary.write(FileName, Value, onSave);
                }).catch(empty).then(function() {
                    Ace.focus();
                });
                
            } else {
                edward.showMessage(text);
                
                edward.sha(function(error, hash) {
                    if (error)
                        console.error(error);
                    
                    story.setData(FileName, Value)
                         .setHash(FileName, hash);
                });
                
                Emitter.emit('save', Value.length);
            }
        }
        
        function doDiff(path, callback) {
            var value = edward.getValue();
            
            diff(value, function(patch) {
                story.checkHash(path, function(error, equal) {
                    if (!equal)
                        patch = '';
                    
                    callback(patch);
                });
            });
        }
        
        function diff(newValue, callback) {
            loadDiff(function(error) {
                var patch;
                
                if (error) {
                    smalltalk.alert(TITLE, error, {cancel: false});
                } else {
                    Value   = story.getData(FileName);
                    patch   = daffy.createPatch(Value, newValue);
                    callback(patch);
                }
            });
        }
        
        function loadDiff(callback) {
             var url = PREFIX + join([
                    'google-diff-match-patch/diff_match_patch.js',
                    'daffy/lib/daffy.js'
                ].map(function(name) {
                    return DIR + name;
                }));
            
            load.js(url, callback);
        }
        
        function zip(value, callback) {
            exec.parallel([
                function(callback) {
                    var url = PREFIX + DIR + 'zipio/lib/zipio.js';
                    load.js(url, callback);
                },
                function(callback) {
                    loadRemote('pako', {prefix: PREFIX}, callback);
                }
            ], function(error) {
                if (error)
                    smalltalk.alert(TITLE, error, {cancel: false});
                else
                    global.zipio(value, callback);
            });
        }
        
        function setEmmet() {
            var dir         = PREFIX + DIR + 'ace-builds/src-noconflict/',
                dirClient   = PREFIX + '/lib/client/',
                extensions  = Config.extensions,
                isEmmet     = extensions.emmet;
            
            if (isEmmet)
                exec.if(Emmet, function() {
                    edward.setOption('enableEmmet', true);
                }, function(callback) {
                    var url;
                    
                    url = PREFIX + join([
                        dirClient   + 'emmet.js',
                        dir         + 'ext-emmet.js'
                    ]);
                    
                    load.js(url, function() {
                        Emmet = ace.require('ace/ext/emmet');
                        Emmet.setCore(window.emmet);
                        
                        callback();
                    });
                });
        }
        
        function setJsHintConfig(callback) {
            var JSHINT_PATH = PREFIX + '/jshint.json',
                func        = function() {
                    var session = getSession(),
                        worker  = session.$worker;
                    
                    if (worker)
                        worker.send('changeOptions', [JSHintConfig]);
                    
                    exec(callback);
                };
            
            exec.if(JSHintConfig, func, function() {
                load.json(JSHINT_PATH, function(error, json) {
                        if (error)
                            smalltalk.alert(TITLE, error, {cancel: false});
                        else
                            JSHintConfig = json;
                        
                        func();
                });
            });
        }
        
        function addExt(name, fn) {
            if (!Ext)
                load.json(PREFIX + '/json/ext.json', function(error, data) {
                    Ext = data;
                    add(error, Ext);
                });
            else
                add(null, Ext);
            
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
        }
        
        function getHost() {
            var l       = location,
                href    = l.origin || l.protocol + '//' + l.host;
            
            return href;
        }
        
        function initSocket(error) {
            var socket,
                href            = getHost(),
                FIVE_SECONDS    = 5000,
                patch    = function(name, data) {
                    socket.emit('patch', name, data);
                };
                
            if (!error) {
                socket  = io.connect(href + PREFIX, {
                    'max reconnection attempts' : Math.pow(2, 32),
                    'reconnection limit'        : FIVE_SECONDS
                });
                
                socket.on('connect', function() {
                    edward.save.patch = patch;
                });
                
                socket.on('message', function(msg) {
                    onSave(null, msg);
                });
                
                socket.on('file', function(name, data) {
                    edward.setModeForPath(name)
                        .setValueFirst(name, data)
                        .moveCursorTo(0, 0);
                });
                
                socket.on('patch', function(name, data, hash) {
                    if (name !== FileName)
                        return;
                    
                    loadDiff(function(error) {
                        var cursor, value;
                        
                        if (error)
                            return console.error(error);
                        
                        if (hash !== story.getHash(name))
                            return;
                            
                        cursor  = edward.getCursor(),
                        value   = edward.getValue();
                        value   = daffy.applyPatch(value, data);
                        
                        edward.setValue(value);
                        
                        edward.sha(function(error, hash) {
                            story.setData(name, value)
                                 .setHash(name, hash);
                            
                            edward.moveCursorTo(cursor.row, cursor.column);
                        });
                    });
                });
                
                socket.on('disconnect', function() {
                    edward.save.patch = patchHttp;
                });
                
                socket.on('err', function(error) {
                    smalltalk.alert(TITLE, error, {cancel: false});
                });
            }
        }
        
        function readWithFlag(flag) {
            var path = FileName;
            
            restafary.read(path + '?' + flag, function(error, data) {
                if (error)
                    smalltalk.alert(TITLE, error, {cancel: false});
                else
                    edward
                        .setValue(data)
                        .moveCursorTo(0, 0);
            });
        }
        
        /**
         * In Mac OS Chrome dropEffect = 'none'
         * so drop do not firing up when try
         * to upload file from download bar
         */
        function onDragOver(event) {
            var dataTransfer    = event.dataTransfer,
                effectAllowed   = dataTransfer.effectAllowed;
            
            if (/move|linkMove/.test(effectAllowed))
                dataTransfer.dropEffect = 'move';
            else
                dataTransfer.dropEffect = 'copy';
            
            event.preventDefault();
        }
        
        function onDrop(event) {
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
        }
        
        function getModulePath(name, lib) {
            var path    = '',
                libdir  = '/',
                dir     = '/modules/';
                
            if (lib)
                libdir  = '/' + lib + '/';
            
            path    = dir + name + libdir + name + '.js';
            
            return path;
        }
        
        function loadFiles(callback) {
            exec.series([
                function(callback) {
                    var obj     = {
                            loadRemote  : getModulePath('loadremote', 'lib'),
                            load        : getModulePath('load'),
                            Emitify     : getModulePath('emitify', 'lib'),
                            join        : '/join/join.js'
                        },
                        
                        scripts = Object.keys(obj)
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
                        ace     = DIR + 'ace-builds/src-noconflict/',
                        
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
        }
        
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
            var story = this;
            
            this.checkHash              = function(name, callback) {
                story.loadHash(name, function(error, loadHash) {
                    var nameHash    = name + '-hash',
                        storeHash   = localStorage.getItem(nameHash),
                        equal       = loadHash === storeHash;
                    
                    callback(error, equal);
                });
                
                return story;
            };
            
            this.loadHash               = function(name, callback) {
                var query       = '?hash';
                
                restafary.read(name + query, callback);
                
                return story;
            };
            
            this.setData                = function(name, data) {
                var nameData    = name + '-data';
                
                localStorage.setItem(nameData, data);
                
                return story;
            };
            
            this.setHash                = function(name, hash) {
                var nameHash    = name + '-hash';
                
                localStorage.setItem(nameHash, hash);
                
                return story;
            };
            
            this.getData                = function(name) {
                var nameData    = name + '-data',
                    data        = localStorage.getItem(nameData);
                
                return data || '';
            };
            
            this.getHash                = function(name) {
                var item    = name + '-hash',
                    data    = localStorage.getItem(item);
                
                return data || '';
            };
        }
        
        return edward;
    }
    
})(this);
