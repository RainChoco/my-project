
const fs = require("fs");
let c = fs.readFileSync("frontend/src/pages/LoginPage.jsx", "utf8");
c = c.replace(/const DEV_MA_STAFF_TOKEN =\s*.+?;/, "const DEV_MA_STAFF_TOKEN = \"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImZ1bGxfbmFtZSI6IkFsaWNlIFRhbiIsImVtYWlsIjoiYWxpY2UudGFuQHRvd25tcy5nb3Yuc2ciLCJyb2xlIjoibWFfc3RhZmYiLCJpYXQiOjE3ODUyNTM5NDYsImV4cCI6MTc4Nzg0NTk0Nn0.9EoZI89B8d1PaO3GJb6pPEO9jPvDX7SgB0KLfpar-g8\";");
fs.writeFileSync("frontend/src/pages/LoginPage.jsx", c);

