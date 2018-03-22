const assert = require('assert');
const {bundle, run, assertBundleTree} = require('./utils');
const fs = require('fs');
const commandExists = require('command-exists');

describe('zig', function() {
  if (typeof WebAssembly === 'undefined' || !commandExists.sync('zig')) {
    // eslint-disable-next-line no-console
    console.log(
      'Skipping Zig tests. Install https://ziglang.org/ to run them.'
    );
    return;
  }

  it('should generate a wasm file from a zig file with the zig compiler', async function() {
    this.timeout(500000);
    let b = await bundle(__dirname + '/integration/zig/index.js');

    assertBundleTree(b, {
      name: 'index.js',
      assets: [
        'bundle-loader.js',
        'bundle-url.js',
        'index.js',
        'wasm-loader.js'
      ],
      childBundles: [
        {
          type: 'wasm',
          assets: ['add.zig'],
          childBundles: []
        },
        {
          type: 'map'
        }
      ]
    });

    var res = await run(b);
    assert.equal(res, 5);

    // should be minified
    assert(fs.statSync(Array.from(b.childBundles)[0].name).size < 100);
  });
});
