import express from "express";
import { getPool, sql } from "../db/mssql.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Get all transcriptions for the authenticated user
router.get("/", authenticateToken, async (req, res) => {
  try {
    const pool = await getPool();
    const { category, pet, clinic, visitType, page = 1, limit = 10 } = req.query;
    
    let whereClause = "WHERE t.user_id = @userId";
    let inputParams = { userId: sql.UniqueIdentifier, value: req.user.id };
    
    if (category) {
      whereClause += " AND tc.name = @category";
      inputParams.category = sql.NVarChar, value: category;
    }
    
    if (pet) {
      whereClause += " AND p.id = @petId";
      inputParams.petId = sql.UniqueIdentifier, value: pet;
    }
    
    if (clinic) {
      whereClause += " AND c.id = @clinicId";
      inputParams.clinicId = sql.UniqueIdentifier, value: clinic;
    }
    
    if (visitType) {
      whereClause += " AND t.visit_type = @visitType";
      inputParams.visitType = sql.NVarChar, value: visitType;
    }
    
    const offset = (page - 1) * limit;
    
    const result = await pool.request()
      .input('userId', sql.UniqueIdentifier, req.user.id)
      .input('category', sql.NVarChar, category || null)
      .input('petId', sql.UniqueIdentifier, pet || null)
      .input('clinicId', sql.UniqueIdentifier, clinic || null)
      .input('visitType', sql.NVarChar, visitType || null)
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, limit)
      .query(`
        SELECT 
          t.id,
          t.title,
          t.content,
          tc.name as category,
          p.name as pet_name,
          c.name as clinic_name,
          t.visit_type,
          t.recording_duration,
          t.created_at
        FROM Transcriptions t
        LEFT JOIN TranscriptionCategories tc ON t.category_id = tc.id
        LEFT JOIN Pets p ON t.pet_id = p.id
        LEFT JOIN Clinics c ON t.clinic_id = c.id
        ${whereClause}
        ORDER BY t.created_at DESC
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY
      `);
    
    const countResult = await pool.request()
      .input('userId', sql.UniqueIdentifier, req.user.id)
      .query(`
        SELECT COUNT(*) as total 
        FROM Transcriptions t
        ${whereClause}
      `);
    
    res.json({
      transcriptions: result.recordset,
      total: countResult.recordset[0].total,
      page: parseInt(page),
      totalPages: Math.ceil(countResult.recordset[0].total / limit)
    });
  } catch (err) {
    console.error("Error fetching transcriptions:", err);
    res.status(500).json({ error: "Failed to fetch transcriptions" });
  }
});

// Save a new transcription
router.post("/", authenticateToken, async (req, res) => {
  try {
    const {
      title,
      content,
      category,
      petId,
      clinicId,
      visitType,
      templateId,
      recordingDuration
    } = req.body;
    
    if (!title || !content || !category) {
      return res.status(400).json({ error: "Title, content, and category are required" });
    }
    
    const pool = await getPool();
    
    // Get category ID
    const categoryResult = await pool.request()
      .input('categoryName', sql.NVarChar, category)
      .query('SELECT id FROM TranscriptionCategories WHERE name = @categoryName');
    
    if (categoryResult.recordset.length === 0) {
      return res.status(400).json({ error: "Invalid category" });
    }
    
    const categoryId = categoryResult.recordset[0].id;
    
    // Validate pet and clinic belong to user
    if (petId) {
      const petResult = await pool.request()
        .input('petId', sql.UniqueIdentifier, petId)
        .input('userId', sql.UniqueIdentifier, req.user.id)
        .query('SELECT id FROM Pets WHERE id = @petId AND user_id = @userId');
      
      if (petResult.recordset.length === 0) {
        return res.status(400).json({ error: "Invalid pet" });
      }
    }
    
    if (clinicId) {
      const clinicResult = await pool.request()
        .input('clinicId', sql.UniqueIdentifier, clinicId)
        .input('userId', sql.UniqueIdentifier, req.user.id)
        .query('SELECT id FROM Clinics WHERE id = @clinicId AND user_id = @userId');
      
      if (clinicResult.recordset.length === 0) {
        return res.status(400).json({ error: "Invalid clinic" });
      }
    }
    
    // Insert transcription
    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, sql.NEWID())
      .input('userId', sql.UniqueIdentifier, req.user.id)
      .input('title', sql.NVarChar, title)
      .input('content', sql.NVarChar, content)
      .input('categoryId', sql.UniqueIdentifier, categoryId)
      .input('petId', sql.UniqueIdentifier, petId || null)
      .input('clinicId', sql.UniqueIdentifier, clinicId || null)
      .input('visitType', sql.NVarChar, visitType || null)
      .input('templateId', sql.NVarChar, templateId || null)
      .input('recordingDuration', sql.Int, recordingDuration || 0)
      .query(`
        INSERT INTO Transcriptions (
          id, user_id, title, content, category_id, pet_id, clinic_id, 
          visit_type, template_id, recording_duration
        ) 
        VALUES (
          @id, @userId, @title, @content, @categoryId, @petId, @clinicId, 
          @visitType, @templateId, @recordingDuration
        )
        SELECT * FROM Transcriptions WHERE id = @id
      `);
    
    res.status(201).json({
      message: "Transcription saved successfully",
      transcription: result.recordset[0]
    });
  } catch (err) {
    console.error("Error saving transcription:", err);
    res.status(500).json({ error: "Failed to save transcription" });
  }
});

