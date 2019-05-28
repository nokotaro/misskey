/**
 * webpack configuration
 */

import * as fs from 'fs';
import * as webpack from 'webpack';
import chalk from 'chalk';
import locales from './locales';
const { copyright } = require('./src/const.json'); // import { copyright } from './src/const.json';
const { version, codename } = require('./package.json'); // import { version, codename } from './package.json';
import { VueLoaderPlugin } from 'vue-loader';
import * as HardSourceWebpackPlugin from 'hard-source-webpack-plugin';
const ProgressBarPlugin = require('progress-bar-webpack-plugin'); // import * as ProgressBarPlugin from 'progress-bar-webpack-plugin';
const TerserPlugin = require('terser-webpack-plugin'); // import * as TerserPlugin from 'terser-webpack-plugin';

class WebpackOnBuildPlugin {
	constructor(readonly callback: (stats: any) => void) {
	}

	public apply(compiler: any) {
		compiler.hooks.done.tap('WebpackOnBuildPlugin', this.callback);
	}
}

const isProduction = process.env.NODE_ENV == 'production';

const postcss = {
	loader: 'postcss-loader',
	options: {
		plugins: [
			require('cssnano')({
				preset: 'default'
			})
		]
	},
};

module.exports = {
	entry: {
		desktop: './src/client/app/desktop/script.ts',
		mobile: './src/client/app/mobile/script.ts',
		dev: './src/client/app/dev/script.ts',
		auth: './src/client/app/auth/script.ts',
		admin: './src/client/app/admin/script.ts',
		test: './src/client/app/test/script.ts',
		calc: './src/client/app/calc/script.ts',
		sw: './src/client/app/sw.js'
	},
	module: {
		rules: [{
			test: /\.vue$/,
			exclude: /node_modules/,
			use: [{
				loader: 'vue-loader',
				options: {
					cssSourceMap: false,
					compilerOptions: {
						preserveWhitespace: false
					}
				}
			}, {
				loader: 'vue-svg-inline-loader'
			}]
		}, {
			test: /\.styl(us)?$/,
			exclude: /node_modules/,
			oneOf: [{
				resourceQuery: /module/,
				use: [{
					loader: 'vue-style-loader'
				}, {
					loader: 'css-loader',
					options: {
						modules: true
					}
				}, postcss, {
					loader: 'stylus-loader'
				}]
			}, {
				use: [{
					loader: 'vue-style-loader'
				}, {
					loader: 'css-loader'
				}, postcss, {
					loader: 'stylus-loader'
				}]
			}]
		}, {
			test: /\.css$/,
			use: [{
				loader: 'vue-style-loader'
			}, {
				loader: 'css-loader'
			}, postcss]
		}, {
			test: /\.(eot|woff|woff2|svg|ttf)([\?]?.*)$/,
			loader: 'url-loader'
		}, {
			test: /\.json5$/,
			loader: 'json5-loader'
		}, {
			test: /\.ts$/,
			exclude: /node_modules/,
			use: [{
				loader: 'ts-loader',
				options: {
					happyPackMode: true,
					configFile: __dirname + '/src/client/app/tsconfig.json',
					appendTsSuffixTo: [/\.vue$/]
				}
			}]
		}]
	},
	plugins: [
		new HardSourceWebpackPlugin(),
		new ProgressBarPlugin({
			format: chalk`{cyan.bold Choco is eating a lot} {bold [}:bar{bold ]} {green.bold :percent} {gray (:current/:total)} :elapseds`,
			complete: '😋',
			incomplete: '🍚',
			width: 100,
			clear: false
		}),
		new webpack.DefinePlugin({
			_COPYRIGHT_: JSON.stringify(copyright),
			_VERSION_: JSON.stringify(version),
			_CODENAME_: JSON.stringify(codename),
			_LANGS_: JSON.stringify(Object.entries(locales).map(([k, v]: [string, any]) => [k, v && v.meta && v.meta.lang])),
			_ENV_: JSON.stringify(process.env.NODE_ENV)
		}),
		new webpack.DefinePlugin({
			'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development')
		}),
		new WebpackOnBuildPlugin(_ => {
			fs.writeFileSync('./built/client/meta.json', JSON.stringify({ version }), 'utf-8');

			fs.mkdirSync('./built/client/assets/locales', { recursive: true });

			for (const [lang, locale] of Object.entries(locales))
				fs.writeFileSync(`./built/client/assets/locales/${lang}.json`, JSON.stringify(locale), 'utf-8');
		}),
		new VueLoaderPlugin(),
		new webpack.optimize.ModuleConcatenationPlugin()
	],
	output: {
		path: __dirname + '/built/client/assets',
		filename: `[name].${version}.js`,
		publicPath: `/assets/`
	},
	resolve: {
		extensions: [
			'.js', '.ts', '.json'
		],
		alias: {
			'const.styl': __dirname + '/src/client/const.styl'
		}
	},
	resolveLoader: {
		modules: ['node_modules']
	},
	optimization: {
		minimizer: [new TerserPlugin()]
	},
	cache: true,
	devtool: false, // 'source-map',
	mode: isProduction ? 'production' : 'development',
	performance: {
		hints: false
	}
};
