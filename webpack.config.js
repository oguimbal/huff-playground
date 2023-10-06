const webpack = require('webpack');
const path = require('path');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const APP_DIR = path.resolve(__dirname, './src');
const MONACO_DIR = path.resolve(__dirname, './node_modules/monaco-editor');
const HtmlWebPackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

const ouptutpath = path.resolve(__dirname, 'dist');
require('rimraf').sync(ouptutpath);

module.exports = [
    {
        devtool: 'source-map',
        optimization: {
            minimize: true,
            namedModules: true,
            concatenateModules: true,
        },
        experiments: {
            asyncWebAssembly: true,
        },
        module: {
            rules: [
                {
                    test: /\.ts(x?)$/,
                    use: ['ts-loader'],
                    // use: {
                    //     loader: 'babel-loader',
                    //     options: {
                    //     presets: ['@babel/preset-env'],
                    //     },
                    // },
                }, {
                    test: /\.css$/,
                    include: APP_DIR,
                    use: ['style-loader', 'css-loader', 'postcss-loader'],
                }, {
                    test: /\.css$/,
                    include: MONACO_DIR,
                    use: ['style-loader', 'css-loader'],
                },
                {
                    test: /\.svg$/,
                    use: [
                        {
                            loader: 'svg-url-loader',
                            options: {
                                limit: 10000,
                            },
                        },
                    ],
                },
                {
                    test: /\.(eot|otf|ttf|woff|woff2|png)$/,
                    type: 'asset/resource',
                },

            ],
        },
        resolve: {
            extensions: ['.css', '.tsx', '.ts', '.js'],
            alias: {
                'react-dom': '@hot-loader/react-dom',
                'process': 'process/browser'
            },
            fallback: {
                'assert': require.resolve("assert/"),
                "buffer": require.resolve("buffer/"),
                "url": require.resolve("url/"),
                "http": require.resolve("stream-http"),
                "https": require.resolve("https-browserify"),
                "stream": require.resolve("stream-browserify"),
                "util": require.resolve("util/"),
                "path": require.resolve("path-browserify"),
                "zlib": require.resolve("browserify-zlib"),
                "os": require.resolve("os-browserify/browser"),
                fs: false,
                encoding: false,
            },
        },
        devServer: {
            static: { directory: path.join(__dirname, 'dist') },
            compress: true,
            port: 9009
        },
        plugins: [
            new webpack.ProvidePlugin({
                process: 'process/browser',
                Buffer: ['buffer', 'Buffer'],
            }),
            new HtmlWebPackPlugin({
                template: path.resolve(__dirname, 'src/index.html'),
                filename: 'index.html'
            }),
            new CopyPlugin({
                patterns: [
                    { from: 'src/index.css', to: 'index.css' },
                    { from: 'src/*.svg', to: '*.svg' },
                ],
            }),
            new MonacoWebpackPlugin({
                // available options are documented at https://github.com/microsoft/monaco-editor/tree/136ce723f73b8bd284565c0b7d6d851b52161015/src/basic-languages
                languages: ['solidity']
            }),
            new webpack.EnvironmentPlugin({ NODE_ENV: 'development' }),
        ],
        entry: {
            playground: ['react-hot-loader/patch', './src/index.tsx'],
        },
        output: {
            path: ouptutpath,
            filename: '[name].js',
            chunkFilename: '[id].[chunkhash].js',
            wasmLoading: 'fetch',
        },
        optimization: {
            runtimeChunk: 'single',
            splitChunks: {
                chunks: 'all',
                maxInitialRequests: Infinity,
                minSize: 0,
                cacheGroups: {
                    vendor: {
                        test: /[\\/]node_modules[\\/]/,
                        name(module) {
                            // get the name. E.g. node_modules/packageName/not/this/part.js
                            // or node_modules/packageName
                            const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];

                            // npm package names are URL-safe, but some servers don't like @ symbols
                            return `npm.${packageName.replace('@', '')}`;
                        },
                    },
                },
            },
        },
    },
];