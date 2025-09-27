import sql from "mssql";

const connectionString = "Server=tcp:purrscribeai-sqlserver.database.windows.net,1433;Initial Catalog=purrscribe-db;Persist Security Info=False;User ID=purrscribeai_db_admin;Password=ActualPassword123!;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;";

// Ya phir object format mein:
const dbConfig = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: true,
    trustServerCertificate: false,
    enableArithAbort: true
  }
};

let pool;
export async function getPool() {
  if (pool) return pool;
  try {
    pool = await sql.connect(dbConfig); // ya connectionString
    console.log("✅ Connected to Azure SQL Database");
    return pool;
  } catch (err) {
    console.error("❌ Database connection failed:", err);
    throw err;
  }
}

export { sql };