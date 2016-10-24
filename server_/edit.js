'use strict';

var readjson = require('readjson');

var Edit = require('../json/edit.json');
var HOME = require('os-homedir')();

module.exports = function (req, res, next) {
    if (req.url !== '/edit.json') return next();

    readEdit(function (error, data) {
        if (error) res.status(404).send(error.message);else res.type('json').send(data);
    });
};

function replace(from, to) {
    Object.keys(from).forEach(function (name) {
        to[name] = from[name];
    });
}

function copy(from) {
    return Object.keys(from).reduce(function (value, name) {
        value[name] = from[name];
        return value;
    }, {});
}

function readEdit(callback) {
    var homePath = HOME + '/.edward.json';

    readjson(homePath, function (error, edit) {
        var data = copy(Edit);

        if (!error) replace(edit, data);else if (error.code !== 'ENOENT') error = Error('edward --config ' + homePath + ': ' + error.message);else error = null;

        callback(error, data);
    });
}