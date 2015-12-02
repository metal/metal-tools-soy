'use strict';

var assert = require('assert');
var del = require('del');
var fs = require('fs');
var metalToolsSoy = require('../index');
var sinon = require('sinon');
var vfs = require('vinyl-fs');

describe('Metal Tools - Soy', function() {
  describe('Default soySrc/soyDest', function() {
    beforeEach(function() {
      var pipe = {
        pipe: function() {
          return pipe;
        }
      };
      sinon.stub(vfs, 'src').returns(pipe);
      sinon.stub(vfs, 'dest');
    });

    afterEach(function() {
      vfs.src.restore();
      vfs.dest.restore();
    });

  	it('should compile soy files from/to "src" folder by default', function() {
      metalToolsSoy();
      assert.strictEqual('src/**/*.soy', vfs.src.args[0][0]);
      assert.strictEqual('src', vfs.dest.args[0][0]);
  	});
  });

  describe('Integration', function() {
    beforeEach(function(done) {
      deleteCompiledSoyFiles(done);
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
  });
});

function deleteCompiledSoyFiles(done) {
  del('test/fixtures/**/*.soy.js').then(function() {
    done();
  });
}
