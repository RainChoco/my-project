const sqlite3 = require('sqlite3').verbose();
describe('DB Dump', () => {
  it('dumps tenders', (done) => {
    const db = new sqlite3.Database('tender_db.sqlite');
    db.serialize(() => {
      db.all("SELECT * FROM tenders LIMIT 5", (err, rows) => {
        if (err) console.log("ERROR:", err.message);
        else console.log("Tenders:", JSON.stringify(rows, null, 2));
        db.all("PRAGMA table_info(tenders);", (err, rows) => {
          console.log("Cols:", rows.map(r => r.name));
          done();
        });
      });
    });
  });
});
