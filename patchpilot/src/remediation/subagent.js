const fs = require('fs');
const path = require('path');
const { transforms, detectCount } = require('./transforms');
const { verifyModule } = require('../verify/testRunner');
const { ok, warn, log } = require('../util/log');

const MAX_ATTEMPTS = 3;

// Bitta subagent = bitta modul.
// applyFn: transformlarni qo'llaydi; detectOnly qoidalar Bob'ga flag qilinadi.
// verifyCmd berilsa (per-module rejim) -> apply -> test -> self-heal.
// verifyCmd null bo'lsa (repo rejim) -> faqat apply, verify keyin repo darajasida.
async function remediate(repo, task, ruleById, verifyCmd) {
  const short = task.module.split('/').pop();
  const label = `subagent:${short}`;
  const applied = [];
  const flaggedForBob = [];

  for (const rel of task.files) {
    const abs = path.join(repo, rel);
    let src = fs.readFileSync(abs, 'utf8');
    let changed = false;
    for (const ruleId of task.ruleIds) {
      const rule = ruleById[ruleId];
      if (!rule) continue;
      if (rule.kind === 'detectOnly') {
        const n = detectCount(src, rule.detect);
        if (n > 0) flaggedForBob.push({ ruleId, file: rel, count: n });
        continue;
      }
      const t = transforms[rule.kind];
      if (!t) continue;
      const { source, count } = t(src);
      if (count > 0) {
        src = source;
        changed = true;
        applied.push({ ruleId, file: rel, count });
      }
    }
    if (changed) fs.writeFileSync(abs, src);
  }

  const totalFixes = applied.reduce((a, x) => a + x.count, 0);
  const flaggedCount = flaggedForBob.reduce((a, x) => a + x.count, 0);

  // Verify (per-module rejim) + self-heal
  let test = null;
  if (verifyCmd) {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      test = await verifyModule(repo, verifyCmd, task.module);
      if (test.ok) break;
      break; // fixture: LLM retry yo'q; full versiyada Bob shu yerda qayta tuzatadi
    }
  }

  let status;
  if (test) status = test.ok ? 'success' : 'needs_human';
  else if (totalFixes > 0) status = 'applied';
  else if (flaggedCount > 0) status = 'needs_bob';
  else status = 'clean';

  const summary =
    `${totalFixes} fix` +
    (flaggedCount ? `, ${flaggedCount} Bob'ga flag` : '') +
    (test ? ` -> testlar ${test.pass}/${test.pass + test.fail}` : '');
  if (status === 'needs_human') warn(label, `${summary} ⚠️ needs_human`);
  else if (status === 'needs_bob') warn(label, `${summary} 🔶 needs_bob (semantik)`);
  else if (status === 'clean') log(label, `o'zgarishsiz (toza)`);
  else ok(label, `${summary} ✅`);

  return {
    taskId: task.id,
    module: task.module,
    status,
    applied,
    flaggedForBob,
    testStatus: test ? (test.ok ? 'passed' : 'failed') : 'deferred',
    pass: test ? test.pass : null,
    humanReason: status === 'needs_human' ? 'Avtomatik fix testlarni yashil qilmadi' : null,
  };
}

module.exports = { remediate };
