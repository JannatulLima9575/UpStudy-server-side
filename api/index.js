// api/index.js
const app = require('../index');

module.exports = (req, res) => {
  app(req, res);
};