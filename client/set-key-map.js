'use strict';

/* global ace */

module.exports = function(options) {
    let keyMap = options && options.keyMap;
    
    if (keyMap === 'default')
        keyMap = 'hash_handler';
    
    if (!keyMap)
        return;
    
    this._Ace.setKeyboardHandler('ace/keyboard/' + keyMap);
    
    if (keyMap === 'vim') {
        ace.config.loadModule('ace/keyboard/vim', (module) => {
            const {Vim} = module.CodeMirror;
            Vim.defineEx('write', 'w', this.save.bind(this));
        });
    }
};
