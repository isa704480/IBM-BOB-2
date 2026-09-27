const fs = require('fs');

// Migration knowledge chiqarish.
//
// >>> BU YERGA IBM Bob 2.0 ULANADI <<<
// Full versiyada Bob paketning CHANGELOG / migration guide / CVE advisory'sini
// O'QIB (document understanding), MigrationRule[] ni o'zi chiqaradi. Hozir esa
// oldindan tayyorlangan JSON fixture'dan o'qiydi — pipeline Bob'siz ham ishlaydi.
function extractRules(rulesFile) {
  if (!rulesFile || !fs.existsSync(rulesFile)) {
    throw new Error(`Migration rules fixture not found: ${rulesFile}`);
  }
  return JSON.parse(fs.readFileSync(rulesFile, 'utf8'));
}

module.exports = { extractRules };
