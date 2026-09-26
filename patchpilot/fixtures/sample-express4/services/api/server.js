const app = require('./app');

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`[api] listening on http://127.0.0.1:${port}`);
});
