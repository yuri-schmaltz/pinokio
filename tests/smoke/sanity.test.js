const assert = require('assert');

describe('smoke: repo sanity', () => {
  it('Node environment is functional', () => {
    assert.ok(typeof process.version === 'string');
    assert.ok(process.version.startsWith('v'));
  });

  it('backend electron entrypoint exists on disk', () => {
    const fs = require('fs');
    const path = require('path');
    const entry = path.join(__dirname, '..', '..', 'backend', 'src', 'electron', 'main.js');
    assert.ok(fs.existsSync(entry), `Expected entrypoint at: ${entry}`);
  });
});
