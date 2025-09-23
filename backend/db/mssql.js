import sql from "mssql";

const dbConfig = {
 server: 'purrscribeai-sqlserver.database.windows.net',
    database: 'purrscribeai-sqldb',
    user: 'malikumais555@gmail.com',
    password: 'Qoro347947',
    port: 1433,
    options: {
        encrypt: true,
        trustServerCertificate: false
    },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let pool;
export async function getPool() {
  if (pool) return pool;
  try {
    pool = await new sql.ConnectionPool(dbConfig).connect();
    console.log("Connected to SQL Server");
    return pool;
  } catch (err) {
    console.error("Database connection failed:", err);
    throw err;
  }
}

export { sql };