'use strict';

const DIR_ROOT = __dirname + '/..';
const path = require('path');

const restafary = require('restafary');
const socketFile = require('socket-file');
const {Router} = require('express');
const currify = require('currify');
const join = require('join-io');

const storage = require('fullstore');
const editFn = require('./edit');

const rootStorage = storage();
const optionsStorage = storage();

const edward = currify(_edward);
const optionsFn = currify(configFn);
const restafaryFn = currify(_restafaryFn);
const joinFn = currify(_joinFn);

const readjson = require('readjson');
const HOME = require('os').homedir();

const isDev = process.env.NODE_ENV === 'development';

const readJSHINT = () => {
    const home = path.join(HOME, '.jshintrc');
    const root = path.join(DIR_ROOT,'.jshintrc')
    
    return readjson.sync.try(home) || readjson.sync(root);
}

const jshint = readJSHINT();

module.exports = (options) => {
    options = options || {};
    optionsStorage(options);
    
    const router = Router();
    const prefix = options.prefix || '/edward';
    
    router.route(prefix + '/*')
        .get(edward(prefix))
        .get(optionsFn(options))
        .get(editFn)
        .get(modulesFn)
        .get(jshintFn)
        .get(restafaryFn(''))
        .get(joinFn(options))
        .get(staticFn)
        .put(restafaryFn(prefix));
    
    return router;
};

module.exports.listen = (socket, options) => {
    options = options || {};
    
    const {
        root = '/',
        auth,
        prefixSocket = '/edward',
    } = options;
    
    rootStorage(root);
    
    return socketFile(socket, {
        root,
        auth,
        prefix: prefixSocket,
    });
};

function checkOption(isOption) {
    if (typeof isOption === 'function')
        return isOption();
    
    if (typeof isOption === 'undefined')
        return true;
    
    return isOption;
}

function _edward(prefix, req, res, next) {
    const {url} = req;
    
    req.url = url.replace(prefix, '');
    
    if (/^\/edward\.js(\.map)?$/.test(req.url))
        req.url = `/dist${req.url}`;
    
    if (isDev)
        req.url = req.url.replace(/^\/dist\//, '/dist-dev/');
    
    next();
}

function configFn(o, req, res, next) {
    const online = checkOption(o.online);
    const diff = checkOption(o.diff);
    const zip = checkOption(o.zip);
    
    if (req.url.indexOf('/options.json'))
        return next();
    
    res .type('json')
        .send({
            diff,
            zip,
            online,
        });
}

function jshintFn(req, res, next) {
    if (req.url.indexOf('/jshint.json'))
        return next();
    
    res .type('json')
        .send(jshint);
}

function modulesFn(req, res, next) {
    if (req.url.indexOf('/modules.json'))
        return next();
    
    req.url = '/json/' + req.url;
    
    next();
}

function _joinFn(o, req, res, next) {
    if (req.url.indexOf('/join'))
        return next ();
    
    const joinFunc = join({
        dir: DIR_ROOT
    });
    
    joinFunc(req, res, next);
}

function _restafaryFn(prefix, req, res, next) {
    const url = req.url
    const api = '/api/v1/fs';
    const indexOf = url.indexOf.bind(url);
    const not = (fn) => (a) => !fn(a);
    const isRestafary = [
        `${prefix}/api/v1/fs`,
        '/restafary.js'
    ].some(not(indexOf));
    
    if (!isRestafary)
        return next();
    
    req.url = url.replace(prefix, '');
    
    const restafaryFunc = restafary({
        prefix: api,
        root: rootStorage()
    });
    
    restafaryFunc(req, res, next);
}

function staticFn(req, res) {
    const file = path.normalize(DIR_ROOT + req.url);
    res.sendFile(file);
}

