'use strict';

module.exports = function storage() {
    var value = void 0;
    return function (data) {
        if (data) value = data;else return value;
    };
};