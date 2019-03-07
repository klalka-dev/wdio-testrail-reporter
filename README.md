# wdio-testrail-reporter

## Getting Started

**NOTE:** This reporter uses TestRail v2 API endpoints which require TestRail 3.1 or later.

`npm i wdio-testrail-reporter`

Add the required options to your WDIO config file

```
// wdio.conf.js
const myReporter = require('wdio-testrail-reporter')

module.exports = {
    ...
    reporters: [
        myReporter,
        {
            testRailUrl: 'your-url.testrail.com',
            username: "your_username",
            password: "your_password",
            projectId: 1, // this is project id from test rail
            addRunSuiteId: 1000, // this is suite id for project
        }
    ]
}
```

## How It Works

It uses TestRail API v2 to create a new "Run" and then adds the results for a provided case_id.

**NOTE:** We currently only support creating one new Run under one Suite. In the future we will expand to include testing across multiple suites with option targeting.

You will need to know a little about the underlying TestRail system in order to configure the reporter correctly. The reporter uses the [`add_results_for_cases` endpoint](http://docs.gurock.com/testrail-api2/reference-results) and the [`add_run` endpoint](http://docs.gurock.com/testrail-api2/reference-runs) to update the test results. These endpoints require that you provide a `projectId` which can be observed in your TestRail address bar when you are signed in to the project dashboard on your browser. Additionally you will need to provide a `suite_id` since we assume you are not running in single suite mode by default.

## Configuration

**testRailUrl**

Your TestRail base url

`testRailUrl: 'your-domain.testrail.com', // no default, required field`

**username**

Your TestRail username

`username: 'myUserName', // no default, required field`

**password**

Your TestRail password

`password: 'myPassword', // no default, required field`

**projectId**

Your TestRail Project projectId

`projectId: 1', // no default, required field`

**addRunSuiteId**

Your TestRail Project suiteId

`addRunSuiteId: 1234, // no default, required field`

**addRunBodyName**

Your TestRail Project name

`addRunBodyName: 'myCustomName', // default: currentDate`

**addRunBodyDescription**

Your TestRail Project description

`addRunBodyDescription: 'My Test Run Description', // default: runnerStats.sanitizedCapabilities`

**regex**

The regex pattern used to match your test title to the TestRail test id

`regex: your+regex+pattern, // default: /[?\d]{6}/g`
