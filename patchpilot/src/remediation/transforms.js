// Deterministik transformatsiyalar (FIXTURE rejimi).
//
// >>> BU YERGA IBM Bob 2.0 ULANADI <<<
// Full versiyada har bir transform o'rnida Bob subagenti fayl kontekstini o'qib,
// o'zi to'g'ri o'zgarishni yozadi (va test sinsa — o'zini tuzatadi). Hozir esa
// ma'lum qoidalar uchun aniq, takrorlanadigan regex transformlari ishlatiladi.
//
// "detectOnly" turidagi qoidalar — regex bilan XAVFSIZ tuzatib bo'lmaydiganlar
// (semantik). PatchPilot ularni TOPADI va Bob'ga yo'naltiradi (needs_bob).

function replaceCount(src, re, rep) {
  const m = src.match(re);
  const count = m ? m.length : 0;
  return { source: count ? src.replace(re, rep) : src, count };
}

function detectCount(src, pattern) {
  const m = src.match(new RegExp(pattern, 'g'));
  return m ? m.length : 0;
}

const transforms = {
  // ---- Express 4 -> 5 ----
  renameMethodDel: (s) => replaceCount(s, /\.del\(/g, '.delete('),
  reqParam: (s) => replaceCount(s, /req\.param\(\s*['"]([A-Za-z0-9_$]+)['"]\s*\)/g, 'req.params.$1'),
  redirectBack: (s) =>
    replaceCount(s, /res\.redirect\(\s*['"]back['"]\s*\)/g, "res.redirect(req.get('Referrer') || '/')"),
  optionalParam: (s) => replaceCount(s, /\/:([A-Za-z0-9_$]+)\?/g, '{/:$1}'),
  wildcard: (s) =>
    replaceCount(s, /(\.(?:get|post|put|delete|patch|all|use|options|head)\(\s*)(['"])\*\2/g, '$1$2/*splat$2'),

  // ---- Zod 3 -> 4 (xavfsiz, top-level formatlar) ----
  zodEmail: (s) => replaceCount(s, /z\.string\(\)\.email\(\)/g, 'z.email()'),
  zodUrl: (s) => replaceCount(s, /z\.string\(\)\.url\(\)/g, 'z.url()'),
  zodUuid: (s) => replaceCount(s, /z\.string\(\)\.uuid\(\)/g, 'z.uuid()'),
  zodDatetime: (s) => replaceCount(s, /z\.string\(\)\.datetime\(\)/g, 'z.iso.datetime()'),
};

module.exports = { transforms, replaceCount, detectCount };
