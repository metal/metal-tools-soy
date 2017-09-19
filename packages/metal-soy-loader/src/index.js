const fs = require('fs');
const glob = require('glob');
const metalsoy = require('metal-tools-soy');
const path = require('path');
const rimraf = require('rimraf');
const tmp = require('tmp');

/**
 * metal-soy-loader
 */
module.exports = function() {
	const loaderCallback = this.async();
	const tmpDir = tmp.dirSync();

	let resourcePath = this.resourcePath;

	if (path.extname(resourcePath) === '.js') {
		resourcePath = resourcePath.substring(0, resourcePath.indexOf('.js'));
	}

	const templates = glob.sync('**/*.soy').map(filePath => path.resolve(filePath));

	const src = templates.filter(
		filePath => !/node_modules/.test(filePath) && filePath !== resourcePath,
	);

	const soyDeps = templates.filter(filePath => /node_modules/.test(filePath));

	// Its important that the current file it kept at
	// the end of the src files. This way using same name in
	// files does not produce an overwritten result.
	src.push(resourcePath);

	/**
	* Handles the compilation end.
	* Emits an error if there where a problem during the compilation
	* process or if there is no result file.
	*/
	const handleEnd = error => {
		let result = '';

		if (!error) {
			try {
				result = fs.readFileSync(
					`${tmpDir.name}/${path.basename(resourcePath)}.js`,
					'utf-8',
				);
			} catch (e) {
				error = e;
			}
		}

		rimraf.sync(tmpDir.name);
		loaderCallback(error, result);
	};

	/**
	 * @param error
	 */
	const handleError = error => {
		handleEnd(error);
	};

	metalsoy({
		dest: tmpDir.name,
		handleError,
		soyDeps,
		src,
	}).on('end', handleEnd);
};
