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

test('GET /profile (no id) uses optional param default (":id?")', async () => {
  const res = await fetch(`${base}/profile`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.profile, 'me');
});

test('GET /profile/:id returns the id', async () => {
  const res = await fetch(`${base}/profile/42`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.profile, '42');
});

test('GET /logout redirects back to referrer (uses redirect "back")', async () => {
  const referer = `${base}/dashboard`;
  const res = await fetch(`${base}/logout`, {
    headers: { Referer: referer },
    redirect: 'manual',
  });
  assert.equal(res.status, 302);
  assert.equal(res.headers.get('location'), referer);
});
