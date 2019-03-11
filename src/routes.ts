export default {
    addResultsForCases: (runId): string => `index.php?/api/v2/add_results_for_cases/${runId}`,
    addRun: projectId => `index.php?/api/v2/add_run/${projectId}`,
    getCases: (projectId, suiteId, typeId) =>
        `index.php?/api/v2/get_cases/${projectId}&suite_id=${suiteId}&type_id=${typeId}`,
    getProjects: 'index.php?/api/v2/get_projects',
    getRun: (runId): string => `index.php?/api/v2/get_run/${runId}`,
    getRuns: (projectId): string => `index.php?/api/v2/get_runs/${projectId}`,
    getSuites: (projectId): string => `index.php?/api/v2/get_suites/${projectId}`,
    getTests: (runId): string => `index.php?/api/v2/get_tests/${runId}`,
};
