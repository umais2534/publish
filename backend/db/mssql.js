import sql from "mssql";

const connectionString = "Server=tcp:purrscribeai-sqlserver.database.windows.net,1433;Initial Catalog=purrscribe-db;Persist Security Info=False;User ID=purrscribeai_db_admin;Password=ActualPassword123!;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;";

// Ya phir object format mein:
const dbConfig = {
  server: 'purrscribeai-sqlserver.database.windows.net',
  database: 'purrscribe-db',
  user: 'purrscribeai_db_admin',
  password: 'Qoro347947', 
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