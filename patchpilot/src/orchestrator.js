const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const { loadConfig } = require('./config');
const { copyRepo, linkDir, listModules } = require('./util/fsx');
const { extractRules } = require('./analysis/migrationExtractor');
const { mapImpact } = require('./analysis/impactMapper');
const { planTasks } = require('./planner/taskPlanner');
const { remediate } = require('./remediation/subagent');
const { runVerify } = require('./verify/testRunner');
const { buildMigrationNotes } = require('./report/migrationNotes');
const { buildReport } = require('./report/metrics');
const { saveArtifacts } = require('./state/store');
const { log, ok, warn, err, c } = require('./util/log');

function bumpDependency(repo, dep, toVersion) {
  const services = path.join(repo, 'services');
  if (!fs.existsSync(services)) return;
  const range = `^${toVersion}`;
  for (const name of fs.readdirSync(services)) {
    const pj = path.join(services, name, 'package.json');
    if (!fs.existsSync(pj)) continue;
    const data = JSON.parse(fs.readFileSync(pj, 'utf8'));
    if (data.dependencies && data.dependencies[dep]) {
      data.dependencies[dep] = range;
      fs.writeFileSync(pj, JSON.stringify(data, null, 2) + '\n');
    }
  }
}

async function run(cli) {
  const t0 = Date.now();
  const cfg = loadConfig(cli);
  const repo = path.resolve(cli.repo);

  if (!cfg.dependency || !cfg.from || !cfg.to) {
    throw new Error('dependency/from/to not set (use a config or --dep --from --to)');
  }
  if (!cfg.rulesFile || !fs.existsSync(cfg.rulesFile)) {
    throw new Error(`rules file not found: ${cfg.rulesFile}`);
  }

  const job = {
    id: 'job_' + Math.random().toString(36).slice(2, 8),
    repoPath: repo,
    dependency: cfg.dependency,
    fromVersion: cfg.from,
    toVersion: cfg.to,
    trigger: 'cli',
    createdAt: new Date().toISOString(),
  };

  const workdir = path.join(cli.work || path.join(__dirname, '..', '.work'), job.id);
  const rel = (p) => path.relative(process.cwd(), p);

  log('orchestrator', `Job ${c.bold}${job.id}${c.reset}: ${cfg.label || cfg.dependency + ' ' + cfg.from + ' → ' + cfg.to}`);
  log('orchestrator', `strategy=${cfg.moduleStrategy}, verify=${cfg.verify.mode} (${cfg.verify.cmd})`);
  log('orchestrator', `copying repo → ${rel(workdir)}`);
  copyRepo(repo, workdir);

  // Ikki oqim: (a) real upgrade+install, (b) codemod-only + junction
  if (cfg.upgrade.enabled) {
    log('orchestrator', `naive upgrade: ${cfg.dependency} → ^${cfg.to} + npm install ...`);
    bumpDependency(workdir, cfg.dependency, cfg.to);
    if (cfg.upgrade.install && spawnSync('npm install', { cwd: workdir, shell: true }).status !== 0) {
      throw new Error('npm install failed');
    }
  } else if (cfg.linkDirs.length) {
    for (const d of cfg.linkDirs) {
      const okLink = linkDir(repo, workdir, d);
      log('orchestrator', `${d} ${okLink ? 'linked from original' : 'not found, skipped'}`);
    }
  }

  const modules = listModules(workdir, cfg.moduleStrategy);

  // BEFORE verify
  const before = await runVerify(workdir, cfg.verify, modules);
  (before.ok ? ok : warn)('verify', `BEFORE: ${verifyLabel(before)} ${before.ok ? '✅' : '❌'}`);

  // Migration knowledge (fixture / Bob)
  const rulesData = extractRules(cfg.rulesFile);
  const ruleById = Object.fromEntries(rulesData.rules.map((r) => [r.id, r]));
  log('extractor', `${rulesData.rules.length} migration rule(s) loaded`);

  // Impact map (full-repo)
  const impact = mapImpact(workdir, rulesData.rules, {
    exts: cfg.sourceExts,
    strategy: cfg.moduleStrategy,
    dependency: cfg.dependency,
  });
  const du = impact.depUsage;
  log('impact', `${cfg.dependency}: ${du.files} files / ${du.modules} modules / ${du.importSites} imports`);
  log('impact', `breaking sites: ${impact.modules.length} modules, ${impact.totalFiles} files, ${impact.totalCallSites} call-sites`);

  // Plan + parallel subagents
  const tasks = planTasks(impact);
  const verifyCmd = cfg.verify.mode === 'per-module' ? cfg.verify.cmd : null;
  if (tasks.length) log('orchestrator', `spawning ${tasks.length} subagents in parallel ⚡`);
  else log('orchestrator', 'no breaking sites — no subagents needed');
  const results = await Promise.all(tasks.map((t) => remediate(workdir, t, ruleById, verifyCmd)));

  // AFTER verify
  const after = await runVerify(workdir, cfg.verify, modules);
  (after.ok ? ok : err)('verify', `AFTER: ${verifyLabel(after)} ${after.ok ? '✅' : '❌'}`);

  // Report
  const report = buildReport({ job, cfg, before, after, impact, results, durationMs: Date.now() - t0 });
  const notes = buildMigrationNotes({ dependency: cfg.dependency, from: cfg.from, to: cfg.to, results, rulesData });
  const artDir = saveArtifacts(workdir, { report, migrationNotes: notes, impact, results });

  printSummary(report, workdir, artDir, rel);
  return { report, workdir, artDir };
}

function verifyLabel(v) {
  if (v.mode === 'repo') return `${v.perModule[0].module} build ${v.ok ? 'OK' : 'BROKEN'}`;
  return `${v.pass} tests passing, build ${v.ok ? 'OK' : 'BROKEN'}`;
}

function printSummary(r, workdir, artDir, rel) {
  const line = (k, v) => console.log(`  ${k.padEnd(15)}: ${v}`);
  console.log('');
  console.log(`${c.bold}════════════ PatchPilot Report ════════════${c.reset}`);
  if (r.label) line('Target', r.label);
  line('Dependency', `${r.dependency} ${r.from} → ${r.to}`);
  line('Strategy', `${r.moduleStrategy} · verify=${r.verifyMode}`);
  line('Dep usage', `${r.dependencyUsage.files} files / ${r.dependencyUsage.modules} modules / ${r.dependencyUsage.importSites} imports`);
  line('Auto-fixed', `${r.totalFixes} fix, ${r.filesChanged} file(s), ${r.modulesFixed} module(s)`);
  if (r.flaggedForBob) line('Needs Bob', `${c.yellow}${r.flaggedForBob} semantic site(s) 🔶${c.reset}`);
  line('Verify BEFORE', r.verifyBefore.ok ? 'OK' : `${c.red}BROKEN${c.reset}`);
  line('Verify AFTER', r.verifyAfter.ok ? `${c.green}OK${c.reset}` : `${c.red}BROKEN${c.reset}`);
  line('Merge-ready', r.mergeReady ? `${c.green}YES ✅${c.reset}` : `${c.red}NO ❌${c.reset}`);
  line('Duration', `${r.durationSeconds}s  (manual ~${r.manualEstimateMinutes}m → ~${r.timeSavedPercent}% saved)`);
  console.log(`${c.bold}═══════════════════════════════════════════${c.reset}`);
  console.log(`  ${c.dim}Artifacts :${c.reset} ${rel(artDir)}`);
  console.log(`  ${c.dim}Work repo :${c.reset} ${rel(workdir)}`);
  console.log('');
}

module.exports = { run };
