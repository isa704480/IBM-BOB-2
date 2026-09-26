const express = require('express');

const app = express();
app.use(express.json());

const items = [
  { id: '1', name: 'Alpha' },
  { id: '2', name: 'Beta' },
];

app.get('/items', (req, res) => {
  res.json(items);
});

app.get('/items/:id', (req, res) => {
  // ⚠️ BREAKING (Express 5): req.param() olib tashlangan.
  const id = req.param('id');
  const item = items.find((i) => i.id === id);
  if (!item) return res.status(404).json({ error: 'not found' });
  res.json(item);
});

app.post('/items', (req, res) => {
  const name = req.body && req.body.name;
  const item = { id: String(items.length + 1), name };
  items.push(item);
  res.status(201).json(item);
});

// ⚠️ BREAKING (Express 5): app.del() olib tashlangan -> app.delete()
app.del('/items/:id', (req, res) => {
  const id = req.param('id');
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  const [removed] = items.splice(idx, 1);
  res.json({ deleted: removed.id });
});

module.exports = app;
