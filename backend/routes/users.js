// routes/users.js (or wherever your user routes are)
import express from "express";
import { getPool, sql } from "../db/mssql.js";

const router = express.Router();

// Auth0 user sync endpoint
router.post("/auth0-sync", async (req, res) => {
  try {
    const { email, name, auth0Id, email_verified } = req.body;

    if (!email || !auth0Id) {
      return res.status(400).json({ error: "Email and Auth0 ID are required" });
    }

    const pool = await getPool();
    
    // Check if user exists by auth0_id
    const userCheck = await pool.request()
      .input('auth0Id', sql.NVarChar, auth0Id)
      .query('SELECT * FROM Users WHERE auth0_id = @auth0Id');

    if (userCheck.recordset.length > 0) {
      // User exists, return the user
      return res.status(200).json(userCheck.recordset[0]);
    }

    // Check if user exists by email (for migration)
    const emailCheck = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT * FROM Users WHERE email = @email');

    if (emailCheck.recordset.length > 0) {
      // Update existing user with auth0_id
      await pool.request()
        .input('id', sql.Int, emailCheck.recordset[0].id)
        .input('auth0Id', sql.NVarChar, auth0Id)
        .query('UPDATE Users SET auth0_id = @auth0Id WHERE id = @id');
      
      const updatedUser = await pool.request()
        .input('id', sql.Int, emailCheck.recordset[0].id)
        .query('SELECT * FROM Users WHERE id = @id');
      
      return res.status(200).json(updatedUser.recordset[0]);
    }

    // Create new user
    const result = await pool.request()
      .input('auth0Id', sql.NVarChar, auth0Id)
      .input('email', sql.NVarChar, email)
      .input('name', sql.NVarChar, name || email.split('@')[0])
      .input('emailVerified', sql.Bit, email_verified ? 1 : 0)
      .query(`
        INSERT INTO Users (auth0_id, email, name, email_verified, createdAt)
        OUTPUT inserted.*
        VALUES (@auth0Id, @email, @name, @emailVerified, GETDATE())
      `);

    res.status(201).json(result.recordset[0]);
  } catch (error) {
    console.error("Auth0 user sync error:", error);
    res.status(500).json({ error: "Failed to sync user" });
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