require('dotenv').config();

const { Pool, Client } = require('pg')

// pools will use environment variables
// for connection information
const pool = new Pool()

pool.query('select * from tword', (err, res) => {
  //console.log(err, res.rows)
  console.table(res.rows);
  pool.end()
})
