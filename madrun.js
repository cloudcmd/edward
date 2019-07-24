'use strict';

const {
    run,
    parallel,
} = require('madrun');

module.exports = {
    'start': () => 'node bin/edward package.json',
    'start:dev': () => `NODE_ENV=development ${run('start')}`,
    'lint:bin': () => 'eslint --rule \'no-console:0\' bin',
    'lint:client': () => 'eslint --env browser --rule \'no-console:0\' client',
    'lint:server': () => 'eslint server madrun.js webpack.config.js',
    'lint': () => parallel(['putout', 'lint:*']),
    'fix:lint': () => run(['putout', 'lint:*'], '--fix'),
    'putout': () => `putout client server webpack.config.js`,
    'watch:server': () => run('watcher', 'bin/edward.js package.json'),
    'build': () => run('build:client*'),
    'build:start': () => run(['build:client', 'start']),
    'build:start:dev': () => run(['build:client:dev', 'start:dev']),
    'prebuild': () => 'rimraf dist*',
    'build-progress': () => 'webpack --progress',
    'build:client': () => run('build-progress', '--mode production'),
    'build:client:dev': () => `NODE_ENV=development ${run('build-progress')} --mode development`,
    'watcher': () => 'nodemon -w client -w server --exec',
    'watch:lint': () => run('watcher', run('lint')),
    'watch:client': () => run('build:client', '--watch'),
    'watch:client:dev': () => run('build:client:dev', '--watch'),
    'wisdom': () => run('build'),
};

