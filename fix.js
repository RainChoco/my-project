
const fs = require("fs");
let c = fs.readFileSync("frontend/src/lib/apiClient.js", "utf8");
c = c.split("config.headers.Authorization = `Bearer ${token}`;").join("config.headers.set(`Authorization`, `Bearer ${token}`);");
fs.writeFileSync("frontend/src/lib/apiClient.js", c);

