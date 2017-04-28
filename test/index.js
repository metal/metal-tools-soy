'use strict';

var assert = require('assert');
var del = require('del');
var fs = require('fs');
var metalToolsSoy = require('../index');
var sinon = require('sinon');
var vfs = require('vinyl-fs');

describe('Metal Tools - Soy', function() {
  beforeEach(function() {
    var stream = {
      pipe: function() {
        return stream;
      },
      readable: true,
      resume: sinon.stub()
    };
    sinon.stub(vfs, 'src').returns(stream);
    sinon.stub(vfs, 'dest');
  });

  afterEach(function() {
    restoreStream();
  });

	it('should compile soy files from/to "src" folder by default', function() {
    metalToolsSoy();
    assert.strictEqual('src/**/*.soy', vfs.src.args[0][0]);
    assert.strictEqual('src', vfs.dest.args[0][0]);
	});

	it('should compile soy files to multiple "dest" folder', function() {
    metalToolsSoy({dest: ['src1', 'src2']});
    assert.strictEqual('src1', vfs.dest.args[0][0]);
    assert.strictEqual('src2', vfs.dest.args[1][0]);
	});

  it('should consume stream by default', function() {
    var stream = metalToolsSoy({
      src: 'test/fixtures/soy/simple.soy',
      dest: 'test/fixtures/soy'
    });
    assert.strictEqual(1, stream.resume.callCount);
  });

  it('should not consume stream if skipConsume is set to true', function() {
    var stream = metalToolsSoy({
      src: 'test/fixtures/soy/simple.soy',
      dest: 'test/fixtures/soy',
      skipConsume: true
    });
    assert.strictEqual(0, stream.resume.callCount);
  });

  describe('Integration', function() {
    beforeEach(function(done) {
      deleteCompiledSoyFiles(done);
      restoreStream();
    });

  	after(function(done) {
      deleteCompiledSoyFiles(done);
  	});

  	it('should compile specified soy files to js', function(done) {
      var stream = metalToolsSoy({
        src: 'test/fixtures/soy/simple.soy',
        dest: 'test/fixtures/soy'
      });
      stream.on('end', function() {
        assert.ok(fs.existsSync('test/fixtures/soy/simple.soy.js'));
    		done();
      });
  	});

    it('should emit error and end stream when the soy jar compiler throws an error', function(done) {
      var stream = metalToolsSoy({
        src: 'test/fixtures/soy/compileError.soy',
        dest: 'test/fixtures/soy'
      });
      sinon.stub(console, 'error');
      stream.on('end', function() {
        assert.strictEqual(1, console.error.callCount);
        done();
      });
    });

    it('should use custom handleError function', function(done) {
      var stream = metalToolsSoy({
        dest: 'test/fixtures/soy',
        handleError: function(err) {
          assert.ok(err);
          assert.ok(err.message);

          done();
        },
        src: 'test/fixtures/soy/compileError.soy'
      });
    });
  });
});

function deleteCompiledSoyFiles(done) {
  del('test/fixtures/**/*.soy.js').then(function() {
    done();
  });
}

function restoreStream() {
  if (vfs.src.restore) {
    vfs.src.restore();
  }
  if (vfs.dest.restore) {
    vfs.dest.restore();
  }
}