// Get a single transcription
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    
    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .input('userId', sql.UniqueIdentifier, req.user.id)
      .query(`
        SELECT 
          t.id,
          t.title,
          t.content,
          tc.name as category,
          p.name as pet_name,
          p.id as pet_id,
          c.name as clinic_name,
          c.id as clinic_id,
          t.visit_type,
          t.template_id,
          t.recording_duration,
          t.created_at
        FROM Transcriptions t
        LEFT JOIN TranscriptionCategories tc ON t.category_id = tc.id
        LEFT JOIN Pets p ON t.pet_id = p.id
        LEFT JOIN Clinics c ON t.clinic_id = c.id
        WHERE t.id = @id AND t.user_id = @userId
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "Transcription not found" });
    }
    
    res.json(result.recordset[0]);
  } catch (err) {
    console.error("Error fetching transcription:", err);
    res.status(500).json({ error: "Failed to fetch transcription" });
  }
});

// Update a transcription
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      content,
      category,
    
      petId,
      clinicId,
      visitType
    } = req.body;
    
    const pool = await getPool();
    
    // Check if transcription exists and belongs to user
    const existingResult = await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .input('userId', sql.UniqueIdentifier, req.user.id)
      .query('SELECT id FROM Transcriptions WHERE id = @id AND user_id = @userId');
    
    if (existingResult.recordset.length === 0) {
      return res.status(404).json({ error: "Transcription not found" });
    }
    
    // Get category ID if category is being updated
    let categoryId = null;
    if (category) {
      const categoryResult = await pool.request()
        .input('categoryName', sql.NVarChar, category)
        .query('SELECT id FROM TranscriptionCategories WHERE name = @categoryName');
      
      if (categoryResult.recordset.length === 0) {
        return res.status(400).json({ error: "Invalid category" });
      }
      
      categoryId = categoryResult.recordset[0].id;
    }
    
    // Build dynamic update query
    let updateFields = [];
    let inputParams = {
      id: { type: sql.UniqueIdentifier, value: id },
      userId: { type: sql.UniqueIdentifier, value: req.user.id }
    };
    
    if (title) {
      updateFields.push("title = @title");
      inputParams.title = { type: sql.NVarChar, value: title };
    }
    
    if (content) {
      updateFields.push("content = @content");
      inputParams.content = { type: sql.NVarChar, value: content };
    }
    
    if (categoryId) {
      updateFields.push("category_id = @categoryId");
      inputParams.categoryId = { type: sql.UniqueIdentifier, value: categoryId };
    }
    
    if (petId !== undefined) {
      updateFields.push("pet_id = @petId");
      inputParams.petId = { type: sql.UniqueIdentifier, value: petId || null };
    }
    
    if (clinicId !== undefined) {
      updateFields.push("clinic_id = @clinicId");
      inputParams.clinicId = { type: sql.UniqueIdentifier, value: clinicId || null };
    }
    
    if (visitType !== undefined) {
      updateFields.push("visit_type = @visitType");
      inputParams.visitType = { type: sql.NVarChar, value: visitType || null };
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }
    
    updateFields.push("updated_at = GETDATE()");
    
    const request = pool.request();
    Object.keys(inputParams).forEach(key => {
      request.input(key, inputParams[key].type, inputParams[key].value);
    });
    
    await request.query(`
      UPDATE Transcriptions 
      SET ${updateFields.join(", ")}
      WHERE id = @id AND user_id = @userId
    `);
    
    res.json({ message: "Transcription updated successfully" });
  } catch (err) {
    console.error("Error updating transcription:", err);
    res.status(500).json({ error: "Failed to update transcription" });
  }
});

// Delete a transcription
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    
    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .input('userId', sql.UniqueIdentifier, req.user.id)
      .query('DELETE FROM Transcriptions WHERE id = @id AND user_id = @userId');
    
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: "Transcription not found" });
    }
    
    res.json({ message: "Transcription deleted successfully" });
  } catch (err) {
    console.error("Error deleting transcription:", err);
    res.status(500).json({ error: "Failed to delete transcription" });
  }
});

export default router;