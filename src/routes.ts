export default {
  addResultsForCases: (runId): string =>
    `index.php?/api/v2/add_results_for_cases/${runId}`,
  addRun: (projectId): string => `index.php?/api/v2/add_run/${projectId}`,
  getProjects: "index.php?/api/v2/get_projects",
  getRun: (runId): string => `index.php?/api/v2/get_run/${runId}`,
  getRuns: (projectId): string => `index.php?/api/v2/get_runs/${projectId}`,
  getSuites: (projectId): string => `index.php?/api/v2/get_suites/${projectId}`,
  getTests: (runId): string => `index.php?/api/v2/get_tests/${runId}`,
};
