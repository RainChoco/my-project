const sqlite3 = require('sqlite3').verbose();
describe('Check Eval', () => {
  it('dumps schema', (done) => {
    const db = new sqlite3.Database('tender_db.sqlite');
    db.serialize(() => {
      db.all("PRAGMA table_info(evaluations);", (err, rows) => {
        if (err) console.error("Error reading schema:", err.message);
        else console.log("Evaluations Cols:", rows.map(r => r.name));
        done();
      });
    });
  });
});
