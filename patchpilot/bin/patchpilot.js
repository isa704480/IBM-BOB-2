#!/usr/bin/env node
const path = require('path');
const { run } = require('../src/orchestrator');

function parseArgs(argv) {
  const args = {};
  const map = {
    '--repo': 'repo',
    '--config': 'config',
    '--dep': 'dep',
    '--from': 'from',
    '--to': 'to',
    '--rules': 'rules',
    '--work': 'work',
  };
  for (let i = 0; i < argv.length; i += 1) {
    if (map[argv[i]]) args[map[argv[i]]] = argv[++i];
    else if (argv[i] === '--manual-estimate') args.manualEstimate = Number(argv[++i]);
  }
  return args;
}

const USAGE = `PatchPilot — agentic dependency-upgrade autopilot

Usage:
  patchpilot run --repo <path> [--config <file>] [--dep <name> --from <v> --to <v>] [--rules <file>]

Examples:
  patchpilot run --repo ../sample-monorepo --config targets/sample-monorepo.config.json
  patchpilot run --repo ../sample-monorepo --dep express --from 4 --to 5
  patchpilot run --repo "D:/My_apps/Sovereign" --config targets/sovereign.config.json`;

(async () => {
  const argv = process.argv.slice(2);
  if (argv[0] !== 'run') {
    console.log(USAGE);
    process.exit(argv[0] ? 1 : 0);
  }
  const args = parseArgs(argv.slice(1));
  if (!args.repo) {
    console.error('--repo majburiy.\n\n' + USAGE);
    process.exit(1);
  }
  if (args.config) args.config = path.resolve(args.config);
  try {
    const { report } = await run(args);
    process.exit(report.mergeReady ? 0 : 2);
  } catch (e) {
    console.error('PatchPilot failed:', e.message);
    process.exit(1);
  }
})();
