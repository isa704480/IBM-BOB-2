const fs = require('fs');
const path = require('path');
const { transforms, detectCount } = require('../remediation/transforms');
const { listSourceFiles, listModules } = require('../util/fsx');

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Full-repo skan: paket ishlatilishini va breaking joylarni modul bo'yicha xaritalash.
// (Full versiyada Bob full-repo context bilan transitive/re-export'larni ham topadi.)
function mapImpact(repo, rules, { exts = ['.js'], strategy = 'services', dependency = null } = {}) {
  const modules = listModules(repo, strategy);
  const result = {
    modules: [],
    totalFiles: 0,
    totalCallSites: 0,
    depUsage: { dependency, files: 0, modules: 0, importSites: 0 },
  };

  const importRe = dependency
    ? new RegExp(`from\\s+['"]${escapeRe(dependency)}(?:/[^'"]*)?['"]|require\\(\\s*['"]${escapeRe(dependency)}`, 'g')
    : null;

  for (const mod of modules) {
    let modUsesDep = false;
    const modFiles = [];

    for (const abs of listSourceFiles(mod.dir, exts)) {
      const src = fs.readFileSync(abs, 'utf8');

      if (importRe) {
        const m = src.match(importRe);
        if (m) {
          result.depUsage.files += 1;
          result.depUsage.importSites += m.length;
          modUsesDep = true;
        }
      }

      const hits = [];
      for (const rule of rules) {
        let count = 0;
        if (rule.kind === 'detectOnly') count = detectCount(src, rule.detect);
        else if (transforms[rule.kind]) count = transforms[rule.kind](src).count;
        if (count > 0) hits.push({ ruleId: rule.id, count, needsBob: rule.kind === 'detectOnly' });
      }

      if (hits.length) {
        const rel = path.relative(repo, abs).replace(/\\/g, '/');
        const callSites = hits.reduce((a, h) => a + h.count, 0);
        modFiles.push({ path: rel, rules: hits, callSites });
        result.totalCallSites += callSites;
      }
    }

    if (modUsesDep) result.depUsage.modules += 1;
    if (modFiles.length) {
      result.modules.push({ name: mod.name, dir: mod.dir, files: modFiles });
      result.totalFiles += modFiles.length;
    }
  }
  return result;
}

module.exports = { mapImpact };
