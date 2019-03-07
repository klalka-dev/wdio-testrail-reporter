"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    addResultsForCases: (runId) => `index.php?/api/v2/add_results_for_cases/${runId}`,
    addRun: (projectId) => `index.php?/api/v2/add_run/${projectId}`,
    getProjects: "index.php?/api/v2/get_projects",
    getRun: (runId) => `index.php?/api/v2/get_run/${runId}`,
    getRuns: (projectId) => `index.php?/api/v2/get_runs/${projectId}`,
    getSuites: (projectId) => `index.php?/api/v2/get_suites/${projectId}`,
    getTests: (runId) => `index.php?/api/v2/get_tests/${runId}`,
};
