import exec from 'execon';
import load from 'load.js';

/* global ace */
/* global join */
export default function() {
    const {_DIR, _PREFIX} = this;
    
    const dir = `${_DIR}ace-builds/src-min/`;
    const dirVendor = '/vendor/';
    
    const {extensions} = this._Config;
    const isEmmet = extensions.emmet;
    
    if (!isEmmet)
        return;
    
    exec.if(this._Emmet, () => {
        this.setOption('enableEmmet', true);
    }, async (callback) => {
        const url = _PREFIX + join([
            `${dirVendor}emmet.js`,
            `${dir}ext-emmet.js`,
        ]);
        
        await load.js(url);
        
        this._Emmet = ace.require('ace/ext/emmet');
        this._Emmet.setCore(globalThis.emmet);
        
        callback();
    });
}
