var exec, load;

(function(global) {
    'use strict';
    
    if (typeof module !== 'undefined' && module.exports)
        module.exports      = loadRemote;
    else
        global.loadRemote   = loadRemote;
        
    function loadRemote(name, options, callback) {
        var prefix,
            o   = options;
        
        if (!callback)
            callback = options;
        else
            prefix = o.prefix;
        
        if (global[o.name])
            callback();
        else
            exec.parallel(loadModules, loadConfig, function(error, modules, config) {
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
                    return o.noPrefix ? url : o.prefix + url;
                });
                
                remote  = remoteTmpls.map(function(tmpl) {
                    tmpl.replace(/{{\sversion\s}}/g, version);
                });
                
                exec.if(online, funcON, funcOFF);
            });
            
            function loadModules(prefix, callback) {
                var url = prefix + '/json/modules.json';
                
                load.json(url, callback);
            }
            
            function loadConfig(prefix, callback) {
                var url = prefix + '/json/config.json';
                
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
    }
    
})(this);
