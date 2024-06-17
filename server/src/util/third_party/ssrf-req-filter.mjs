// Below code copied from https://github.com/y-mehta/ssrf-req-filter and updated
// to use ESM, etc.

// https://github.com/y-mehta/ssrf-req-filter/blob/286e29db59580f1d8df93449318ef4d91123768e/lib/index.js

/* eslint-disable */

/*
MIT License

Copyright (c) 2020 Yash Mehta

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

import http from 'http';
import https from 'https';
import ipaddr from 'ipaddr.js';

const checkIp = (ip) => {
  if (!ipaddr.isValid(ip)) {
    return true;
  }
  try {
    const addr = ipaddr.parse(ip);
    const range = addr.range();
    if (range !== 'unicast') {
      return false; // Private IP Range
    }
  } catch (err) {
    return false;
  }
  return true;
};

// prevent memory leak
const ACTIVE = Symbol('active');

const requestFilterHandler = (agent) => {
  if (agent[ACTIVE]) {
    return agent;
  }
  agent[ACTIVE] = true;
  const { createConnection } = agent;
  agent.createConnection = function (options, func) {
    const { host: address } = options;
    if (!checkIp(address)) {
      throw new Error(`Call to ${address} is blocked.`);
    }
    const socket = createConnection.call(this, options, func);
    socket.on('lookup', (error, address) => {
      if (error || checkIp(address)) {
        return false;
      }
      return socket.destroy(new Error(`Call to ${address} is blocked.`));
    });
    return socket;
  };
  return agent;
};

export const manageConnection = (url) => {
  const httpAgent = new http.Agent();
  const httpsAgent = new https.Agent();
  const agent = url.startsWith('https') ? httpsAgent : httpAgent;
  return requestFilterHandler(agent);
};
