(function(global) {
    'use strict';
    
    if (typeof module !== 'undefined' && module.exports)
        module.exports = Emitify;
    else
        global.Emitify = Emitify;
        
    function Emitify() {
        this._all = {};
    }
    
    Emitify.prototype.on   = function(event, callback) {
        var funcs = this._all[event];
        
        if (funcs)
            funcs.push(callback);
        else
            this._all[event] = [callback];
        
        return this;
    };
    
    Emitify.prototype.addListener =
    Emitify.prototype.on;
    
    Emitify.prototype.once  = function(event, callback) {
        var self = this;
        
        this.on(event, function() {
            callback();
            self.off(event, callback);
        });
    };
    
    Emitify.prototype.off   = function(event, callback) {
        var events  = this._all[event] || [],
            index   = events.indexOf(callback);
        
        while (~index)
            events.splice(index, 1);
    };
    
    Emitify.prototype.removeListener    =
    Emitify.prototype.off;
    
    Emitify.prototype.emit = function(event, data) {
        var funcs = this._all[event];
        
        if (funcs)
            funcs.forEach(function(fn) {
                fn(data);
            });
        else if (event === 'error')
            throw data;
    };
    
})(this);
