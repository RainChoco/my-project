const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('tender_db.sqlite');

db.serialize(() => {
  db.all("SELECT id, contractId, tender_ref_no, vendor_name FROM tenders ORDER BY created_at DESC LIMIT 5", (err, rows) => {
    if (err) {
      console.error("Error reading tenders:", err.message);
    } else {
      console.log("Tenders from DB:");
      console.log(JSON.stringify(rows, null, 2));
    }
  });
  
  db.all("PRAGMA table_info(tenders);", (err, rows) => {
    if (err) {
      console.error("Error reading schema:", err.message);
    } else {
      const contractCol = rows.find(r => r.name.toLowerCase().includes('contract'));
      console.log("\nContract column schema:", contractCol);
    }
  });
});

db.close();
