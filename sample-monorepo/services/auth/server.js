const app = require('./app');

const port = process.env.PORT || 3002;
app.listen(port, () => {
  console.log(`[auth] listening on http://127.0.0.1:${port}`);
});
