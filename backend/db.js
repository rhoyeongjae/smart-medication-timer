const mysql = require("mysql2");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({
  path: path.join(__dirname, ".env"),
  override: true,
});

console.log("DB_USER:", process.env.DB_USER ? "설정됨" : "비어 있음");
console.log("DB_PASSWORD:", process.env.DB_PASSWORD ? "설정됨" : "비어 있음");

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

db.getConnection((err, connection) => {
  if (err) {
    console.log("MySQL 연결 실패:", err.message);
    return;
  }

  console.log("MySQL 연결 성공!");
  connection.release();
});

module.exports = db;
