'use strict';

/* global ace */

module.exports = function(keyMap) {
    if (keyMap === 'default')
        keyMap = 'hash_handler';
    
    if (keyMap === 'vim') {
        ace.config.loadModule('ace/keyboard/vim', (module) => {
            const {Vim} = module.CodeMirror;
            Vim.defineEx('write', 'w', this.save.bind(this));
        });
    }
    
    this._Ace.setKeyboardHandler('ace/keyboard/' + keyMap);
};
