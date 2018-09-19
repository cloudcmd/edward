'use strict';

module.exports = (f) => {
    const called = {
        value: false,
    };
    
    return (...args) => {
        if (called.value)
            return;
        
        f(...args);
        called.value = true;
    };
};

