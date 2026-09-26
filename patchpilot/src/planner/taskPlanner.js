// ImpactMap -> modul bo'yicha diskret RemediationTask[] (parallellik birligi).
function planTasks(impact) {
  return impact.modules.map((m, i) => ({
    id: `task_${m.name.replace(/[^a-z0-9]/gi, '_')}`,
    module: m.name,
    dir: m.dir,
    files: m.files.map((f) => f.path),
    ruleIds: [...new Set(m.files.flatMap((f) => f.rules.map((r) => r.ruleId)))],
    assignedSubagent: `subagent-${i + 1}`,
  }));
}

module.exports = { planTasks };
