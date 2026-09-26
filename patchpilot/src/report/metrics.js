function buildReport({ job, cfg, before, after, impact, results, durationMs }) {
  const modulesFixed = results.filter((r) => r.applied.length > 0).length;
  const filesChanged = new Set(results.flatMap((r) => r.applied.map((a) => a.file))).size;
  const totalFixes = results.reduce((a, r) => a + r.applied.reduce((b, x) => b + x.count, 0), 0);
  const flaggedForBob = results.reduce((a, r) => a + r.flaggedForBob.reduce((b, x) => b + x.count, 0), 0);
  const durationSeconds = Math.max(1, Math.round(durationMs / 1000));
  const manualSeconds = (cfg.manualEstimateMinutes || 0) * 60;
  const timeSavedPercent =
    manualSeconds > 0
      ? Math.min(99, Math.max(0, Math.round((1 - durationSeconds / manualSeconds) * 100)))
      : null;

  return {
    jobId: job.id,
    label: cfg.label || null,
    dependency: job.dependency,
    from: job.fromVersion,
    to: job.toVersion,
    moduleStrategy: cfg.moduleStrategy,
    verifyMode: cfg.verify.mode,
    verifyCmd: cfg.verify.cmd,
    dependencyUsage: impact.depUsage,
    modulesTotal: impact.modules.length,
    modulesFixed,
    filesChanged,
    totalFixes,
    flaggedForBob,
    verifyBefore: { ok: before.ok, pass: before.pass },
    verifyAfter: { ok: after.ok, pass: after.pass },
    mergeReady: after.ok,
    durationSeconds,
    manualEstimateMinutes: cfg.manualEstimateMinutes,
    timeSavedPercent,
    generatedAt: new Date().toISOString(),
  };
}

module.exports = { buildReport };
