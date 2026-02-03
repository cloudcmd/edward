'use strict';

const {confirm} = require('smalltalk');
const {tryToCatch} = require('try-to-catch');
const {promisify} = require('es6-promisify');
const write = promisify(require('restafary/client').write);

module.exports = async function(error, text) {
    const edward = this;
    
    const {
        _value,
        _filename,
        _title,
    } = edward;
    
    let msg = 'Try again?';
    
    if (error) {
        if (error.message)
            msg = error.message + '\n' + msg;
        else
            msg = `Can't save.` + msg;
        
        const [cancel] = await tryToCatch(confirm, _title, msg);
        
        if (!cancel) {
            const [error, text] = await tryToCatch(write, _filename, this._value);
            return this._onSave(error, text);
        }
        
        edward.focus();
    }
    
    edward.showMessage(text);
    
    const hash = edward.sha();
    this
        ._story
        .setData(_filename, _value)
        .setHash(_filename, hash);
    
    this._Emitter.emit('save', _value.length);
};
