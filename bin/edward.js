#!/usr/bin/env node

(function() {
    'use strict';
    
    var fs              = require('fs'),
        path            = require('path'),
        tryCatch        = require('try-catch'),
        rendy           = require('rendy'),
        args            = process.argv.slice(2),
        arg             = args[0];
        
    if (!arg)
        usage();
    else if (/^(-v|--v)$/.test(arg))
        version();
    else if (/^(-h|--help)$/.test(arg))
        help();
    else
        checkFile(arg, function(error) {
           if (!error)
                main(arg);
            else
                console.error(error.message);
       });
    
    function main(name) {
        var socket,
            cwd         = process.cwd() + '/',
            filename    = path.normalize(cwd + name),
            DIR         = __dirname + '/../assets/',
            edward      = require('../'),
            http        = require('http'),
            express     = require('express'),
            io          = require('socket.io'),
            restafary   = require('restafary'),
            
            app         = express(),
            server      = http.createServer(app),
            
            port        =   process.env.PORT            ||  /* c9           */
                            process.env.app_port        ||  /* nodester     */
                            process.env.VCAP_APP_PORT   ||  /* cloudfoundry */
                            1337,
            ip          =   process.env.IP              ||  /* c9           */
                            '0.0.0.0';
        
        app .use(restafary({
                prefix: '/api/v1/fs'
            }))
            .use(express.static(DIR))
            .use(edward({
                minify: false
            }))
            .get('/file', function(req, res) {
                fs.readFile(name, 'utf8', function(error, data) {
                    if (error)
                        res .status(404)
                            .send(error.message);
                    else
                        res.send({
                            name: filename,
                            data: data
                        });
                });
            });
        
        server.listen(port, ip),
        
        socket      = io.listen(server),
        edward.listen(socket);
        
        console.log('url: http://' + ip + ':' + port);
    }
    
    function checkFile(name, fn) {
        var error = tryCatch(function() {
                var stat = fs.statSync(name);
                
                if (stat.isDirectory())
                    throw(Error(rendy('Error: \'{{ name }}\' is directory', {
                        name: arg
                    })));
            });
        
        if (error && error.code === 'ENOENT')
            error.message = rendy('Error: no such file or directory: \'{{ name }}\'', {
                name: arg
            });
                
        
        fn(error);
    }
    
    function version() {
        console.log('v' + info().version);
    }
    
    function info() {
        return require('../package');
    }
    
    function usage() {
        var msg = 'Usage: ' + info().name + ' [filename]';
        console.log(msg);
    }
    
    function help() {
        var bin         = require('../json/bin');
            
        console.log(usage());
        console.log('Options:');
        
        Object.keys(bin).forEach(function(name) {
            var line = '  ' + name + ' ' + bin[name];
            console.log(line);
        });
    }
})();
