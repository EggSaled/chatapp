#! /usr/bin/env node

import startHttpServer from './httpserver.js';
import startSocketServer from './socketserver.js';

const httpServer = startHttpServer(),
  socketServer = startSocketServer(httpServer);
