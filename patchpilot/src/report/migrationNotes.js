function buildMigrationNotes({ dependency, from, to, results, rulesData }) {
  const L = [];
  L.push(`# Migration Notes — ${dependency} ${from} → ${to}`);
  L.push('');
  L.push('> PatchPilot tomonidan avtomatik yaratildi.');
  L.push('');

  const applied = results.filter((r) => r.applied.length);
  const flagged = results.filter((r) => r.flaggedForBob.length);

  L.push("## ✅ Avtomatik qo'llangan o'zgarishlar");
  L.push('');
  if (!applied.length) {
    L.push('_Avtomatik mexanik o\'zgarish bo\'lmadi (repo toza yoki qoidalar mos kelmadi)._');
    L.push('');
  } else {
    for (const r of applied) {
      L.push(`### ${r.module}`);
      L.push('| Fayl | Qoida | Soni |');
      L.push('|---|---|---|');
      for (const a of r.applied) L.push(`| ${a.file} | ${a.ruleId} | ${a.count} |`);
      L.push('');
    }
  }

  if (flagged.length) {
    L.push("## 🔶 Bob 2.0 talab qiladigan (semantik) o'zgarishlar");
    L.push('');
    L.push('_Regex bilan xavfsiz avtomatlashtirib bo\'lmaydi — Bob subagenti kontekst bilan tuzatadi._');
    L.push('');
    for (const r of flagged) {
      L.push(`### ${r.module}`);
      L.push('| Fayl | Qoida | Soni |');
      L.push('|---|---|---|');
      for (const a of r.flaggedForBob) L.push(`| ${a.file} | ${a.ruleId} | ${a.count} |`);
      L.push('');
    }
  }

  L.push('## Qoidalar manbasi');
  L.push(`- ${rulesData.source}`);
  L.push('');
  return L.join('\n');
}

module.exports = { buildMigrationNotes };
