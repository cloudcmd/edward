import {run} from 'madrun';

export default {
    'start': () => 'node bin/edward package.json',
    'start:dev': async () => `NODE_ENV=development ${await run('start')}`,
    'lint': () => 'putout .',
    'fresh:lint': () => run('lint', '--fresh'),
    'lint:fresh': () => run('lint', '--fresh'),
    'fix:lint': () => run('lint', '--fix'),
    'watch:server': () => run('watcher', 'bin/edward.js package.json'),
    'build': () => run('build:client*'),
    'build:start': () => run(['build:client', 'start']),
    'build:start:dev': () => run(['build:client:dev', 'start:dev']),
    'prebuild': () => 'rimraf dist*',
    'build-progress': () => 'webpack --progress',
    'build:client': () => run('build-progress', '--mode production'),
    'build:client:dev': async () => `NODE_ENV=development ${await run('build-progress')} --mode development`,
    'watcher': () => 'nodemon -w client -w server --exec',
    'watch:lint': async () => await run('watcher', await run('lint')),
    'watch:client': () => run('build:client', '--watch'),
    'watch:client:dev': () => run('build:client:dev', '--watch'),
    'wisdom': () => run('build'),
};
