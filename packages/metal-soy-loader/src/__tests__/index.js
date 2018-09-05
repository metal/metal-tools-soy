'use strict';

import del from 'del';
import fs from 'fs';
import path from 'path';
import webpack from 'webpack';

const outputDir = path.join(__dirname, '../../tmp');

describe('metal-soy-loader', function() {
	afterAll(done => {
		del(outputDir).then(function() {
			done();
		});
	});

	it(
		'should run webpack without errors',
		done => {
			webpack(
				{
					entry: path.join(__dirname, '../../test/fixtures/Parent.js'),
					module: {
						rules: [
							{
								test: /\.soy$/,
								use: {
									loader: path.join(__dirname, '../../src/index.js'),
									options: {
										src: path.join(__dirname, '../../test/fixtures/*.soy')
									}
								}
							},
							{
								exclude: /(node_modules)/,
								test: /\.js$/,
								use: {
									loader: 'babel-loader',
									options: {
										compact: false,
										presets: ['babel-preset-es2015']
									}
								}
							}
						]
					},
					output: {
						filename: 'bundle.js',
						library: 'metal',
						libraryTarget: 'commonjs2',
						path: outputDir
					}
				},
				(error, stats) => {
					expect(fs.existsSync(path.join(outputDir, 'bundle.js'))).toBe(true);
					expect(stats.hasErrors()).toBe(false);
					expect(stats.hasWarnings()).toBe(false);
					expect(error).toBeNull();

					const bundle = require(path.join(outputDir, 'bundle.js'));

					const component = new bundle.Parent();

					expect(component).toMatchSnapshot();

					done();
				}
			);
		},
		20000
	);
});
