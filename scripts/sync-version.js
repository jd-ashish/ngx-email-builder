const fs = require('fs');
const path = require('path');
const pkg = require('../package.json');

const versionFile = path.join(__dirname, '../src/version.ts');
const content = `export const LIB_VERSION = '${pkg.version}';\n`;

try {
  fs.writeFileSync(versionFile, content);
  console.log(`✅ Successfully synced version v${pkg.version} to src/version.ts`);
} catch (error) {
  console.error('❌ Failed to sync version:', error.message);
  process.exit(1);
}
