'use strict';

const {
    run,
    series,
    parallel,
} = require('madrun');

module.exports = {
    "lint:bin": () => "eslint --rule 'no-console:0' bin",
    "lint:client": () => "eslint --env browser --rule 'no-console:0' client",
    "lint:server": () => "eslint server webpack.config.js",
    'lint': () => parallel(['putout', 'lint:*']),
    'fix:lint': () => series(['putout', 'lint:*'], '--fix'),
    'putout': () => `putout client server webpack.config.js`,
};

