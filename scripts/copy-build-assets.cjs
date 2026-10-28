const { copyFileSync, mkdirSync } = require('node:fs');
const path = require('node:path');

// Bob preserves ../nitrogen imports from src/index in lib/{commonjs,module}.
// Ship the generated config at that relative location as well as at the root.
const root = path.resolve(__dirname, '..');
const configPath = 'nitrogen/generated/shared/json/NitroShimmerTextConfig.json';
const destination = path.join(root, 'lib', configPath);
mkdirSync(path.dirname(destination), { recursive: true });
copyFileSync(path.join(root, configPath), destination);
