#!/usr/bin/env node


'use strict';

var fs = require('fs');
var args = process.argv.slice(2);
var arg = args[0];

if (!arg) usage();else if (/^(-v|--v)$/.test(arg)) version();else if (/^(-h|--help)$/.test(arg)) help();else checkFile(arg, function (error) {
    if (!error) main(arg);else console.error(error.message);
});

function getPath(name) {
    var reg = /^(~|\/)/;

    if (!reg.test(name)) name = process.cwd() + '/' + name;

    return name;
}

function main(name) {
    var filename = getPath(name);
    var DIR = __dirname + '/../assets/';
    var edward = require('..');
    var http = require('http');
    var express = require('express');
    var io = require('socket.io');

    var app = express();
    var server = http.createServer(app);

    var env = process.env;

    var port = env.PORT || /* c9           */
    env.VCAP_APP_PORT || /* cloudfoundry */
    1337;

    var ip = env.IP || /* c9           */
    '0.0.0.0';

    app.use(express.static(DIR)).use(edward({
        diff: true,
        zip: true
    }));

    server.listen(port, ip);

    var socket = io.listen(server);
    var edSocket = edward.listen(socket);

    edSocket.on('connection', function () {
        fs.readFile(name, 'utf8', function (error, data) {
            if (error) console.error(error.message);else edSocket.emit('file', filename, data);
        });
    });

    console.log('url: http://' + ip + ':' + port);
}

function checkFile(name, callback) {
    fs.stat(name, function (error, stat) {
        var msg = void 0;

        if (error && error.code === 'ENOENT') msg = Error('no such file or directory: \'' + name + '\'');else if (stat.isDirectory()) msg = Error('\'' + name + '\' is directory');

        callback(msg);
    });
}

function version() {
    console.log('v' + info().version);
}

function info() {
    return require('../package');
}

function usage() {
    console.log('Usage: ' + info().name + ' [filename]');
}

function help() {
    var bin = require('../json/bin');

    usage();
    console.log('Options:');

    Object.keys(bin).forEach(function (name) {
        console.log('  ' + name + ' ' + bin[name]);
    });
}