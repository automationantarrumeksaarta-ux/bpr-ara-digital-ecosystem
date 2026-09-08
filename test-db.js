const Database = require('better-sqlite3');
const db = new Database('test.sqlite');
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS test (id INT);
    CREATE TABLE test2 (id INT);
    CREATE TABLE test3 (id INT);
  `);
  console.log('Success');
} catch (e) {
  console.error(e);
}
