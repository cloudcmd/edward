var exec, load;

(function(global) {
    'use strict';
    
    if (typeof module !== 'undefined' && module.exports)
        module.exports      = new LoadRemote();
    else
        global.loadRemote   = new LoadRemote();
        
    function LoadRemote() {
        var Prefix      = '/',
            loadRemote  = function(name, options, callback) {
                var o   = options;
                
                if (!callback)
                    callback = options;
                
                if (global[o.name])
                    callback();
                else
                    exec.parallel([loadModules, loadOptions], function(error, modules, config) {
                        var remoteTmpls, local, remote,
                            online      = config.online && navigator.onLine, 
                            
                            remoteObj   = findObjByNameInArr(modules, 'remote'),
                            module      = findObjByNameInArr(remoteObj, name),
                            
                            isArray     = Array.isArray(module.local),
                            version     = module.version,
                            
                            funcON      = function() {
                                load.parallel(remote, function(error) {
                                    if (error)
                                        funcOFF();
                                    else
                                        callback();
                                });
                            },
                            
                            funcOFF     = function() {
                                load.parallel(local, callback);
                            };
                            
                        if (isArray) {
                            remoteTmpls = module.remote;
                            local       = module.local;
                        } else {
                           remoteTmpls  = [module.remote];
                           local        = [module.local];
                        }
                        
                        local   = local.map(function(url) {
                            return o.noPrefix ? url : Prefix + url;
                        });
                        
                        remote  = remoteTmpls.map(function(tmpl) {
                            tmpl.replace(/{{\sversion\s}}/g, version);
                        });
                        
                        exec.if(online, funcON, funcOFF);
                    });
                };
            
            loadRemote.setPrefix      = function(prefix) {
                Prefix = prefix;
                
                return loadRemote;
            };
            
            loadRemote.load         = loadRemote;
            
            function loadModules(callback) {
                var url = Prefix + '/json/modules.json';
                
                load.json(url, callback);
            }
            
            function loadOptions(callback) {
                var url = Prefix + '/options.json';
                
                load.json(url, callback);
            }
            
            function findObjByNameInArr(array, name) {
                var ret,
                    isArray = Array.isArray(array);
                
                if (isArray) {
                    array.some(function(item) {
                        var is = item.name === name,
                            isArray = Array.isArray(item);
                        
                        if (is)
                            ret = item;
                        else if (isArray)
                            item.some(function(item) {
                                is = item.name === name;
                                
                                if (is)
                                    ret = item.data;
                            });
                        
                        return is;
                    });
                }
                
                return ret;
            }
            
            return loadRemote;
    }
    
})(this);
