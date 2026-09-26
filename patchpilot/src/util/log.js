const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const tag = (scope) => `${c.cyan}[${scope}]${c.reset}`;

module.exports = {
  c,
  log: (scope, msg) => console.log(`${tag(scope)} ${msg}`),
  ok: (scope, msg) => console.log(`${tag(scope)} ${c.green}${msg}${c.reset}`),
  warn: (scope, msg) => console.log(`${tag(scope)} ${c.yellow}${msg}${c.reset}`),
  err: (scope, msg) => console.log(`${tag(scope)} ${c.red}${msg}${c.reset}`),
};
