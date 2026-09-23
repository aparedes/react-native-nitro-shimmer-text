const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { mkdtempSync, readFileSync, rmSync } = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');

const root = path.resolve(__dirname, '../..');

test('published entry points can resolve their generated view config', () => {
  const cache = mkdtempSync(path.join(os.tmpdir(), 'shimmer-pack-'));
  try {
    const [pack] = JSON.parse(
      execFileSync(
        'npm',
        ['pack', '--dry-run', '--ignore-scripts', '--json', '--cache', cache],
        { cwd: root, encoding: 'utf8' },
      ),
    );
    const files = new Set(pack.files.map((file) => file.path));
    const pkg = JSON.parse(
      readFileSync(path.join(root, 'package.json'), 'utf8'),
    );
    const sourceConfig = JSON.parse(
      readFileSync(
        path.join(
          root,
          'nitrogen/generated/shared/json/NitroShimmerTextConfig.json',
        ),
        'utf8',
      ),
    );

    for (const field of ['main', 'module']) {
      const entry = pkg[field].replace(/^\.\//, '');
      assert.ok(files.has(entry), `${field} entry must be packed`);
      const code = readFileSync(path.join(root, entry), 'utf8');
      const imports = [...code.matchAll(/["'](\.[^"']+\.json)["']/g)];
      assert.ok(imports.length > 0, `${field} must load its generated config`);
      for (const [, specifier] of imports) {
        const resolved = path.posix.normalize(
          path.posix.join(path.posix.dirname(entry), specifier),
        );
        assert.ok(
          files.has(resolved),
          `${field}: missing packed asset ${resolved}`,
        );
        assert.deepEqual(
          JSON.parse(readFileSync(path.join(root, resolved), 'utf8')),
          sourceConfig,
        );
      }
    }
  } finally {
    rmSync(cache, { recursive: true, force: true });
  }
});
