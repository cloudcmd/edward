'use strict';

const exec = require('execon');
const load = require('load.js');

/* global ace */
/* global join */

module.exports = function() {
    const {
        _DIR,
        _PREFIX,
    } = this;
    
    const dir = _DIR + 'ace-builds/src-min/';
    const dirVendor = '/vendor/';
    
    const {extensions} = this._Config;
    const isEmmet = extensions.emmet;
    
    if (!isEmmet)
        return;
    
    exec.if(this._Emmet, () => {
        this.setOption('enableEmmet', true);
    }, (callback) => {
        const url = _PREFIX + join([
            dirVendor + 'emmet.js',
            dir + 'ext-emmet.js',
        ]);
        
        load.js(url, () => {
            this._Emmet = ace.require('ace/ext/emmet');
            this._Emmet.setCore(window.emmet);
            
            callback();
        });
    });
};

