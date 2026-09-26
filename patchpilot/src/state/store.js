const fs = require('fs');
const path = require('path');

function saveArtifacts(repo, { report, migrationNotes, impact, results }) {
  const dir = path.join(repo, '.patchpilot');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'report.json'), JSON.stringify(report, null, 2));
  fs.writeFileSync(path.join(dir, 'impact-map.json'), JSON.stringify(impact, null, 2));
  fs.writeFileSync(path.join(dir, 'patch-results.json'), JSON.stringify(results, null, 2));
  fs.writeFileSync(path.join(repo, 'MIGRATION.md'), migrationNotes);
  return dir;
}

module.exports = { saveArtifacts };
