const http = require('http');
const fs = require('fs');

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      console.log('--- REACT ERROR RECEIVED ---');
      console.log(body);
      fs.writeFileSync('scratch/react_error.log', body);
      res.writeHead(200);
      res.end('ok');
    });
  }
});

server.listen(3738, () => console.log('Listening on 3738'));
