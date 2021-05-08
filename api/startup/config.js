const config = require('config');

function assertHostAlive() {
  if (!config.get('dbHost')) {
    throw new Error('FATAL ERROR: dbHost is not defined.');
  }
};

module.exports = { assertHostAlive };