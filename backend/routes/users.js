// routes/users.js (or wherever your user routes are)
import express from "express";
import { getPool, sql } from "../db/mssql.js";

const router = express.Router();

// Auth0 user sync endpoint
// routes/users.js - Fix the backend route
router.post('/auth0/sync', async (req, res) => {
  try {
    const { auth0Id, email, name, emailVerified } = req.body;
    
    console.log("🔄 Syncing Auth0 user:", { auth0Id, email, name });
    
    if (!auth0Id || !email) {
      return res.status(400).json({ error: 'Auth0 ID and email are required' });
    }

    const pool = await getPool();
    
    // Check if user already exists by auth0_id
    const userResult = await pool.request()
      .input('auth0Id', sql.NVarChar, auth0Id)
      .query('SELECT * FROM Users WHERE auth0_id = @auth0Id');
    
    let user;
    
    if (userResult.recordset.length === 0) {
      // Create new user
      console.log("📝 Creating new user for Auth0 ID:", auth0Id);
      const createResult = await pool.request()
        .input('auth0Id', sql.NVarChar, auth0Id)
        .input('email', sql.NVarChar, email)
        .input('name', sql.NVarChar, name || email.split('@')[0])
        .input('emailVerified', sql.Bit, emailVerified ? 1 : 0)
        .query(`
          INSERT INTO Users (auth0_id, email, name, email_verified, createdAt, updatedAt)
          OUTPUT inserted.id, inserted.email, inserted.name, inserted.auth0_id, inserted.createdAt
          VALUES (@auth0Id, @email, @name, @emailVerified, GETDATE(), GETDATE())
        `);
      
      user = createResult.recordset[0];
    } else {
      // Update existing user
      user = userResult.recordset[0];
      console.log("✅ User already exists:", user.id);
      
      await pool.request()
        .input('auth0Id', sql.NVarChar, auth0Id)
        .input('email', sql.NVarChar, email)
        .input('name', sql.NVarChar, name || email.split('@')[0])
        .input('emailVerified', sql.Bit, emailVerified ? 1 : 0)
        .query(`
          UPDATE Users 
          SET email = @email, name = @name, email_verified = @emailVerified, updatedAt = GETDATE()
          WHERE auth0_id = @auth0Id
        `);
    }
    
    // Generate token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        auth0Id: user.auth0_id 
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        auth0Id: user.auth0_id
      }
    });
    
  } catch (error) {
    console.error('Auth0 sync error:', error);
    res.status(500).json({ error: 'Failed to sync user' });
  }
});
// Get user by Auth0 ID
router.get("/by-auth0/:auth0Id", async (req, res) => {
  try {
    const { auth0Id } = req.params;

    const pool = await getPool();
    const result = await pool.request()
      .input('auth0Id', sql.NVarChar, auth0Id)
      .query('SELECT id, email, name, auth0_id, createdAt FROM Users WHERE auth0_id = @auth0Id');

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(result.recordset[0]);
  } catch (error) {
    console.error("Get user by Auth0 ID error:", error);
    res.status(500).json({ error: "Failed to get user" });
  }
});

export default router;