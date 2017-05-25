'use strict';

module.exports = function(cmd) {
    const NAME = 'editor-clipboard';
    const body = document.body;
    const textarea = document.createElement('textarea');
    
    if (!/^cut|copy|paste$/.test(cmd))
        throw Error('cmd could be "paste", "cut" or "copy" only!');
    
    body.appendChild(textarea);
    
    let result;
    let value;
    
    if (cmd === 'paste') {
        textarea.focus();
        result = document.execCommand(cmd);
        value = textarea.value;
        
        if (!result) {
            this._showMessageOnce('Could not paste from clipboard. Inner buffer used.');
            result = true;
            value = this._story.getData(NAME);
        }
        
        if (value)
            this._Ace.insert(value);
    } else {
        textarea.value = this._Ace.getSelectedText();
        this._story.setData(this._NAME, textarea.value);
        textarea.select();
        result = document.execCommand(cmd);
    }
    
    body.removeChild(textarea);
    
    return result;
};

