import puppeteer from 'puppeteer';
import Events from 'events';

/**
 * Wrapper around setting up a headless browser environment
 * using puppeteer chrome-driver
 */
class Driver {
  /**
   * Constructs a Driver instance
   */
  constructor() {
    this.emitter = new Events.EventEmitter();
    this.browser = null;
  }

  /**
   * Creates a Puppeteer instance and connects to the given address
   * @param {string} address
   * @return {Promise}
   */
  async connect(address) {
    this.browser = await puppeteer.launch();
    const page = await this.browser.newPage();
    await page.goto(address, {waitUntil: 'networkidle'});
    console.log(`Connected to ${address}`);
    this.emitter.emit('connect');
    return page;
  }

  /**
   * Closes the Puppeteer session
   */
  exit() {
    this.emitter.emit('exit');
    if (this.browser) this.browser.close();
  }

  /**
   * Registers listener to the given event
   * @param {string} event - event ID
   * @param {function} listener - listener function to be registered
   * @return {this}
   */
  on(event, listener) {
    this.emitter.on(event, listener);
    return this;
  }
}

export {Driver};
export default Driver;
