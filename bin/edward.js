#!/usr/bin/env node

(function() {
    'use strict';
    
    var error,
        fs              = require('fs'),
        path            = require('path'),
        tryCatch        = require('try-catch'),
        args            = process.argv.slice(2),
        arg             = args[0];
        
    if (/^(-v|--v)$/.test(arg))
        version();
    else if (!arg || /^(-h|--help)$/.test(arg))
        help();
    else {
        error = tryCatch(function() {
            fs.statSync(arg);
        });
        
        if (error)
            console.error(error.message);
        else
            main(arg);
    }
    
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
    
    function version() {
        console.log('v' + info().version);
    }
    
    function info() {
        return require('../package');
    }
    
    function help() {
        var bin         = require('../json/bin'),
            usage       = 'Usage: ' + info().name + ' [filename]';
            
        console.log(usage);
        console.log('Options:');
        
        Object.keys(bin).forEach(function(name) {
            var line = '  ' + name + ' ' + bin[name];
            console.log(line);
        });
    }
})();
