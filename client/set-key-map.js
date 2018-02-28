'use strict';

/* global ace */

module.exports = function(keyMap) {
    if (keyMap === 'default')
        return this._Ace.setKeyboardHandler('ace/keyboard/hash_handler');
    
    if (keyMap === 'vim') {
        ace.config.loadModule('ace/keybinding/vim', () => {
            const {CodeMirror} = ace.require('ace/keyboard/vim');
            const {Vim} = CodeMirror;
            
            Vim.defineEx('write', 'w', this.save.bind(this));
            
            this._Ace.setOption('keyboardHandler', 'vim');
            this._Ace.setKeyboardHandler('ace/keyboard/' + keyMap);
        });
    }
};
