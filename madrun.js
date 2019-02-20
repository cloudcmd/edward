'use strict';

const {
    run,
    series,
    parallel,
} = require('madrun');

module.exports = {
    'start': () => 'node bin/edward package.json',
    'start:dev': () => `NODE_ENV=development ${run('start')}`,
    'lint:bin': () => 'eslint --rule \'no-console:0\' bin',
    'lint:client': () => 'eslint --env browser --rule \'no-console:0\' client',
    'lint:server': () => 'eslint server madrun.js webpack.config.js',
    'lint': () => parallel(['putout', 'lint:*']),
    'fix:lint': () => series(['putout', 'lint:*'], '--fix'),
    'putout': () => `putout client server webpack.config.js`,
    'watch:server': () => series(['watcher'], 'bin/edward.js package.json'),
    'build': () => run('build:client*'),
    'build:start': () => series(['build:client', 'start']),
    'build:start:dev': () => series(['build:client:dev', 'start:dev']),
    'prebuild': () => 'rimraf dist*',
    'build-progress': () => 'webpack --progress',
    'build:client': () => series(['build-progress'], '--mode production'),
    'build:client:dev': () => `NODE_ENV=development ${run('build-progress')} --mode development`,
    'watcher': () => 'nodemon -w client -w server --exec',
    'watch:lint': () => series(['watcher'], run('lint')),
    'watch:client': () => series(['build:client'], '--watch'),
    'watch:client:dev': () => series(['build:client:dev'], '--watch'),
    'wisdom': () => series(['build']),
};

