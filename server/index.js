import process from 'node:process';
import path, {dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {restafary} from 'restafary';
import restbox from 'restbox';
import {socketFile} from 'socket-file';
import Router from 'router';
import currify from 'currify';
import join from 'join-io';
import editFn from './edit.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DIR_ROOT = `${__dirname}/..`;
const isUndefined = (a) => typeof a === 'undefined';
const optionsFn = currify(configFn);
const joinFn = currify(_joinFn);
const restboxFn = currify(_restboxFn);
const restafaryFn = currify(_restafaryFn);

const isFn = (a) => typeof a === 'function';

const maybe = (fn) => {
    if (isFn(fn))
        return fn();
    
    return fn;
};

const isDev = process.env.NODE_ENV === 'development';

const cut = currify((prefix, req, res, next) => {
    req.url = req.url.replace(prefix, '');
    next();
});

export function edward(options) {
    options = options || {};
    
    const router = Router();
    const {
        prefix = '/edward',
        root,
        dropbox,
        dropboxToken,
    } = options;
    
    router
        .route(`${prefix}/*path`)
        .all(cut(prefix))
        .get(dist)
        .get(optionsFn(options))
        .get(editFn)
        .get(modulesFn)
        .get(restboxFn({
            prefix,
            root,
            dropbox,
            dropboxToken,
        }))
        .get(restafaryFn(root))
        .get(joinFn(options))
        .get(staticFn)
        .put(restboxFn({
            prefix,
            root,
            dropbox,
            dropboxToken,
        }))
        .put(restafaryFn(root));
    
    return router;
}
edward.listen = (socket, options) => {
    options = options || {};
    
    const {
        root = '/',
        auth,
        prefixSocket = '/edward',
    } = options;
    
    return socketFile(socket, {
        root: maybe(root),
        auth,
        prefix: prefixSocket,
    });
};

function checkOption(isOption) {
    if (isFn(isOption))
        return isOption();
    
    if (isUndefined(isOption))
        return true;
    
    return isOption;
}

function dist(req, res, next) {
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
    
    res
        .type('json')
        .send({
            diff,
            zip,
            online,
        });
}

function modulesFn(req, res, next) {
    if (req.url.indexOf('/modules.json'))
        return next();
    
    req.url = '/json/' + req.url;
    
    next();
}

function _joinFn(o, req, res, next) {
    if (req.url.indexOf('/join'))
        return next();
    
    const joinFunc = join({
        dir: DIR_ROOT,
    });
    
    joinFunc(req, res, next);
}

function _restboxFn({root, dropbox, dropboxToken}, req, res, next) {
    if (!dropbox)
        return next();
    
    const {url} = req;
    const prefix = '/api/v1';
    const indexOf = url.indexOf.bind(url);
    const not = (fn) => (a) => !fn(a);
    
    const is = [`/api/v1`].some(not(indexOf));
    
    if (!is)
        return next();
    
    const middle = restbox({
        prefix,
        token: dropboxToken,
        root: maybe(root),
    });
    
    middle(req, res, next);
}

function _restafaryFn(root, req, res, next) {
    const {url} = req;
    const prefix = '/api/v1/fs';
    const indexOf = url.indexOf.bind(url);
    const not = (fn) => (a) => !fn(a);
    
    const isRestafary = [
        `/api/v1`,
        '/restafary.js',
    ].some(not(indexOf));
    
    if (!isRestafary)
        return next();
    
    const middle = restafary({
        prefix,
        root: maybe(root),
    });
    
    middle(req, res, next);
}

function staticFn(req, res) {
    const file = path.normalize(DIR_ROOT + req.url);
    res.sendFile(file);
}
