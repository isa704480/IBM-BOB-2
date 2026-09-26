const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const DEFAULTS = {
  dependency: null,
  from: null,
  to: null,
  moduleStrategy: 'services', // services | src-subdirs | single
  sourceExts: ['.js'],
  verify: { mode: 'per-module', cmd: 'npm test -w {module}' }, // mode: per-module | repo
  upgrade: { enabled: true, install: true }, // false -> codemod/verify only
  linkDirs: [], // upgrade=false bo'lganda originaldan junction qilinadigan papkalar
  rulesFile: null,
  manualEstimateMinutes: 120,
  label: null,
};

function resolveRulesFile(rulesFile, cfgDir) {
  if (!rulesFile) return null;
  if (path.isAbsolute(rulesFile)) return rulesFile;
  const candidates = [
    cfgDir && path.resolve(cfgDir, rulesFile),
    path.resolve(ROOT, rulesFile),
    path.resolve(process.cwd(), rulesFile),
  ].filter(Boolean);
  return candidates.find((p) => fs.existsSync(p)) || candidates[candidates.length - 1];
}

function loadConfig(cli) {
  const cfgPath =
    cli.config ||
    (cli.repo && fs.existsSync(path.join(cli.repo, 'patchpilot.config.json'))
      ? path.join(cli.repo, 'patchpilot.config.json')
      : null);

  const fileCfg = cfgPath && fs.existsSync(cfgPath) ? JSON.parse(fs.readFileSync(cfgPath, 'utf8')) : {};

  const cfg = { ...DEFAULTS, ...fileCfg };
  cfg.verify = { ...DEFAULTS.verify, ...(fileCfg.verify || {}) };
  cfg.upgrade = { ...DEFAULTS.upgrade, ...(fileCfg.upgrade || {}) };

  // CLI overrides
  if (cli.dep) cfg.dependency = cli.dep;
  if (cli.from) cfg.from = cli.from;
  if (cli.to) cfg.to = cli.to;
  if (cli.rules) cfg.rulesFile = cli.rules;
  if (cli.manualEstimate) cfg.manualEstimateMinutes = cli.manualEstimate;

  if (!cfg.rulesFile && cfg.dependency && cfg.from && cfg.to) {
    cfg.rulesFile = `rules/${cfg.dependency}-${cfg.from}-to-${cfg.to}.json`;
  }
  cfg.rulesFile = resolveRulesFile(cfg.rulesFile, cfgPath ? path.dirname(cfgPath) : null);
  cfg.configPath = cfgPath;
  return cfg;
}

module.exports = { loadConfig, DEFAULTS };
