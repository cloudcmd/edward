'use strict';

const {
    run,
    predefined,
} = require('madrun');

const {putout} = predefined;

module.exports = {
    'start': () => 'node bin/edward package.json',
    'start:dev': () => `NODE_ENV=development ${run('start')}`,
    'lint': () => putout({
        names: [
            'bin',
            'client',
            'server',
            'webpack.config.js',
            '.madrun.js',
        ],
    }),
    'fix:lint': () => run('lint', '--fix'),
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

