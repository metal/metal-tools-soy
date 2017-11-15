import md5 from 'md5';
import compileSoy from 'metal-tools-soy/lib/pipelines/compileSoy';
import path from 'path';
import vfs from 'vinyl-fs';
import { EventEmitter } from 'metal-events';

/**
 * SoyCompiler class.
 * @extends EventEmitter
 */
class SoyCompiler extends EventEmitter {
	/**
	 * Constructor
	 * @param {*} props
	 */
	constructor(props) {
		super(props);

		this._cacheMap = {};

		this._compiledSoy = {};

		this.setCompiling_(false);

		this.setCompiled_(false);

		this.setError_(null);
	}

	/**
	 * Invalidates cache based on md5 hash of soy file contents
	 * @param {!string} resourcePath path to soy file
	 * @param {!string} contents contents of `resourcePath` file
	 */
	checkCache(resourcePath, contents) {
		const hash = md5(contents);
		const prevHash = this.getFileHash_(resourcePath);

		if (!this.isCompiling() && prevHash && prevHash !== hash) {
			this.invalidate_();
		}

		this.setFileHash_(resourcePath, hash);
	}

	/**
	 * Triggers an async compile of soy files
	 * @param {!string|!Array} src glob patters of src soy files
	 * @param {!string|!Array} soyDeps glob patters of soy dependencies
	 */
	compile(src, soyDeps) {
		this.setCompiling_(true);
		this.setError_(null);

		const stream = vfs.src(src).pipe(
			compileSoy({
				soyDeps,
			}).on('error', this.handleError_.bind(this)),
		);

		stream.on('data', file => {
			let filePath = file.path;

			if (path.extname(filePath) === '.js') {
				filePath = filePath.substring(0, filePath.indexOf('.js'));
			}

			this._compiledSoy[filePath] = file.contents.toString();
		});

		stream.on('end', this.handleEnd_.bind(this));
	}

	/**
	 *
	 * @param {!string} resourcePath path to soy file
	 * @return {string} returns stored hash of soy file
	 */
	getFileHash_(resourcePath) {
		return this._cacheMap[resourcePath];
	}

	/**
	 * Returns compiled soy
	 * @param {!string} resourcePath path to soy file
	 * @return {string} compiled soy file
	 */
	getCompiledSoy(resourcePath) {
		return this._compiledSoy[resourcePath];
	}

	/**
	 * Return existing compilation error
	 * @returns {Error|null} Existing error or a null value
	 */
	getError() {
		return this._error;
	}

	/**
	 * @fires SoyCompiler#end
	 */
	handleEnd_() {
		this.setCompiled_(true);
		this.setCompiling_(false);

		/**
		 * error event
		 * @event SoyCompiler#end
		 */
		this.emit('end');
	}

	/**
	 * @fires SoyCompiler#error
	 * @param {Error} error
	 */
	handleError_(error) {
		this.setError_(error);

		/**
		 * error event
		 * @event SoyCompiler#error
		 * @type {error}
		 */
		this.emit('error', error);
	}

	/**
	 * Resets to initial state of soy compiler
	 */
	invalidate_() {
		this.setCompiled_(false);
		this.setCompiling_(false);
	}

	/**
	 * Returns true if soyCompiler is current compiling soy files
	 * @return {boolean}
	 */
	isCompiling() {
		return this._compiling;
	}

	/**
	 * Returns true if soyCompiler has already compiled soy files
	 * @return {boolean}
	 */
	isCompiled() {
		return this._compiled;
	}

	/**
	 * Sets property that indicates if soyCompiler has already compiled
	 * @param {!boolean} value
	 */
	setCompiled_(value) {
		this._compiled = value;
	}

	/**
	 * Sets property that indicates if soyCompiler is currently compiling
	 * @param {!boolean} value
	 */
	setCompiling_(value) {
		this._compiling = value;
	}

	/**
	 * Changes the existing compilation error
	 * @param {!Error|null} error
	 */
	setError_(error) {
		this._error = error;
	}

	/**
	 *
	 * @param {!string} resourcePath path to soy file
	 * @param {?string} hash md5 hash of file contents
	 */
	setFileHash_(resourcePath, hash) {
		this._cacheMap[resourcePath] = hash;
	}

	/**
	 * Returns true if compile should be triggered
	 * @return {boolean}
	 */
	shouldCompile() {
		return !this.isCompiled() && !this.isCompiling();
	}
}

export default SoyCompiler;
