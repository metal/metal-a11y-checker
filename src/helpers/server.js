import { Promise } from "es6-promise";
import express from "express";

class Server {
  /**
	 * Starts the express server
	 * @param {number} port
	 * @param {string} dir
	 * @return {Promise}
	 * @throw {Error}
	 */
  start(port, dir) {
    if (this.app) throw new Error("Server is already running!");

    if (!port) port = 9000;
    if (!dir) dir = "./";

    this.app = express();
    this.app.use(express.static(dir));
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(port, function(err) {
        if (err) reject(err);
        console.log(`Server is listening on port ${port} hosting: ${dir}`);
        resolve({ port, dir });
      });
    });
  }

  /**
	 * Stops the server
	 * @return {Promise}
	 */
  stop() {
    return Promise.resolve().then(() => this.server.close());
  }
}

export { Server };
export default Server;
