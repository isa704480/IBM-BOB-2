const express = require('express');

const app = express();

// Fix #3: optional param ':id?' not supported in path-to-regexp v8 (Express 5)
//         Use curly-brace optional segment: '/profile{/:id}'
app.get('/profile{/:id}', (req, res) => {
  const id = req.params.id || 'me';
  res.json({ profile: id });
});

app.get('/logout', (req, res) => {
  // Fix #4: res.redirect('back') removed in Express 5
  //         Explicit Referrer fallback required
  res.redirect(req.get('Referrer') || '/');
});

module.exports = app;
