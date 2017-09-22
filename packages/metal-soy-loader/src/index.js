import loaderUtils from 'loader-utils';
import path from 'path';

import SoyCompiler from './SoyCompiler';

const soyCompiler = new SoyCompiler();

/**
 * metal-soy-loader
 */
export default function metalSoyLoader(contents) {
	const loaderCallback = this.async();
	const loaderOptions = setDefaults(loaderUtils.getOptions(this));

	let resourcePath = this.resourcePath;

	if (path.extname(resourcePath) === '.js') {
		resourcePath = resourcePath.substring(0, resourcePath.indexOf('.js'));
	}

	soyCompiler.checkCache(resourcePath, contents);

	if (soyCompiler.shouldCompile()) {
		soyCompiler.on('error', loaderCallback);
		soyCompiler.compile(loaderOptions.src, loaderOptions.soyDeps);
	}

	if (soyCompiler.isCompiled()) {
		soyCompiler.readFile(resourcePath, loaderCallback);
	} else if (soyCompiler.isCompiling()) {
		const listener = soyCompiler.on('end', () => {
			listener.removeListener();

			soyCompiler.readFile(resourcePath, loaderCallback);
		});
	}
}

/**
 * Sets default loader options
 * @param {!Object} loaderOptions custom loader options from webpack config
 * @return {Object} loader options
 */
function setDefaults(loaderOptions) {
	loaderOptions = loaderOptions || {};

	loaderOptions.soyDeps =
		loaderOptions.soyDeps || 'node_modules/metal*/src/**/*.soy';
	loaderOptions.src = loaderOptions.src || 'src/**/*.soy';

	if (typeof loaderOptions.soyDeps === 'string') {
		loaderOptions.soyDeps = [loaderOptions.soyDeps];
	}

	return loaderOptions;
}
