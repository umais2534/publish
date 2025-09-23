import jwt from "jsonwebtoken";
import { getPool } from "../db/mssql.js";

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Accaess token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const pool = await getPool();
    
    const result = await pool.request()
      .input('userId', sql.UniqueIdentifier, decoded.userId)
      .query('SELECT id, email, name FROM Users WHERE id = @userId');
    
    if (result.recordset.length === 0) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    
    req.user = result.recordset[0];
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};