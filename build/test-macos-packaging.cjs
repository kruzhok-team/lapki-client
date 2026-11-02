const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');

const afterPack = require('./after-pack.js').default;
const repairScript = path.join(__dirname, 'fix-macos-simulator.command');

function fixture(t, productFilename = 'Cyberiada IDE') {
  const appOutDir = fs.mkdtempSync(path.join(os.tmpdir(), 'macos packaging '));
  t.after(() => fs.rmSync(appOutDir, { recursive: true, force: true }));
  const app = path.join(appOutDir, `${productFilename}.app`);
  const modules = path.join(app, 'Contents/Resources/app.asar.unpacked/resources/modules/darwin');
  fs.mkdirSync(modules, { recursive: true });
  for (const name of ['sm-interpreter', 'lapki-flasher']) {
    fs.writeFileSync(path.join(modules, name), '#!/bin/sh\nexit 0\n', { mode: 0o644 });
  }
  return {
    appOutDir,
    app,
    modules,
    context: {
      appOutDir,
      electronPlatformName: 'darwin',
      packager: { appInfo: { productFilename } },
    },
  };
}

for (const productFilename of ['Cyberiada IDE', 'Lapki IDE']) {
  test(`macOS packaging makes both modules executable in ${productFilename}.app`, async (t) => {
    const { modules, context } = fixture(t, productFilename);
    await afterPack(context);
    for (const name of ['sm-interpreter', 'lapki-flasher']) {
      const executable = path.join(modules, name);
      assert.equal(fs.statSync(executable).mode & 0o777, 0o755);
      // Exercise the OS permission check, not just the mode representation.
      assert.equal(spawnSync(executable).status, 0);
    }
  });
}

for (const missing of ['sm-interpreter', 'lapki-flasher']) {
  test(`macOS packaging fails if ${missing} is absent`, async (t) => {
    const { modules, context } = fixture(t);
    fs.unlinkSync(path.join(modules, missing));
    await assert.rejects(afterPack(context), /Required macOS module is missing from package/);
  });
}

function repairFixture(t) {
  const result = fixture(t);
  const bin = path.join(result.appOutDir, 'bin');
  fs.mkdirSync(bin);
  // Exercise the real repair script and filesystem on Linux, mocking only
  // macOS identification and the native app picker.
  for (const [name, body] of Object.entries({
    uname: 'printf "Darwin\\n"',
    osascript: 'printf "%s\\n" "$REPAIR_TEST_APP"',
    sudo: 'echo "Unexpected privilege escalation" >&2; exit 99',
  })) {
    fs.writeFileSync(path.join(bin, name), `#!/bin/sh\n${body}\n`, { mode: 0o755 });
  }
  result.run = (args = [result.app]) =>
    spawnSync('bash', [repairScript, ...args], {
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: `${bin}${path.delimiter}${process.env.PATH}`,
        REPAIR_TEST_APP: result.app,
      },
    });
  return result;
}

test('repair handles spaces, preserves other permissions and leaves flasher unchanged', (t) => {
  const { modules, run } = repairFixture(t);
  const interpreter = path.join(modules, 'sm-interpreter');
  fs.chmodSync(interpreter, 0o640);
  assert.equal(spawnSync(interpreter).error.code, 'EACCES');
  const result = run();
  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.statSync(interpreter).mode & 0o777, 0o740);
  assert.equal(spawnSync(interpreter).status, 0);
  assert.equal(fs.statSync(path.join(modules, 'lapki-flasher')).mode & 0o777, 0o644);
  const repeated = run();
  assert.equal(repeated.status, 0, repeated.stderr);
  assert.match(repeated.stdout, /Право на выполнение уже есть/);
});

test('repair without arguments uses the selected application', (t) => {
  const { modules, run } = repairFixture(t);
  const result = run([]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(spawnSync(path.join(modules, 'sm-interpreter')).status, 0);
});

test('repair reports a missing interpreter without creating one', (t) => {
  const { modules, run } = repairFixture(t);
  const interpreter = path.join(modules, 'sm-interpreter');
  fs.unlinkSync(interpreter);
  const result = run();
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Не найден обычный файл интерпретатора/);
  assert.equal(fs.existsSync(interpreter), false);
});

test('repair rejects a symlink instead of changing another file', (t) => {
  const { modules, run } = repairFixture(t);
  const interpreter = path.join(modules, 'sm-interpreter');
  const flasher = path.join(modules, 'lapki-flasher');
  fs.unlinkSync(interpreter);
  fs.symlinkSync(flasher, interpreter);
  assert.equal(run().status, 1);
  assert.equal(fs.statSync(flasher).mode & 0o777, 0o644);
});
