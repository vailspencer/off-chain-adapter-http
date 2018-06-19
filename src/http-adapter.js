// @flow

import request from 'xhr-request';

type UploaderType = (data: Object) => Promise<string>;
type UpdaterType = (url: string, data: Object) => Promise<string>;

/**
 * Off-chain data adapter for HTTP.
 */
class HttpAdapter {
  uploader: (typeof undefined) | UploaderType;
  updater: (typeof undefined) | UpdaterType;

  constructor (options?: {| uploader?: UploaderType, updater?: UpdaterType |}) {
    if (options && options.uploader) {
      this.uploader = options.uploader;
    }
    if (options && options.updater) {
      this.updater = options.updater;
    }
  }

  _validateUrl (url: string) {
    const matchResult = url.match(/^([a-zA-Z-]+):\/\/(.+)/i);
    if (!matchResult || matchResult.length < 2) {
      throw new Error(`Invalid url: ${url}`);
    }
    if (matchResult[1].toLowerCase() !== 'https') {
      throw new Error(`Invalid url scheme: ${matchResult[1]} ('https' expected).`);
    }
  }

  /**
   * Retrieves data stored under a hash derived from url `bzz-raw://<hash>`
   * @throws {Error} When hash cannot be detected.
   */
  async download (url: string): Promise<?Object> {
    try {
      this._validateUrl(url);
    } catch (err) {
      return Promise.reject(err);
    }
    return new Promise((resolve, reject) => {
      request(url, {}, (err, data, response) => {
        if (err) {
          return reject(err);
        } else if (response.statusCode >= 400) {
          return reject(new Error(`Error ${response.statusCode}.`));
        }
        return resolve(JSON.parse(data));
      });
    });
  }

  /**
   * Stores data somewhere where they can be accessed via HTTP.
   *
   * Only available when options.uploader was provided during
   * initialization.
   *
   * @return {string} Resulting url such as `https://example.com/data`.
   */
  async upload (data: Object): Promise<string> {
    if (this.uploader) {
      return this.uploader(data);
    }
    return Promise.reject(new Error('Cannot perform upload: no uploader provided.'));
  }
  
  /**
   * Modifies data somewhere where they can be accessed via HTTP.
   *
   * Only available when options.updater was provided during
   * initialization.
   *
   * @return {string} Resulting url such as `https://example.com/data`.
   */
  async update (url: string, data: Object): Promise<string> {
    try {
      this._validateUrl(url);
    } catch (err) {
      return Promise.reject(err);
    }
    if (this.updater) {
      return this.updater(url, data);
    }
    return Promise.reject(new Error('Cannot perform update: no updater provided.'));
  }
}

export default HttpAdapter;