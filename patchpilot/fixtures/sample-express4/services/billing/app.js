const express = require('express');

const app = express();

const invoices = {
  '1': { id: '1', amount: 100 },
  '2': { id: '2', amount: 250 },
};

app.get('/invoices/:id', (req, res) => {
  // ⚠️ BREAKING (Express 5): req.param() olib tashlangan.
  const id = req.param('id');
  const invoice = invoices[id];
  if (!invoice) return res.status(404).json({ error: 'not found' });
  res.json(invoice);
});

// ⚠️ BREAKING (Express 5): '*' wildcard endi ishlamaydi -> '/*splat'
app.get('*', (req, res) => {
  res.status(404).json({ error: 'route not found', path: req.path });
});

module.exports = app;
