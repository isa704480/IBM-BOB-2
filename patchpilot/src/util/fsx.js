const fs = require('fs');
const path = require('path');

const SKIP = new Set([
  'node_modules',
  '.git',
  '.work',
  '.patchpilot',
  '.next',
  '.vercel',
  'package-lock.json',
  'tsconfig.tsbuildinfo',
]);

const TEST_RE = /\.test\.[cm]?[jt]sx?$/;

// Repozitoriyni ish papkasiga nusxalash (og'ir/keraksiz papkalarsiz)
function copyRepo(src, dest) {
  fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(dest, { recursive: true });
  fs.cpSync(src, dest, {
    recursive: true,
    filter: (s) => !SKIP.has(path.basename(s)),
  });
}

// Originaldagi papkani ish papkasiga junction/symlink qilish (masalan node_modules, .next)
function linkDir(originalRepo, workdir, name) {
  const target = path.join(originalRepo, name);
  const link = path.join(workdir, name);
  if (!fs.existsSync(target)) return false;
  fs.rmSync(link, { recursive: true, force: true });
  try {
    fs.symlinkSync(target, link, 'junction'); // Windows: junction (admin kerak emas)
  } catch {
    fs.symlinkSync(target, link, 'dir');
  }
  return true;
}

// Moduldagi manba fayllar (belgilangan kengaytmalar, testlarsiz)
function listSourceFiles(dir, exts = ['.js']) {
  const out = [];
  (function walk(d) {
    if (!fs.existsSync(d)) return;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.name === 'node_modules' || e.name === '.next') continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.isFile() && exts.some((x) => e.name.endsWith(x)) && !TEST_RE.test(e.name)) out.push(p);
    }
  })(dir);
  return out;
}

// Modullar ro'yxati — strategiyaga qarab
function listModules(repo, strategy = 'services') {
  if (strategy === 'single') return [{ name: '.', dir: repo }];

  if (strategy === 'src-subdirs') {
    const srcDir = path.join(repo, 'src');
    if (!fs.existsSync(srcDir)) return [{ name: '.', dir: repo }];
    return fs
      .readdirSync(srcDir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => ({ name: `src/${e.name}`, dir: path.join(srcDir, e.name) }));
  }

  // services (default)
  const servicesDir = path.join(repo, 'services');
  if (!fs.existsSync(servicesDir)) return [];
  return fs
    .readdirSync(servicesDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => ({ name: `services/${e.name}`, dir: path.join(servicesDir, e.name) }));
}

module.exports = { copyRepo, linkDir, listSourceFiles, listModules };
