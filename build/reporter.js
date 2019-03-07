"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("@wdio/logger");
const reporter_1 = require("@wdio/reporter");
const node_fetch_1 = require("node-fetch");
const routes_1 = require("./routes");
class TestRailReporter extends reporter_1.default {
    constructor(options) {
        super(options);
        options = Object.assign(options, { stdout: false });
        this.obj = {};
        this.log = logger_1.default("custom-webdriver-v5-testrail-reporter");
        this.body = {
            results: [],
        };
        this.regex = options.regex || /[?\d]{6}/g;
        if (!options.testRailUrl ||
            !options.projectId ||
            !options.username ||
            !options.password ||
            !options.addRunSuiteId) {
            throw new Error("The following options are required for this reporter: testRailUrl, username, password, projectId, and addRunSuiteId. See documentation for more info.");
        }
        this.isDone = false;
        this.newRunId = null;
        this.newRunName = null;
        this.currentDate = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
            .toISOString()
            .substr(0, 19)
            .replace("T", " ");
        this.addRunBody = {
            description: options.addRunBodyDescription,
            name: options.addRunBodyName || `${this.currentDate}`,
            suite_id: options.addRunSuiteId,
        };
    }
    onSuiteEnd(suite) {
        Object.assign(this.obj, suite);
    }
    onRunnerEnd(runnerStats) {
        return __awaiter(this, void 0, void 0, function* () {
            const addRunUrl = this.getFullUrl(routes_1.default.addRun(this.options.projectId));
            this.addRunBody.description = `${runnerStats.sanitizedCapabilities}`;
            try {
                yield this.createNewTestrailRun(addRunUrl, this.addRunBody);
                yield this.updateTests();
                yield this.sync(); // End
            }
            catch (e) {
                this.fail(e);
            }
        });
    }
    get isSynchronised() {
        return this.isDone;
    }
    sync() {
        this.isDone = true;
    }
    fail(e) {
        this.sync(); // set to true to allow shutdown
        this.log.debug(e);
        process.exit(1);
    }
    getFullUrl(route) {
        return `https://${this.options.username}:${this.options.password}@${this.options.testRailUrl}/${route}`;
    }
    getTestState(state) {
        const testRailStatuses = {
            FAILED: 5,
            PASSED: 1,
            SKIPPED: 8,
        };
        if (state === "passed") {
            return testRailStatuses.PASSED;
        }
        else if (state === "failed") {
            return testRailStatuses.FAILED;
        }
        else if (state === "skipped") {
            return testRailStatuses.SKIPPED;
        }
        else {
            this.fail("Error finding Mocha test state");
            return 0;
        }
    }
    getPostData(url, body) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return node_fetch_1.default(url, {
                    body: JSON.stringify(body),
                    headers: {
                        "Content-Type": "application/json",
                    },
                    method: "POST",
                });
            }
            catch (e) {
                this.fail(e);
            }
        });
    }
    createNewTestrailRun(url, body) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.getPostData(url, body);
                if (response.ok) {
                    const data = yield response.json();
                    this.newRunId = data.id;
                    this.newRunName = data.name;
                    this.log.debug(`New TestRail Run created. ID: ${this.newRunId} Name: ${this.newRunName}`);
                }
                else {
                    throw new Error(`Unable to create TestRail Run: ${response.status} ${response.statusText}`);
                }
            }
            catch (e) {
                this.fail(e);
            }
        });
    }
    pushToResponse(iterateObj) {
        iterateObj.tests.forEach((test) => {
            if (test.title.match(this.regex)) {
                const result = {
                    case_id: test.title.match(this.regex)[0],
                    elapsed: test.duration,
                    status_id: this.getTestState(test.state),
                };
                // Add failures to the "comment" field
                if (result.status_id === this.getTestState("failed")) {
                    Object.assign(result, { comment: test.error.message });
                }
                this.body.results.push(result);
            }
            else {
                this.log.error("Unable to match case_id pattern in test title: ", test.title);
            }
        });
    }
    updateTests() {
        return __awaiter(this, void 0, void 0, function* () {
            const addResultsForCasesURL = this.getFullUrl(routes_1.default.addResultsForCases(this.newRunId));
            if (this.obj.tests.length > 0) {
                this.pushToResponse(this.obj);
            }
            if (this.obj.suites.length > 0) {
                this.obj.suites.forEach((suite) => {
                    if (suite.tests.length > 0) {
                        this.pushToResponse(suite);
                    }
                    else {
                        this.log.error("No tests found on ", suite);
                    }
                });
            }
            try {
                yield this.getPostData(addResultsForCasesURL, this.body);
                this.log.info("Testrail has been updated successfully.");
            }
            catch (e) {
                this.fail(e);
            }
        });
    }
}
exports.default = TestRailReporter;
