'use strict';

module.exports = Story;

function Story() {
    if (!(this instanceof Story))
        return new Story();
}

Story.prototype.checkHash              = function(name, callback) {
    this.loadHash(name, function(error, loadHash) {
        var nameHash    = name + '-hash',
            storeHash   = localStorage.getItem(nameHash),
            equal       = loadHash === storeHash;
        
        callback(error, equal);
    });
    
    return this;
};

Story.prototype.loadHash               = function(name, callback) {
    var query       = '?hash';
    
    restafary.read(name + query, callback);
    
    return this;
};

Story.prototype.setData                = function(name, data) {
    var nameData    = name + '-data';
    
    localStorage.setItem(nameData, data);
    
    return this;
};

Story.prototype.setHash                = function(name, hash) {
    var nameHash    = name + '-hash';
    
    localStorage.setItem(nameHash, hash);
    
    return this;
};

Story.prototype.getData                = function(name) {
    var nameData    = name + '-data',
        data        = localStorage.getItem(nameData);
    
    return data || '';
};

Story.prototype.getHash                = function(name) {
    var item    = name + '-hash',
        data    = localStorage.getItem(item);
    
    return data || '';
};

