//db.js
const { Pool } = require('pg');

const pool = new Pool({
  user: 'fahim',
  host: 'localhost',
  database: 'book-store',  // Changed to your bookstore database
  password: '1234',
  port: 5432,
});

pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error acquiring client', err.stack);
  }
  client.query('SELECT NOW()', (err, result) => {
    release();
    if (err) {
      return console.error('Error executing query', err.stack);
    }
    console.log('Connected to Bookstore Database!');
  });
});

module.exports = pool;