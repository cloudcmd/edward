import path, {dirname} from 'node:path';
import {env} from 'node:process';
import {fileURLToPath} from 'node:url';
import {rspack} from '@rspack/core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dir = './client';
const isDev = env.NODE_ENV === 'development';

const dist = path.resolve(__dirname, 'dist');
const distDev = path.resolve(__dirname, 'dist-dev');
const devtool = isDev ? 'eval' : 'source-map';
const notEmpty = (a) => a;
const clean = (array) => array.filter(notEmpty);

const rules = clean([{
    test: /\.js$/,
    exclude: /node_modules/,
    loader: 'babel-loader',
}, {
    test: /\.css$/,
    use: [
        'style-loader',
        'css-loader',
        'clean-css-loader',
    ],
}, {
    test: /\.(png|gif|svg|woff|woff2|eot|ttf)$/,
    type: 'asset',
    parser: {
        dataUrlCondition: {
            maxSize: 50_000,
        },
    },
}]);

export default {
    devtool,
    entry: {
        edward: `${dir}/edward.js`,
    },
    output: {
        library: {
            name: 'edward',
            export: 'default',
            type: 'var',
        },
        filename: '[name].js',
        path: isDev ? distDev : dist,
        pathinfo: isDev,
        devtoolModuleFilenameTemplate,
    },
    module: {
        rules,
    },
    plugins: [
        new rspack.DefinePlugin({
            global: 'globalThis',
        }),
    ],
};

function devtoolModuleFilenameTemplate(info) {
    const resource = info.absoluteResourcePath.replace(__dirname + path.sep, '');
    return `file://edward/${resource}`;
}
