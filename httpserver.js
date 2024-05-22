import 'dotenv/config';
import http from 'node:http';
import { parse } from 'node:url';
import { normalize, resolve, sep } from 'node:path';
import { stat, readFile } from 'node:fs';
import mime from 'mime';

const BASE_DIR = resolve(process.cwd(), 'root');

function getFilenameFromPath(filepath, callback) {
  // Sanitize filepath (if necessary)
  filepath = filepath.replace('/\+/g', '%20');

  // Finalize filepath as an absolute path to requested resource
  let filename = normalize(BASE_DIR + sep + filepath);
  
  function onStatComplete(err, stats) {
    if (err) {
      return callback(err, filepath);
    }
    
    if (stats.isDirectory()) {
      // Requested resource is a directory, check if index.html is available under this directory
      filename = normalize(filename + sep + 'index.html'); 
      stat(filename, onStatComplete);
      return;
    }

    if (stats.isFile()) {
      return callback(null, filename);
    } else {
      let err = new Error('File Not Found');
      return callback(err, filename);
    }
  }
  
  if (filename.substring(0, BASE_DIR.length) != BASE_DIR) {
    console.log('Invalid resource requested.');
    let err = new Error('Not Found');
    err.code = 'ENOENT';
    return callback(err, filename);
  }

  stat(filename, onStatComplete);
}

function httpHandler(request, response) { 
  
  function writeError(err) { 
    if(err.code == 'ENOENT') {
      response.writeHead(404, { 'Content-Type': 'text/plain' });
      response.write('Not Found');
      response.end();
    } else {
      response.writeHead(500, { 'Content-Type': 'text/plain' });
      response.write('Internal Server Error');
      response.end()
    }
  }

  function onGotFilename(err, filename) {
    if(err) {
      writeError(err);
      return;
    } else {
      const mimeType = mime.getType(filename);
      readFile(filename, function (err, data) {
        if(err) {
          writeError(err);
        } else {
          response.writeHead(200, { 'Content-Type': mimeType });
          response.write(data, 'binary');
          response.end();
        }
      });
    }
  }

  // Retrieve url, parse into path of requested resource
  let path = parse(request.url).pathname;

  // After retrieving the path, attempt to retrieve resource
  getFilenameFromPath(path, onGotFilename);
}

export default function startHttpServer() {
  console.log('Server listening at port: ' + process.env.PORT + ' at hostname ' + process.env.HOSTNAME);
  return http.createServer(httpHandler).listen(process.env.PORT, process.env.HOSTNAME);
}
