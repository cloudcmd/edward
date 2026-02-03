import clipboard from '@cloudcmd/clipboard';
import createElement from '@cloudcmd/create-element';
import once from 'once';
import showMessage from './show-message.js';

const showMessageOnce = once(showMessage);

const resolve = Promise.resolve.bind(Promise);
const reject = Promise.reject.bind(Promise);

export default function(cmd) {
    const NAME = 'editor-clipboard';
    const {_Ace, _story} = this;
    
    const insert = _Ace.insert.bind(_Ace);
    const value = this._Ace.getSelectedText();
    
    if (cmd === 'copy') {
        _story.setData(NAME, value);
        return clipboard.writeText(value);
    }
    
    if (cmd === 'cut') {
        _story.setData(NAME, value);
        return cut(value) ? resolve() : reject();
    }
    
    return clipboard
        .readText()
        .then(insert)
        .catch(() => {
            showMessageOnce('Could not paste from clipboard. Inner buffer used.');
            
            const value = _story.getData(NAME);
            
            insert(value);
        });
}

function cut(value) {
    const textarea = createElement('textarea', {
        value,
    });
    
    textarea.select();
    const result = document.execCommand('cut');
    
    document.body.removeChild(textarea);
    
    return result;
}
