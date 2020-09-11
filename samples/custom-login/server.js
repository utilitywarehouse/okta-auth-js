/* eslint-disable no-console */

const express = require('express');

const app = express();
const port = '8080';

app.use(express.static('./public')); // sample html is here
app.use(express.static('../../build/dist')); // okta-auth-js is served from here

app.get('/implicit/callback', function(req, res) {
  res.redirect('/');
});

app.listen(port, function () {
  console.log(`Test app running at http://localhost/${port}!\n`);
});
