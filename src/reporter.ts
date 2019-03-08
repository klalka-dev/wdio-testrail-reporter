import logger from "@wdio/logger";
import WDIOReporter from "@wdio/reporter";
import fetch from "node-fetch";

import routes from "./routes";

export default class TestRailReporter extends WDIOReporter {
  private obj;
  private log;
  private body;
  private regex;
  private isDone;
  private newRunId;
  private newRunName;
  private currentDate;
  private addRunBody;
  private options;

  constructor(options) {
    super(options);
    options = Object.assign(options, { stdout: false });
    this.obj = {};
    this.log = logger("custom-webdriver-v5-testrail-reporter")
    this.body = {
      results: [],
    };
    this.regex = options.regex || /[?\d]{6}/g;

    if (
      !options.testRailUrl ||
      !options.projectId ||
      !options.username ||
      !options.password ||
      !options.addRunSuiteId
    ) {
      throw new Error(
        "The following options are required for this reporter: testRailUrl, username, password, projectId, and addRunSuiteId. See documentation for more info.",
      );
    }

    this.isDone = false;
    this.newRunId = null;
    this.newRunName = null;
    this.currentDate = new Date(
      Date.now() - new Date().getTimezoneOffset() * 60000,
    )
      .toISOString()
      .substr(0, 19)
      .replace("T", " ");
    this.addRunBody = {
      description: options.addRunBodyDescription,
      name: options.addRunBodyName || `${this.currentDate}`,
      suite_id: options.addRunSuiteId,
    };
  }

  public onSuiteEnd(suite) {
    Object.assign(this.obj, suite);
  }

  public async onRunnerEnd(runnerStats) {
    const addRunUrl = this.getFullUrl(routes.addRun(this.options.projectId));
    this.addRunBody.description = `${runnerStats.sanitizedCapabilities}`;

    try {
      await this.createNewTestrailRun(addRunUrl, this.addRunBody);
      await this.updateTests();
      await this.sync(); // End
    } catch (e) {
      this.fail(e);
    }
  }

  public get isSynchronised(): boolean {
    return this.isDone;
  }

  private sync(): void {
    this.isDone = true;
  }

  private fail(e): void {
    this.sync(); // set to true to allow shutdown
    this.log.debug(e);
    process.exit(1);
  }

  private getFullUrl(route): string {
    return `https://${this.options.username}:${this.options.password}@${
      this.options.testRailUrl
      }/${route}`;
  }

  private getTestState(state): number {
    const testRailStatuses = {
      FAILED: 5,
      PASSED: 1,
      SKIPPED: 8,
    };

    if (state === "passed") {
      return testRailStatuses.PASSED;
    } else if (state === "failed") {
      return testRailStatuses.FAILED;
    } else if (state === "skipped") {
      return testRailStatuses.SKIPPED;
    } else {
      this.fail("Error finding Mocha test state");
      return 0;
    }
  }

  private async getPostData(url, body) {
    try {
      return fetch(url, {
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
    } catch (e) {
      this.fail(e);
    }
  }

  private async createNewTestrailRun(url, body): Promise<void> {
    try {
      const response = await this.getPostData(url, body);

      if (response.ok) {
        const data = await response.json();
        this.newRunId = data.id;
        this.newRunName = data.name;
        this.log.debug(
          `New TestRail Run created. ID: ${this.newRunId} Name: ${
          this.newRunName
          }`,
        );
      } else {
        throw new Error(
          `Unable to create TestRail Run: ${response.status} ${
          response.statusText
          }`,
        );
      }
    } catch (e) {
      this.fail(e);
    }
  }

  private pushToResponse(iterateObj): void {
    iterateObj.tests.forEach((test) => {
      const matches = test.title.match(this.regex);
      if (matches.length >= 1) {
        matches.forEach(caseId => {
        const result = {
          case_id: caseId,
          elapsed: test.duration,
          status_id: this.getTestState(test.state),
        };

        // Add failures to the "comment" field
        if (result.status_id === this.getTestState("failed")) {
          Object.assign(result, { comment: test.error.message });
        }

        this.body.results.push(result);
       });
      } else {
        this.log.error("Unable to match case_id pattern in test title: ", test.title);
      }
    });
  }

  private async updateTests(): Promise<void> {
    const addResultsForCasesURL = this.getFullUrl(
      routes.addResultsForCases(this.newRunId),
    );

    if (this.obj.tests.length > 0) {
      this.pushToResponse(this.obj);
    }

    if (this.obj.suites.length > 0) {
      this.obj.suites.forEach((suite) => {
        if (suite.tests.length > 0) {
          this.pushToResponse(suite);
        } else {
          this.log.error("No tests found on ", suite);
        }
      });
    }

    try {
      await this.getPostData(addResultsForCasesURL, this.body);
      this.log.info("Testrail has been updated successfully.");
    } catch (e) {
      this.fail(e);
    }
  }
}
