/* globals axe */
import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import detect from 'detect-port';
import Server from './helpers/Server';
import Driver from './helpers/Driver';

const SERVER_PORT = 8899;
const SERVER_PATH = './';
const PATH_TO_AXE = './node_modules/axe-core/axe.min.js';
const appDirectory = fs.realpathSync(process.cwd());
const log = console.log;

/**
 * Resolves the given relative path into absolute path
 * @param {string} relativePath
 * @return {string} absolute path
 */
function resolvePath(relativePath) {
  return path.resolve(appDirectory, relativePath);
}

/**
 * Returns a promise that is resolved when the evaluation of
 * axe has been terminated successfully
 * @async
 * @param {string} page
 * @return {Promise}
 */
async function executeAxe(page) {
  await page.injectFile(resolvePath(PATH_TO_AXE));
  return await page.evaluate(() => {
    // we make sure that axe is executed in the next tick after
    // the page emits the load event, giving priority for the
    // original JS to be evaluated
    return new Promise(resolve => {
      setTimeout(resolve, 0);
    }).then(() => axe.run());
  });
}

/**
 * Processes the output of axe and renders the result
 * @param {object} axeReport
 * @throw {object}
 */
function decorate(axeReport) {
  if (!axeReport || !axeReport.violations) {
    throw new Error('Invalid Axe Report!');
  }
  if (0 === axeReport.violations.length) {
    happyPath();
  } else {
    sadPath(axeReport);
  }
}

/**
 * Renders the happy path which occurs when no accessibility
 * violations are detected
 * @return {void}
 */
function happyPath() {
  log(chalk.green('No accessibility violation found'));
}

/**
 * Renders the sad path which occurs when at least one
 * accessibility violation is detected
 * @param {object} axeReport - report collected by axe
 * @throw {object} report collected by axe
 */
function sadPath(axeReport) {
  const noOfViolations = axeReport.violations.length;
  log(chalk.red(`${noOfViolations} accessibility violations detected`));
  axeReport.violations.forEach((data, idx) => {
    log();
    log('  ', chalk.red(`${idx + 1}. ${data.description} (${data.id})`));
    log('  ', chalk.grey(data.help));
    log('  ', chalk.underline(data.impact));
    log('  ', chalk.yellow(data.nodes[0].target.join(' ')));

    data.nodes[0].any.map(v => `- ${v.message}`).forEach(v => log('  ', v));

    log('  ', chalk.grey('For detais, see: '), chalk.blue(data.helpUrl));
  });
}

/**
 * Returns the first available port starting from the given number
 * @async
 * @param {number} port
 * @return {number} available port
 */
async function getAvailablePort(port) {
  const availablePort = await detect(port);
  if (availablePort === port) return port;
  return getAvailablePort(availablePort);
}

/**
 * Executes the test against the given url that is hosted at the
 * specified document root.
 * @async
 * @param {string} indexHtml - used to specifiy the demo page of the component
 * @param {string} serverPath - document root
 * @param {boolean} verbose
 * @return {Promise}
 */
async function exec({indexHtml, serverPath, verbose}) {
  if (!verbose) console.log = () => {};

  const port = await getAvailablePort(SERVER_PORT);
  const path = serverPath || resolvePath(SERVER_PATH);
  const server = new Server();
  const serverConfig = await server.start(port, path);

  const driver = new Driver();
  driver.on('exit', server.stop);

  const url = `http://localhost:${serverConfig.port}/${indexHtml}`;
  const page = await driver.connect(url);
  const report = await executeAxe(page);

  await driver.exit();

  console.log = log;

  return report;
}

export {exec, decorate};
export default exec;
