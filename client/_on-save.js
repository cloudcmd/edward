import {confirm} from 'smalltalk';
import {tryToCatch} from 'try-to-catch';
import {promisify} from 'es6-promisify';
import {write} from 'restafary/client';

const _write = promisify(write);

export async function _onSave(error, text) {
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
            const [error, text] = await tryToCatch(_write, _filename, this._value);
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
}
