(function() {
    'use strict';
    
    var DIR_ROOT            = __dirname + '/..',
        
        path                = require('path'),
        
        join                = require('join-io'),
        mollify             = require('mollify'),
        rendy               = require('rendy'),
        
        modules             = require('../json/modules'),
        socket              = require('./socket'),
        
        minifyFunc          = mollify({
            dir     : DIR_ROOT
        });
    
    module.exports          = function(options) {
        return serve.bind(null, options);
    };
    
    module.exports.listen   = socket;
    
    function checkOption(isOption) {
        var is;
        
        if (typeof isOption === 'function')
            is  = isOption();
        else if (isOption === undefined)
            is  = true;
        else
            is  = isOption;
        
        return is;
    }
    
    function serve(options, req, res, next) {
        var joinFunc, isJoin, isModules, isConfig,
            
            o           = options || {},
            isMin       = checkOption(o.minify),
            isOnline    = checkOption(o.online),
            isDiff      = checkOption(o.diff),
            isZip       = checkOption(o.pack),
            
            url         = req.url,
            prefix      = o.prefix || '/edward',
            
            isEdward    = !url.indexOf(prefix),
            
            URL         = prefix + '/edward.js',
            CONFIG      = prefix + '/config.json',
            PATH        = '/lib/client.js';
        
        if (!isEdward) {
            next();
        } else {
            isJoin      = !url.indexOf(prefix + '/join');
            isModules   = url === prefix + '/modules.json';
            isConfig    = url === CONFIG;
            
            if (url === URL)
                url = PATH;
            else
                url = url.replace(prefix, '');
            
            req.url = url;
            
            if (isModules) {
                modulesFunc(prefix, isOnline, req, res, next);
            } else if (isJoin) {
                joinFunc = join({
                    dir     : DIR_ROOT,
                    minify  : isMin
                });
                
                joinFunc(req, res, next);
            } else if (isMin) {
                minifyFunc(req, res, next);
            } else if (isConfig) {
                res.type('json');
                
                res.send({
                    diff: isDiff,
                    zip: isZip
                });
            } else {
                url = path.normalize(DIR_ROOT + url);
                console.log(url)
                res.sendFile(url);
            }
        }
    }
    
    function modulesFunc(prefix, online, req, res) {
        var urls        = [],
            urlJoin     = '',
            urlSocket   = '',
            urlJquery   = '';
        
        if (online) {
            urls = modules.map(function(m) {
                return rendy(m.remote, {
                    version: m.version
                });
            });
        } else {
            urlJoin     = prefix + '/join';
            urlJquery   = prefix;
            
            modules.forEach(function(m) {
                if (m.name === 'socket')
                    urlSocket   = m.local;
                else
                    urlJoin     += ':' + m.local;
            });
            
            urls = [urlSocket, urlJoin];
        }
        
        res.type('json');
        res.send(urls);
    }
})();
