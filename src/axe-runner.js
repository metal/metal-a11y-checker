import 'babel-polyfill';
import chalk from 'chalk';
import dl from 'directory-list';
import fs from 'fs';
import path from 'path';
import yargs from 'yargs';
import {exec, decorate} from './axe-driver';

const SEPARATOR = '────────────────';
const log = console.log;

const argv = yargs
  .usage('Usage: $0 [options]')
  .example('$0 --content demo/index.html', 'Executes the accessibility tests')
  .example(
    '$0 --c demo/index.html -r /var/www/',
    'Executes the accessibility tests'
  )
  .nargs('content', 1)
  .describe('content', 'relative URL where the testable content can be found')
  .nargs('root', 1)
  .describe('root', 'Specifies the document root of the test server')
  .nargs('packages', 1)
  .describe(
    'packages',
    'Execute a11y against all project in the specified directory'
  )
  .help('h')
  .version()
  .alias('h', 'help')
  .alias('v', 'version')
  .alias('p', 'packages')
  .alias('r', 'root')
  .alias('c', 'content').argv;

const appDirectory = fs.realpathSync(process.cwd());
const indexHtml = argv.content || 'demos/index.html';
const serverPath = path.resolve(argv.root || appDirectory);

/**
 * Prints the result of an individual execution
 * @param {object} report
 */
function decorateIndividualReport(report, key) {
  log(chalk.bold(key));
  log(chalk.bold(SEPARATOR));
  decorate(report);
  log();
}

/**
 * Processes the colletion of reports and outputs the results accordingly.
 * If any violation is detected it also terminates the process with exit code 1
 * @param {object} reports
 */
function processReports(reports) {
  let sumViolations = 0;
  const violationsDetected = Object.keys(reports)
    .map(v => reports[v])
    .map(report => (sumViolations = sumViolations + report.violations.length));

  if (sumViolations > 0) {
    log(
      chalk.red(
        `${sumViolations} accessibility violations have been detected in total.`
      )
    );
    process.exit(1);
  } else {
    log(chalk.green('No accessibility violations found in any packages'));
    process.exit(0);
  }
}

/**
 * Processes the report and terminates the process if there is any
 * accessibility violations amongst the collected reports
 * @param {object} report
 */
function processReport(report) {
  if (report.violations.length > 0) process.exit(1);
  process.exit(0);
}

/**
 * Prints the exception to the stderr and terminets the process
 * @param {object} ex
 */
function processException(ex) {
  console.error(ex);
  process.exit(1);
}

/**
 * Loops through a swallow one-level object and invokes the given
 * callback function with the value and key respectively
 * @param {object} obj
 * @param {function} callback
 *
 */
function traverseObj(obj, callback) {
  Object.keys(obj).forEach(key => callback(obj[key], key));
}

const ciMode = Boolean(argv['ci-mode']);

if (argv['packages']) {
  const packagesDir = argv['packages'] || 'packages';
  const packagesPath = path.join(path.resolve(appDirectory), packagesDir);
  const reports = {};

  dl.list(`${packagesPath}/`, true, list => {
    const loop = list.reduce((promise, dir) => {
      return promise
        .then(() => {
          const serverPath = path.join(packagesPath, dir);
          exec({indexHtml, serverPath, ciMode});
        })
        .then(report => (reports[dir] = report));
    }, Promise.resolve());

    loop
      .then(() => traverseObj(reports, decorateIndividualReport))
      .then(() => processReports(reports))
      .catch(ex => processException(ex));
  });
} else {
  exec({indexHtml, serverPath, ciMode})
    .then(report => (decorate(report), processReport(report)))
    .catch(ex => processException(ex));
}
