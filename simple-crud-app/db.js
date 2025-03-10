//db.js
const { Pool } = require('pg');


// to connect to database on terminal
// psql -U fahim -d book-store1


const pool = new Pool({
  user: 'fahim',
  host: 'localhost',
  database: 'book-store1',  // Changed to your bookstore database
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
