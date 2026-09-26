const { spawn } = require('child_process');

function runCmd(cmd, cwd) {
  return new Promise((resolve) => {
    const child = spawn(cmd, { cwd, shell: true });
    let out = '';
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (out += d));
    child.on('close', (code) => resolve({ out, code }));
  });
}

function sumMatches(out, re) {
  let m;
  let sum = 0;
  while ((m = re.exec(out))) sum += Number(m[1]);
  return sum;
}

function parse(out, code) {
  return {
    ok: code === 0,
    pass: sumMatches(out, /# pass (\d+)/g),
    fail: sumMatches(out, /# fail (\d+)/g),
    exitCode: code,
  };
}

// Bitta modulni verify qilish (per-module rejim uchun)
async function verifyModule(repo, cmdTemplate, moduleName) {
  const { out, code } = await runCmd(cmdTemplate.replace('{module}', moduleName), repo);
  return { module: moduleName, ...parse(out, code) };
}

// Umumiy verify — config.verify ga qarab
async function runVerify(repo, verify, modules) {
  if (verify.mode === 'repo') {
    const { out, code } = await runCmd(verify.cmd, repo);
    const p = parse(out, code);
    return { ok: p.ok, pass: p.pass, fail: p.fail, mode: 'repo', perModule: [{ module: '.', ...p }] };
  }
  const perModule = await Promise.all(modules.map((m) => verifyModule(repo, verify.cmd, m.name)));
  return {
    ok: perModule.every((r) => r.ok),
    pass: perModule.reduce((a, r) => a + r.pass, 0),
    fail: perModule.reduce((a, r) => a + r.fail, 0),
    mode: 'per-module',
    perModule,
  };
}

module.exports = { runVerify, verifyModule };
