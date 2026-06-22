const https = require('https');
https.get('https://registry.npmjs.org/-/ping', res => {
  console.log('STATUS', res.statusCode);
  res.resume();
}).on('error', err => {
  console.error(err);
});
