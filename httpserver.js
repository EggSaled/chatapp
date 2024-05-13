import http from 'node:http';
import { parse } from 'node:url';
import { normalize, resolve, sep } from 'node:path';
import { stat, readFile } from 'node:fs';
import mime from 'mime';

const BASE_DIR = resolve(process.cwd(), 'root');

function getMIMEType(filename) {
  const mimeType = mime.getType(filename);
}

function getFilenameFromPath(filepath, callback) {
  // Sanitize filepath (if necessary)
  filepath = filepath.replace('/\+/g', '%20');

  // Finalize filepath as an absolute path to requested resource
  let filename = normalize(BASE_DIR + sep + filepath);
  
  function onStatComplete(err, stats) {
    if (err) {
      // Write error
      console.error('Error ' + err.message);
      return;
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
  // Retrieve url, parse into path of requested resource
  let path = parse(request.url).pathname;

  
  function onGotFilename(err, filename) {
    if(err) {
      // Write Error
      console.log('Error: ' + err.message);
      return;
    } else {
      const mimeType = mime.getType(filename);
      readFile(filename, function (err, data) {
        if(err) {
          // Write Error
        } else {
          response.writeHead(200, { 'Content-Type': mimeType });
          response.write(data, 'binary');
          response.end();
        }
      });
    }
  }

  // After retrieving the path, attempt to retrieve resource
  getFilenameFromPath(path, onGotFilename);
}

export default function startHttpServer() {
  /*
  return http.createServer(function(request, response){
    // response.setHeader('Content-Type', 'application/json');
    console.log(BASE_DIR);
    response.writeHead(200, {'Content-Type': 'application/json'});
    response.end(JSON.stringify({
      'message' : 'Hello, World!'
    }));
  })
    .listen(3490);
  */

  return http.createServer(httpHandler).listen(3490);
}
