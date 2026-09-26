const express = require('express');

const app = express();

const invoices = {
  '1': { id: '1', amount: 100 },
  '2': { id: '2', amount: 250 },
};

app.get('/invoices/:id', (req, res) => {
  // Fix #5: req.param() removed in Express 5 → use req.params.id
  const id = req.params.id;
  const invoice = invoices[id];
  if (!invoice) return res.status(404).json({ error: 'not found' });
  res.json(invoice);
});

// Fix #6: bare '*' wildcard not supported in path-to-regexp v8 (Express 5)
//         Use named wildcard segment: '/*splat'
app.get('/*splat', (req, res) => {
  res.status(404).json({ error: 'route not found', path: req.path });
});

module.exports = app;
