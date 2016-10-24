'use strict';

var DIR_ROOT = __dirname + '/..';
var path = require('path');

var restafary = require('restafary');
var socketFile = require('socket-file');
var express = require('express');
var currify = require('currify');
var mollify = require('mollify');
var join = require('join-io');

var storage = require('./storage');
var editFn = require('./edit');

var Router = express.Router;

var rootStorage = storage();
var optionsStorage = storage();

var optionsFn = currify(configFn);
var restafaryFn = currify(_restafaryFn);
var joinFn = currify(_joinFn);

var readjson = require('readjson');
var HOME = require('os-homedir')();

var readJSHINT = function readJSHINT() {
    var home = path.join(HOME, '.jshintrc');
    var root = path.join(DIR_ROOT, '.jshintrc');

    return readjson.sync.try(home) || readjson.sync(root);
};

var jshint = readJSHINT();

var minifyFunc = mollify({
    dir: DIR_ROOT
});

module.exports = function () {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    optionsStorage(options);

    var router = Router();
    var prefix = options.prefix || '/edward';

    router.route(prefix + '/*').get(edward(options)).get(optionsFn(options)).get(editFn).get(modulesFn).get(jshintFn).get(restafaryFn('')).get(joinFn(options)).get(minifyFn).get(staticFn).put(restafaryFn(prefix));

    return router;
};

module.exports.listen = function (socket) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    if (!options.prefix) options.prefix = '/edward';

    if (!options.root) options.root = '/';

    rootStorage(options.root);

    return socketFile(socket, options);
};

function checkOption(isOption) {
    if (typeof isOption === 'function') return isOption();

    if (typeof isOption === 'undefined') return true;

    return isOption;
}

function edward(options) {
    return serve.bind(null, options);
}

function serve(options, req, res, next) {
    var o = options || {};
    var prefix = o.prefix || '/edward';
    var url = req.url;

    if (url.indexOf(prefix)) return next();

    req.url = req.url.replace(prefix, '');

    if (req.url === '/edward.js') req.url = '/client' + req.url;

    next();
}

function configFn(o, req, res, next) {
    var online = checkOption(o.online);
    var diff = checkOption(o.diff);
    var zip = checkOption(o.zip);

    if (req.url.indexOf('/options.json')) return next();

    res.type('json').send({
        diff: diff,
        zip: zip,
        online: online
    });
}

function jshintFn(req, res, next) {
    if (req.url.indexOf('/jshint.json')) return next();

    res.type('json').send(jshint);
}

function modulesFn(req, res, next) {
    if (req.url.indexOf('/modules.json')) return next();

    req.url = '/json/' + req.url;

    next();
}

function _joinFn(o, req, res, next) {
    var minify = checkOption(o.minify);

    if (req.url.indexOf('/join')) return next();

    var joinFunc = join({
        minify: minify,
        dir: DIR_ROOT
    });

    joinFunc(req, res, next);
}

function _restafaryFn(prefix, req, res, next) {
    var url = req.url;

    var api = '/api/v1/fs';
    var indexOf = url.indexOf.bind(url);
    var not = function not(fn) {
        return function (a) {
            return !fn(a);
        };
    };
    var isRestafary = [prefix + '/api/v1/fs', '/restafary.js'].some(not(indexOf));

    if (!isRestafary) return next();

    req.url = url.replace(prefix, '');

    var restafaryFunc = restafary({
        prefix: api,
        root: rootStorage()
    });

    restafaryFunc(req, res, next);
}

function minifyFn(o, req, res, next) {
    var url = req.url;
    var minify = checkOption(o.minify);

    if (!minify) return next();

    var sendFile = function sendFile(url) {
        return function () {
            var file = path.normalize(DIR_ROOT + url);
            res.sendFile(file);
        };
    };

    minifyFunc(req, res, sendFile(url));
}

function staticFn(req, res) {
    var file = path.normalize(DIR_ROOT + req.url);
    res.sendFile(file);
}