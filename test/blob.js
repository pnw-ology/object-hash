'use strict';

var assert = require('assert');
var hash = require('../dist/bundles/ts-object-hash.umd.js');

if (typeof Blob !== 'undefined') {
    describe('hash()ing Blob objects', function() {
        var blob;
        before('create blob', function() {
            try {
                blob = new Blob(['ABC']);
            } catch (e) {
                // https://github.com/ariya/phantomjs/issues/11013
                if (!e.message.match(/'\[object BlobConstructor\]' is not a constructor/)) {
                    throw e;
                }

                var builder = new WebKitBlobBuilder();
                builder.append('ABC');
                blob = builder.getBlob();
            }
        });

        it('should throw when trying to hash a blob', function() {
            assert.throws(function() {
                hash.objectHash(blob);
            }, /not supported/);

            assert.throws(function() {
                hash.objectHash({ abcdef: blob });
            }, /not supported/);
        });

        it('should not throw when trying to hash a blob with ignoreUnknown', function() {
            var opt = { ignoreUnknown: true };

            assert.ok(validSha1.test(hash.objectHash(blob, opt)), 'ignore Blob');
            assert.ok(validSha1.test(hash.objectHash({ abcdef: blob }, opt)), 'ignore Blob');
        });
    });
}