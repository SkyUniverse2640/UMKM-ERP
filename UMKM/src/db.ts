// ponytail: mysql2 connection pool with parameterized queries. Add read-replicas when read load spikes.
import mysql from "mysql2/promise";

export const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "umkm_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
  // Business timezone is WIB (UTC+7). Force each connection's session TZ so MySQL
  // CURDATE()/NOW() match the app's local date — otherwise today's WIB sales fall
  // outside the "<= CURDATE()" analytics window and never reach Omset.
  timezone: "+07:00",
});

// Apply the WIB session time_zone on every physical connection (covers CURDATE/NOW in SQL).
pool.on("connection", (conn) => {
  conn.query("SET time_zone = '+07:00'");
});

// Safe parameterized query wrapper
export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const [rows] = await pool.execute(sql, params);
  return rows as T[];
}
