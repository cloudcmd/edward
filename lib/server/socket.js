(function() {
    'use strict';
    
    var fs          = require('fs'),
        path        = require('path'),
        
        patch       = require('patchfile'),
        ashify      = require('ashify'),
        
        mellow      = require('mellow');
    
    module.exports          = function(size, sock) {
        sock.of('/edward')
            .on('connection', function(socket) {
                socket.on('patch', function(name, data) {
                    var options = {
                            size: size
                        };
                        
                        name = mellow.convertPath(name);
                        
                        getHash(name, function(error, hash) {
                            if (error)
                                socket.emit('err', error.message);
                            else
                                patch(name, data, options, function(error) {
                                    var msg, baseName;
                                    
                                    if (error) {
                                        socket.emit('err', error.message);
                                    } else {
                                        baseName    = path.basename(name),
                                        msg         = 'patch: ok("' + baseName + '")';
                                        
                                        socket.emit('message', msg);
                                        socket.broadcast.emit('patch', name, data, hash);
                                    }
                                });
                        });
                });
            });
    };
    
    function getHash(name, callback) {
        var stream  = fs.createReadStream(name),
            options = {
                algorithm: 'sha1',
                encoding: 'hex'
            };
        
        ashify(stream, options, callback);
    }
})();
