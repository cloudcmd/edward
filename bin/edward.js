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
        var str = rendy('Edward not ready to read "{{ name }}"', {
            name: arg
        });
        
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
