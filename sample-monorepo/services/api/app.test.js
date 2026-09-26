const { test, before, after } = require('node:test');
const assert = require('node:assert');
const app = require('./app');

let server;
let base;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      base = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
});

after(() => server && server.close());

test('GET /items returns the list', async () => {
  const res = await fetch(`${base}/items`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(Array.isArray(body));
  assert.ok(body.length >= 2);
});

test('GET /items/:id returns one item (uses req.param)', async () => {
  const res = await fetch(`${base}/items/1`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.name, 'Alpha');
});

test('GET /items/:id returns 404 for unknown id', async () => {
  const res = await fetch(`${base}/items/999`);
  assert.equal(res.status, 404);
});

test('POST /items creates an item', async () => {
  const res = await fetch(`${base}/items`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Gamma' }),
  });
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.equal(body.name, 'Gamma');
});

test('DELETE /items/:id removes an item (uses app.del)', async () => {
  const res = await fetch(`${base}/items/2`, { method: 'DELETE' });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.deleted, '2');
});
