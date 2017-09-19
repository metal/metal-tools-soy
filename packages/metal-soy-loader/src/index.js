const { basename, resolve } = require('path');
const fs = require('fs');
const glob = require('glob');
const metalsoy = require('metal-tools-soy');
const rimraf = require('rimraf');
const tmp = require('tmp');

/**
 * metal-soy-loader
 */
module.exports = function() {
	const loaderCallback = this.async();
	const tmpDir = tmp.dirSync();
	let compilationError = null;

	const templates = glob.sync('**/*.soy').map(path => resolve(path));

	const src = templates.filter(
		path => !/node_modules/.test(path) && path !== this.resourcePath,
	);

	const soyDeps = templates.filter(path => /node_modules/.test(path));

	// Its important that the current file it kept at
	// the end of the src files. This way using same name in
	// files does not produce an overwritten result.
	src.push(this.resourcePath);

	/**
	* Handles the compilation end.
	* Emits an error if there where a problem during the compilation
	* process or if there is no result file.
	*/
	const handleEnd = () => {
		let result = '';

		if (!compilationError) {
			try {
				result = fs.readFileSync(
					`${tmpDir.name}/${basename(this.resourcePath)}.js`,
					'utf-8',
				);
			} catch (error) {
				compilationError = error;
			}
		}

		rimraf.sync(tmpDir.name);
		loaderCallback(compilationError, result);
	};

	/**
	 *
	 * @param error
	 */
	const handleError = error => {
		compilationError = error;
		handleEnd();
	};

	metalsoy({
		dest: tmpDir.name,
		handleError,
		soyDeps,
		src,
	}).on('end', handleEnd);
};
