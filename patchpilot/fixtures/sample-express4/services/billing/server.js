const app = require('./app');

const port = process.env.PORT || 3003;
app.listen(port, () => {
  console.log(`[billing] listening on http://127.0.0.1:${port}`);
});
