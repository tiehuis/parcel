const path = require('path');
const commandExists = require('command-exists');
const childProcess = require('child_process');
const promisify = require('../utils/promisify');
const fs = require('../utils/fs');
const exec = promisify(childProcess.execFile);
const Asset = require('../Asset');
const md5 = require('../utils/md5');

class ZigAsset extends Asset {
  constructor(name, pkg, options) {
    super(name, pkg, options);
    this.type = 'wasm';
  }

  process() {
    // We don't want to process this asset if the worker is in a warm up phase
    // since the asset will also be processed by the main process, which
    // may cause errors since rust writes to the filesystem.
    if (this.options.isWarmUp) {
      return;
    }

    return super.process();
  }

  // Treat the target file as the main entry-point.
  //
  // Alternatively, we should check if a build.zig exists and check where
  // the main file is from there (prior to doing a build).
  async parse() {
    await this.installZig();

    // Get output filename
    await fs.mkdirp(this.options.cacheDir);
    let name = md5(this.name);
    this.wasmPath = path.join(this.options.cacheDir, name + '.wasm');

    // We always build in release-mode to reduce size
    // Assumes embedded LLVM was built with LLVM experimental support.
    const args = [
      'build-obj',
      '--release-fast',
      '--target-arch',
      'wasm32',
      '--target-os',
      'freestanding',
      this.name,
      '--output',
      this.wasmPath,
    ]
    await exec('zig', args)
  }

  async installZig() {
    try {
      await commandExists('zig');
    } catch (e) {
      throw new Error(
        "Zig isn't installed. Visit https://ziglang.org for more info"
      );
    }
  }

  async generate() {
    return {
      wasm: {
        path: this.wasmPath, // pass output path to RawPackager
        mtime: Date.now() // force re-bundling since otherwise the hash would never change
      }
    };
  }
}

module.exports = ZigAsset;
