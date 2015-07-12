(function() {
    'use strict';
    
    var DIR_ROOT            = __dirname + '/..',
        
        path                = require('path'),
        
        join                = require('join-io'),
        mollify             = require('mollify'),
        socketFile          = require('socket-file'),
        readjson            = require('readjson'),
        tryCatch            = require('try-catch'),
        
        HOME                = require('os-homedir')(),
        Edit,
        error,
        
        minifyFunc          = mollify({
            dir     : DIR_ROOT
        });
    
    error = tryCatch(function() {
        Edit = readjson.sync(HOME + '/.edward.json');
    });
    
    if (error) {
        if (error.code !== 'ENOENT')
            console.error('edward:', error.message);
        
        Edit = readjson.sync(DIR_ROOT + '/json/edit.json');
    }
    
    module.exports          = function(options) {
        return serve.bind(null, options);
    };
    
    module.exports.listen   = function(socket, options) {
        var ret;
        
        if (!options)
            options = {};
        
        if (!options.prefix)
            options.prefix = '/edward';
        
        if (!options.root)
            options.root = '/';
        
        ret = socketFile(socket, options);
        
        return ret;
    };
    
    function checkOption(isOption) {
        var is,
            type    = typeof isOption;
        
        switch(type) {
        case 'function':
            is = isOption();
            break;
        
        case 'undefined':
            is = true;
            break;
        
        default:
            is = isOption;
        }
        
        return is;
    }
    
    function serve(options, req, res, next) {
        var joinFunc, isJoin, isConfig, isEdit,
            
            o           = options || {},
            isMin       = checkOption(o.minify),
            isOnline    = checkOption(o.online),
            isDiff      = checkOption(o.diff),
            isZip       = checkOption(o.zip),
            
            url         = req.url,
            prefix      = o.prefix || '/edward',
            
            isEdward    = !url.indexOf(prefix),
            EDIT        = '/edit.json',
            
            URL         = '/edward.js',
            CONFIG      = '/options.json',
            MODULES     = '/modules.json',
            PATH        = '/lib/client.js',
            
            sendFile    = function() {
                url = path.normalize(DIR_ROOT + url);
                res.sendFile(url);
            };
        
        if (!isEdward) {
            next();
        } else {
           url         = url.replace(prefix, '');
            
            isJoin      = !url.indexOf('/join');
            isConfig    = url === CONFIG;
            isEdit      = url === EDIT;
            
            switch(url) {
            case URL:
                url = PATH;
                break;
            
            case MODULES:
                url = '/json' + url;
                break;
            }
            
            req.url = url;
            
             if (isEdit) {
                res .type('json')
                    .send(Edit);
            } else if (isConfig) {
                res .type('json')
                    .send({
                        diff: isDiff,
                        zip: isZip,
                        online: isOnline
                    });
            } else if (isJoin) {
                joinFunc = join({
                    dir     : DIR_ROOT,
                    minify  : isMin
                });
                
                joinFunc(req, res, next);
            } else if (isMin) {
                minifyFunc(req, res, sendFile);
            } else {
                sendFile();
            }
        }
    }
})();
