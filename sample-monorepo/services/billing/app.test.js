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

test('GET /invoices/:id returns an invoice (uses req.param)', async () => {
  const res = await fetch(`${base}/invoices/1`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.amount, 100);
});

test('GET /invoices/:id returns 404 for unknown invoice', async () => {
  const res = await fetch(`${base}/invoices/999`);
  assert.equal(res.status, 404);
  const body = await res.json();
  assert.equal(body.error, 'not found');
});

test('unknown route hits the "*" wildcard catch-all', async () => {
  const res = await fetch(`${base}/nope/here`);
  assert.equal(res.status, 404);
  const body = await res.json();
  assert.equal(body.error, 'route not found');
});
