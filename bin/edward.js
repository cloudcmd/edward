#!/usr/bin/env node

(function() {
    'use strict';
    
    var rendy           = require('rendy'),
        args            = process.argv.slice(2),
        arg             = args[0];
        
    if (/^(-v|--v)$/.test(arg))
        version();
    else if (!arg || /^(-h|--help)$/.test(arg))
        help();
    else
        main();
       
    function main() {
        var DIR         = __dirname + '/../html',
        
            edward      = require('../'),
            http        = require('http'),
            
            express     = require('express'),
            io          = require('socket.io'),
            
            app         = express(),
            server      = http.createServer(app),
            
            socket      = io.listen(server),
            
            port        =   process.env.PORT            ||  /* c9           */
                            process.env.app_port        ||  /* nodester     */
                            process.env.VCAP_APP_PORT   ||  /* cloudfoundry */
                            1337,
            
            ip          =   process.env.IP              ||  /* c9           */
                            '0.0.0.0',
            
            str = rendy('Edward not ready to read "{{ name }}"', {
                name: arg
            });
        
        app .use(edward())
            .get('/', function(req, res) {
                res.sendFile(DIR + 'index.html');
            });
        
        edward.listen(socket);
        server.listen(port, ip);
        
        console.log('url: http://' + ip + ':' + port);
        console.log(str);
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
