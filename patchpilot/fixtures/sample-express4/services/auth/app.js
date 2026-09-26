const express = require('express');

const app = express();

// ⚠️ BREAKING (Express 5): ixtiyoriy param ":id?" endi ishlamaydi.
app.get('/profile/:id?', (req, res) => {
  const id = req.params.id || 'me';
  res.json({ profile: id });
});

app.get('/logout', (req, res) => {
  // ⚠️ BREAKING (Express 5): res.redirect('back') olib tashlangan.
  res.redirect('back');
});

module.exports = app;
