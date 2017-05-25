'use strict';

const exec = require('execon');

module.exports = function() {
    const value = this.getValue();
    
    this._loadOptions((error, config) => {
        const isDiff = config.diff;
        const isZip = config.zip;
        const doDiff = this._doDiff.bind(this);
        
        exec.if(!isDiff, (patch) => {
            const patchLength = patch && patch.length || 0;
            const {length} = this._Value;
            const isLessMaxLength = length < this._MAX_FILE_SIZE;
            const isLessLength = isLessMaxLength && patchLength < length;
            const isStr = typeof patch === 'string';
            const isPatch = patch && isStr && isLessLength;
            
            this._Value = value;
            
            let query = '';
            
            exec.if(!isZip || isPatch, (equal, data) => {
                const result  = data || this._Value;
                
                if (isPatch)
                    return this._patch(this._FileName, patch);
                
                this._write(this._FileName + query, result);
            }, (func) => {
                this._zip(value, (error, data) => {
                    if (error)
                        console.error(error);
                    
                    query = '?unzip';
                    func(null, data);
                });
            });
            
        }, exec.with(doDiff, this._FileName));
    });
    
    return this;
};

