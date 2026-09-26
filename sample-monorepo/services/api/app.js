const express = require('express');

const app = express();
app.use(express.json());

// In-memory data store (demo uchun)
const items = [
  { id: '1', name: 'Alpha' },
  { id: '2', name: 'Beta' },
];

app.get('/items', (req, res) => {
  res.json(items);
});

app.get('/items/:id', (req, res) => {
  // Fix #2: req.param() removed in Express 5 → use req.params.id
  const id = req.params.id;
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

// Fix #1: app.del() removed in Express 5 → use app.delete()
app.delete('/items/:id', (req, res) => {
  // Fix #2: req.param() removed in Express 5 → use req.params.id
  const id = req.params.id;
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  const [removed] = items.splice(idx, 1);
  res.json({ deleted: removed.id });
});

module.exports = app;
