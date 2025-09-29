import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sql from 'mssql';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import fileUpload from "express-fileupload";
import transcribeRoute from "./routes/transcribe.js";
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { auth } from 'express-oauth2-jwt-bearer';
import userRoutes from './routes/users.js';
import fs from 'fs';
import path from 'path';
import { 
  BlobServiceClient, 
  generateBlobSASQueryParameters, 
  BlobSASPermissions 
} from '@azure/storage-blob'
dotenv.config();
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const AZURE_CONTAINER_NAME = process.env.AZURE_STORAGE_CONTAINER_NAME || 'files';

let blobServiceClient;
let containerClient;
async function initializeAzureStorage() {
  try {
    if (!AZURE_STORAGE_CONNECTION_STRING) {
      console.warn('Azure Storage connection string not found. Using local storage only.');
      return false;
    }

    blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    containerClient = blobServiceClient.getContainerClient(AZURE_CONTAINER_NAME);
    const exists = await containerClient.exists();
    if (!exists) {
      await containerClient.create();
      console.log(`Azure Blob Storage container "${AZURE_CONTAINER_NAME}" created`);
    }
    
    console.log(' Azure Blob Storage initialized successfully');
    return true;
  } catch (error) {
    console.error('Azure Blob Storage initialization failed:', error.message);
    return false;
  }
}
initializeAzureStorage();
async function uploadToAzureBlob(fileBuffer, fileName, contentType, userId) {
  
  try {
    if (!containerClient) {
      throw new Error('Azure Blob Storage not initialized');
    }
    const safeFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const blobName = `users/${userId}/${Date.now()}_${safeFileName}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
   await blockBlobClient.uploadData(fileBuffer, {
  blobHTTPHeaders: { 
    blobContentType: contentType,
    blobContentDisposition: `inline; filename="${safeFileName}"`
  }
});
    
    console.log(`File uploaded to Azure Blob: ${blobName}`);

    return {
      url: blockBlobClient.url,
      blobName: blobName
    };
  } catch (error) {
    console.error('Azure upload error:', error);
    throw error;
  }
}
console.log("OPENAI_API_KEY loaded:", process.env.OPENAI_API_KEY ? " yes" : " no");
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 5 : 1000,
});
// Add this after your database connection setup
const checkJwt = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: process.env.AUTH0_ISSUER,
  tokenSigningAlg: 'RS256'
});

// Auth0 user sync middleware
// Improved Auth0 user sync middleware
const syncAuth0User = async (req, res, next) => {
  if (req.auth && req.auth.payload) {
    try {
      const auth0User = req.auth.payload;
      const pool = await getPool();
      
      console.log('Syncing Auth0 user:', auth0User.sub, auth0User.email);

      // Check if user exists by auth0_id
      const userResult = await pool.request()
        .input('auth0Id', sql.NVarChar, auth0User.sub)
        .query('SELECT * FROM Users WHERE auth0_id = @auth0Id');
      
      if (userResult.recordset.length === 0) {
        // Create new user from Auth0
        const insertResult = await pool.request()
          .input('auth0Id', sql.NVarChar, auth0User.sub)
          .input('email', sql.NVarChar, auth0User.email)
          .input('name', sql.NVarChar, auth0User.name || auth0User.email.split('@')[0])
          .input('emailVerified', sql.Bit, auth0User.email_verified ? 1 : 0)
          .query(`
            INSERT INTO Users (auth0_id, email, name, email_verified, createdAt)
            OUTPUT inserted.id, inserted.email, inserted.name, inserted.auth0_id
            VALUES (@auth0Id, @email, @name, @emailVerified, GETDATE())
          `);
        
        console.log('New user created from Auth0:', insertResult.recordset[0]);
      } else {
        console.log('Auth0 user already exists:', userResult.recordset[0]);
      }
    } catch (error) {
      console.error('Auth0 user sync error:', error);
    }
  }
  next();
};
// Update your Users table creation to include auth0_id

// Auth0 user creation/update middleware
const handleAuth0User = async (req, res, next) => {
  if (req.auth && req.auth.payload) {
    try {
      const auth0User = req.auth.payload;
      const pool = await getPool();
      
      // Check if user exists
      const userCheck = await pool.request()
        .input('auth0Id', sql.NVarChar, auth0User.sub)
        .query('SELECT * FROM Users WHERE auth0_id = @auth0Id');
      
      if (userCheck.recordset.length === 0) {
        // Create new user from Auth0
        await pool.request()
          .input('auth0Id', sql.NVarChar, auth0User.sub)
          .input('email', sql.NVarChar, auth0User.email)
          .input('name', sql.NVarChar, auth0User.name || auth0User.email.split('@')[0])
          .input('emailVerified', sql.Bit, auth0User.email_verified ? 1 : 0)
          .query(`
            INSERT INTO Users (auth0_id, email, name, email_verified, createdAt)
            VALUES (@auth0Id, @email, @name, @emailVerified, GETDATE())
          `);
        
        console.log('New user created from Auth0:', auth0User.email);
      }
      
      req.user = auth0User;
    } catch (error) {
      console.error('Auth0 user handling error:', error);
    }
  }
  next();
};

const authenticateJWTWithQuery = async (req, res, next) => {
  let token = req.headers.authorization?.split(' ')[1];
  if (!token && req.query.token) {
    token = req.query.token;
  }
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const dbConfig = {
  user: 'sa',
  password: 'Zarish2534#',
  server: 'localhost',
  database: 'PurrscribeAI',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let pool;
async function getPool() {
  if (pool) return pool;
  try {
    pool = await sql.connect(dbConfig);
    console.log('✅ Connected to SQL Server');
    return pool;
  } catch (err) {
    console.error('Database connection failed:', err);
    throw err;
  }
}
const authenticateJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    console.log('No authorization header');
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  
  // Handle case where token might be "null" string
  if (token === 'null' || !token) {
    console.log('Null token received');
    return res.status(401).json({ error: 'Invalid token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log('Decoded token:', decoded);
    
    const pool = await getPool();
    
    // Check if this is an Auth0 user (has auth0Id property)
    if (decoded.auth0Id) {
      const userResult = await pool.request()
        .input('auth0Id', sql.NVarChar, decoded.auth0Id)
        .query('SELECT id, email, name, auth0_id FROM Users WHERE auth0_id = @auth0Id');
      
      if (userResult.recordset.length === 0) {
        return res.status(403).json({ error: 'Auth0 user not found in database' });
      }
      
      req.user = userResult.recordset[0];
    } else {
      // Regular local user
      const userResult = await pool.request()
        .input('userId', sql.Int, decoded.id)
        .query('SELECT id, email, name FROM Users WHERE id = @userId');
      
      if (userResult.recordset.length === 0) {
        return res.status(403).json({ error: 'Invalid token' });
      }
      
      req.user = userResult.recordset[0];
    }
    
    next();
  } catch (err) {
    console.log('Token verification failed:', err.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
};
async function generateSasToken(blobName) {
  if (!containerClient) {
    throw new Error('Azure Storage not configured');
  }

  const blobClient = containerClient.getBlockBlobClient(blobName);

  const exists = await blobClient.exists();
  if (!exists) {
    throw new Error('Blob not found');
  }

  const permissions = BlobSASPermissions.parse("r");

  const expiresOn = new Date();
  expiresOn.setHours(expiresOn.getHours() + 1);

  try {
    const sasToken = generateBlobSASQueryParameters(
      {
        containerName: containerClient.containerName,
        blobName: blobName,
        permissions: permissions,
        expiresOn: expiresOn
      },
      blobClient.credential
    ).toString();

    return sasToken;
  } catch (error) {
    console.error('Error generating SAS token:', error);
    throw new Error('Failed to generate SAS token');
  }
}

const createDatabaseTables = async () => {
  try {
    const pool = await getPool();
await pool.request().query(`
  IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
  CREATE TABLE Users (
    id INT PRIMARY KEY IDENTITY(1,1),
    auth0_id NVARCHAR(255) UNIQUE,
    email NVARCHAR(255) NOT NULL UNIQUE,
     password NVARCHAR(255) NULL,
    name NVARCHAR(255),
    email_verified BIT DEFAULT 0,
    professional_title NVARCHAR(255),
    phone_number NVARCHAR(20),
    phone_verified BIT DEFAULT 0,
    avatar_seed NVARCHAR(50) DEFAULT 'vet',
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE()
  )
        CONSTRAINT UQ_Users_Email UNIQUE (email),
    CONSTRAINT UQ_Users_Auth0Id UNIQUE (auth0_id)
)

-- Drop the existing problematic constraint if it exists
IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'UQ__Users__AB6E61645403100E')
    ALTER TABLE Users DROP CONSTRAINT UQ__Users__AB6E61645403100E
`);


    console.log('✅ Users table created/verified');

await pool.request().query(`
  IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Files' AND xtype='U')
  CREATE TABLE Files (
    id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT NOT NULL,
    name NVARCHAR(255) NOT NULL,
    type NVARCHAR(100) NOT NULL,
    size INT NOT NULL,
    url NVARCHAR(500) NOT NULL,
    upload_date DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
  )
`);
console.log('Files table created/verified');
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='TranscriptionCategories' AND xtype='U')
      CREATE TABLE TranscriptionCategories (
        id INT PRIMARY KEY IDENTITY(1,1),
        name NVARCHAR(100) NOT NULL UNIQUE,
        description NVARCHAR(500)
      )
    `);
    console.log('TranscriptionCategories table created/verified');
    await pool.request().query(`
      MERGE INTO TranscriptionCategories AS target
      USING (VALUES 
        ('SOAP', 'Subjective, Objective, Assessment, Plan format'),
        ('Medical Notes', 'Standard medical documentation'),
        ('Raw Text', 'Unformatted transcription text')
       
      ) AS source (name, description)
      ON target.name = source.name
      WHEN NOT MATCHED THEN
        INSERT (name, description) VALUES (source.name, source.description);
    `);
    console.log(' Default categories inserted');
await pool.request().query(`
  IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Pets' AND xtype='U')
  CREATE TABLE Pets (
    id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT NOT NULL,
    name NVARCHAR(255) NOT NULL,
    species NVARCHAR(100) NOT NULL,
    breed NVARCHAR(100),
    age NVARCHAR(50),
    owner NVARCHAR(255) NOT NULL,
    image_url NVARCHAR(500),
    image_data NVARCHAR(MAX),  -- Add this column for base64 data
    image_type NVARCHAR(100),  -- Add this column for image MIME type
    notes NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
  )
`);
console.log('Pets table created/verified');
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Clinics' AND xtype='U')
      CREATE TABLE Clinics (
        id INT PRIMARY KEY IDENTITY(1,1),
        user_id INT NOT NULL,
        name NVARCHAR(255) NOT NULL,
        address NVARCHAR(500),
        city NVARCHAR(100),
        state NVARCHAR(100),
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
      )
    `);
    console.log('Clinics table created/verified');
await pool.request().query(`
  IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='VisitTypeTemplates' AND xtype='U')
  CREATE TABLE VisitTypeTemplates (
    id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT NOT NULL,
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(500),
    template NVARCHAR(MAX) NOT NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
  )
`);

console.log('✅ VisitTypeTemplates table created/verified');
await pool.request().query(`
  IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='audioFiles' AND xtype='U')
  CREATE TABLE audioFiles (
    id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT NOT NULL,
    name NVARCHAR(255) NOT NULL,
    type NVARCHAR(100) NOT NULL,
    size INT NOT NULL,
    url NVARCHAR(500) NOT NULL,
    blob_name NVARCHAR(500) NULL,
    duration INT NULL,
    upload_date DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
  )
`);
console.log('audioFiles table created/verified');
console.log('audioFiles table created/verified');
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='subscription_plans' AND xtype='U')
      CREATE TABLE subscription_plans (
        id VARCHAR(20) PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        description TEXT,
        monthly_price DECIMAL(10, 2) NOT NULL,
        yearly_price DECIMAL(10, 2) NOT NULL,
        features NVARCHAR(MAX) NOT NULL,
        is_popular BIT DEFAULT 0,
        is_active BIT DEFAULT 1,
        display_order INT DEFAULT 0,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE()
      )
    `);
    console.log('subscription_plans table created/verified');
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='user_subscriptions' AND xtype='U')
      CREATE TABLE user_subscriptions (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        plan_id VARCHAR(20) NOT NULL,
        billing_cycle VARCHAR(10) CHECK (billing_cycle IN ('monthly', 'yearly')) NOT NULL,
        status VARCHAR(10) CHECK (status IN ('active', 'cancelled', 'pending', 'expired')) DEFAULT 'pending',
        current_period_start DATE NOT NULL,
        current_period_end DATE NOT NULL,
        cancel_at_period_end BIT DEFAULT 0,
        stripe_subscription_id VARCHAR(255),
        stripe_customer_id VARCHAR(255),
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
        FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE CASCADE
      )
    `);
    console.log('user_subscriptions table created/verified');
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='payment_methods' AND xtype='U')
      CREATE TABLE payment_methods (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        type VARCHAR(10) CHECK (type IN ('card', 'bank', 'paypal')) NOT NULL,
        details NVARCHAR(MAX) NOT NULL,
        is_default BIT DEFAULT 0,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
      )
    `);
    console.log('payment_methods table created/verified');
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM subscription_plans WHERE id = 'basic')
      INSERT INTO subscription_plans (id, name, description, monthly_price, yearly_price, features, is_popular, display_order) VALUES
      ('basic', 'Basic', 'For individual veterinarians', 9.00, 90.00, '["5 transcriptions per month", "Basic templates", "Email support", "1GB storage"]', 0, 1),
      ('premium', 'Premium', 'For small clinics', 29.00, 290.00, '["Unlimited transcriptions", "All templates", "Priority support", "10GB storage", "Multiple pets"]', 1, 2),
      ('enterprise', 'Enterprise', 'For large veterinary hospitals', 79.00, 790.00, '["Unlimited transcriptions", "Custom templates", "24/7 dedicated support", "Unlimited storage", "Team collaboration", "Advanced analytics"]', 0, 3);
    `);
    console.log('Default subscription plans inserted');
 await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Transcriptions' AND xtype='U')
      CREATE TABLE Transcriptions (
        id INT PRIMARY KEY IDENTITY(1,1),
        user_id INT NOT NULL,
        title NVARCHAR(500) NOT NULL,
        content NVARCHAR(MAX) NOT NULL,
        category_name NVARCHAR(100) NOT NULL,
        pet_name NVARCHAR(255),
        clinic_name NVARCHAR(255),
        visit_type NVARCHAR(100),
        template_name NVARCHAR(100),
        recording_duration INT,
       
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
      )
    `);
    console.log('Transcriptions table created/verified');

  } catch (error) {
    console.error('Failed to create database tables:', error.message);
  }
};
const connectWithRetry = async () => {
  try {
    await getPool();
    console.log('✅ Connected to MS SQL database');
    await createDatabaseTables();
  } catch (err) {
    console.error('❌ Database connection error:', err.message);
    console.log('Retrying connection in 5 seconds...');
    setTimeout(connectWithRetry, 5000);
  }
};
connectWithRetry();
app.use(cors());
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload());
app.use('/api/users', userRoutes);
app.use("/api/transcribe", limiter, transcribeRoute);
app.post('/api/auth/register', async (req, res) => {
  try {
    console.log('Registration attempt:', req.body);
    
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const pool = await getPool();
    const userCheck = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT * FROM Users WHERE email = @email');
    
    if (userCheck.recordset.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
const result = await pool.request()
  .input('email', sql.NVarChar, email)
  .input('password', sql.NVarChar, hashedPassword)
  .input('name', sql.NVarChar, name)
  .query(`
    INSERT INTO Users (email, password, name,createdAt)
    OUTPUT inserted.id, inserted.email, inserted.name, inserted.createdAt
    VALUES (@email, @password, @name, GETDATE())
  `);

const user = result.recordset[0];
user.createdAt = new Date();
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    res.status(201).json({ 
      token,
      user
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Registration failed',
      details: error.message
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const pool = await getPool();
    const result = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT * FROM Users WHERE email = @email');
    
    if (result.recordset.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.recordset[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    res.json({ 
      token,
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name, 
        createdAt: user.createdAt 
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post('/api/auth/me', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const pool = await getPool();
    
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT 
          id,
          email,
          name,
          auth0_id,
          professional_title,
          phone_number,
          phone_verified,
          avatar_seed,
          createdAt,
          updatedAt
        FROM Users 
        WHERE id = @userId
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.recordset[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post('/api/transcriptions', authenticateJWT, async (req, res) => {
  try {
    const {
      title,
      content,
      category,
      petName,
      clinicName,
      visitType,
      templateName,
      recordingDuration,
      audioUrl,
      isCallRecording 
    } = req.body;
    
    if (!title || !content || !category) {
      return res.status(400).json({ error: "Title, content, and category are required" });
    }

    const userId = req.user.id;
    const pool = await getPool();
    
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .input('title', sql.NVarChar, title)
      .input('content', sql.NVarChar, content)
      .input('categoryName', sql.NVarChar, category)
      .input('petName', sql.NVarChar, petName || null)
      .input('clinicName', sql.NVarChar, clinicName || null)
      .input('visitType', sql.NVarChar, visitType || null)
      .input('templateName', sql.NVarChar, templateName || null)
      .input('recordingDuration', sql.Int, recordingDuration || 0)
     
      .query(`
        INSERT INTO Transcriptions (
          user_id, title, content, category_name, pet_name, clinic_name, 
          visit_type, template_name, recording_duration
        ) 
        OUTPUT inserted.*
        VALUES (
          @userId, @title, @content, @categoryName, @petName, @clinicName, 
          @visitType, @templateName, @recordingDuration
        )
      `);
    
    res.status(201).json({
      message: "Transcription saved successfully",
      transcription: result.recordset[0]
    });
    
  } catch (err) {
    console.error("Error saving transcription:", err);
    res.status(500).json({ 
      error: "Failed to save transcription",
      details: err.message 
    });
  }
});

app.post('/api/upload-audio', authenticateJWT, async (req, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ error: 'No audio file uploaded' });
    }

    const audioFile = req.files.audio;
    const userId = req.user.id;
    const fileExtension = path.extname(audioFile.name);
    const fileName = `audio_${userId}_${Date.now()}${fileExtension}`;
    const uploadDir = path.join(__dirname, 'uploads', 'audio');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const filePath = path.join(uploadDir, fileName);
    await audioFile.mv(filePath);
    const audioUrl = `/uploads/audio/${fileName}`;
    
    res.json({ 
      success: true, 
      audioUrl: audioUrl,
      message: 'Audio file uploaded successfully'
    });
    
  } catch (error) {
    console.error('Audio upload error:', error);
    res.status(500).json({ error: 'Failed to upload audio file' });
  }
});
app.use('/uploads/audio', express.static(path.join(__dirname, 'uploads', 'audio')));
app.get('/api/transcriptions', authenticateJWT, async (req, res) => {
  try {
    const { category, page = 1, limit = 10 } = req.query;
    const userId = req.user.id;
    
    const pool = await getPool();
    let whereClause = "WHERE t.user_id = @userId";
    
    const request = pool.request()
      .input('userId', sql.Int, userId);
    
    if (category) {
      whereClause += " AND t.category_name = @category";
      request.input('category', sql.NVarChar, category);
    }
    
    const offset = (page - 1) * limit;
    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, limit);
    
    const result = await request.query(`
      SELECT 
        t.id,
        t.title,
        t.content,
        t.category_name as category,
        t.pet_name,
        t.clinic_name,
        t.visit_type,
        t.template_name,
        t.recording_duration,
    
        t.created_at
      FROM Transcriptions t
      ${whereClause}
      ORDER BY t.created_at DESC
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `);
    
    const countResult = await pool.request()
      .input('userId', sql.Int, userId)
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
app.get('/api/transcriptions/:id', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const pool = await getPool();
    
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('userId', sql.Int, userId)
      .query(`
        SELECT 
          t.id,
          t.title,
          t.content,
          t.category_name as category,
          t.pet_name,
          t.clinic_name,
          t.visit_type,
          t.template_name,
          t.recording_duration,
         
          t.created_at
        FROM Transcriptions t
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
app.put('/api/transcriptions/:id', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      content,
      category,
      pet_name,
      clinic_name,
      visit_type
    } = req.body;
    
    const userId = req.user.id;
    const pool = await getPool();
    const existingResult = await pool.request()
      .input('id', sql.Int, id)
      .input('userId', sql.Int, userId)
      .query('SELECT id FROM Transcriptions WHERE id = @id AND user_id = @userId');
    
    if (existingResult.recordset.length === 0) {
      return res.status(404).json({ error: "Transcription not found" });
    }
    let updateFields = [];
    const request = pool.request()
      .input('id', sql.Int, id)
      .input('userId', sql.Int, userId);
    
    if (title !== undefined) {
      updateFields.push("title = @title");
      request.input('title', sql.NVarChar, title);
    }
    
    if (content !== undefined) {
      updateFields.push("content = @content");
      request.input('content', sql.NVarChar, content);
    }
    
    if (category !== undefined) {
      updateFields.push("category_name = @category");
      request.input('category', sql.NVarChar, category);
    }
    
    if (pet_name !== undefined) {
      updateFields.push("pet_name = @pet_name");
      request.input('pet_name', sql.NVarChar, pet_name || null);
    }
    
    if (clinic_name !== undefined) {
      updateFields.push("clinic_name = @clinic_name");
      request.input('clinic_name', sql.NVarChar, clinic_name || null);
    }
    
    if (visit_type !== undefined) {
      updateFields.push("visit_type = @visit_type");
      request.input('visit_type', sql.NVarChar, visit_type || null);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }
    
    updateFields.push("updated_at = GETDATE()");
    
    const result = await request.query(`
      UPDATE Transcriptions 
      SET ${updateFields.join(", ")}
      WHERE id = @id AND user_id = @userId
    `);
    const updatedResult = await pool.request()
      .input('id', sql.Int, id)
      .input('userId', sql.Int, userId)
      .query(`
        SELECT * FROM Transcriptions 
        WHERE id = @id AND user_id = @userId
      `);
    
    res.json({ 
      message: "Transcription updated successfully",
      transcription: updatedResult.recordset[0]
    });
  } catch (err) {
    console.error("Error updating transcription:", err);
    res.status(500).json({ error: "Failed to update transcription" });
  }
});

app.delete('/api/transcriptions/:id', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const pool = await getPool();
    
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('userId', sql.Int, userId)
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
app.get('/api/health', async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request().query('SELECT 1');
    
    const azureStatus = containerClient ? 'Connected' : 'Not Configured';
    
    res.json({ 
      status: 'OK', 
      database: 'Connected',
      azureStorage: azureStatus
    });
  } catch (err) {
    res.status(500).json({ 
      status: 'Error', 
      database: 'Disconnected', 
      error: err.message 
    });
  }
});
const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${port}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});
app.post('/api/pets', authenticateJWT, async (req, res) => {
  try {
    const { name, species, breed, age, owner, phoneNumber, imageData, imageType, notes } = req.body;
    const userId = req.user.id;

    const pool = await getPool();
    
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .input('name', sql.NVarChar, name)
      .input('species', sql.NVarChar, species)
      .input('breed', sql.NVarChar, breed || null)
      .input('age', sql.NVarChar, age || null)
      .input('owner', sql.NVarChar, owner)
      .input('phoneNumber', sql.NVarChar, phoneNumber || null) // Add this
      .input('imageData', sql.NVarChar, imageData || null)
      .input('imageType', sql.NVarChar, imageType || null)
      .input('notes', sql.NVarChar, notes || null)
      .query(`
        INSERT INTO Pets (user_id, name, species, breed, age, owner, phone_number, image_data, image_type, notes)
        OUTPUT inserted.id, inserted.name, inserted.species, inserted.breed, inserted.age, 
               inserted.owner, inserted.phone_number as phoneNumber, inserted.image_url as imageUrl, inserted.notes, inserted.created_at
        VALUES (@userId, @name, @species, @breed, @age, @owner, @phoneNumber, @imageData, @imageType, @notes)
      `);
    
    const pet = result.recordset[0];
    
    res.status(201).json({
      message: "Pet added successfully",
      pet: pet
    });
    
  } catch (err) {
    console.error("Error adding pet:", err);
    res.status(500).json({ 
      error: "Failed to add pet",
      details: err.message 
    });
  }
});
// Fix the GET /api/pets endpoint
// Fix the GET /api/pets endpoint
app.get('/api/pets', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const pool = await getPool();
    
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT 
          id,
          name,
          species,
          breed,
          age,
          owner,
          phone_number as phoneNumber,
          image_url as imageUrl,
          image_data as imageData,
          image_type as imageType,
          notes,
          created_at
        FROM Pets 
        WHERE user_id = @userId
        ORDER BY created_at DESC
      `);
    
    res.json(result.recordset);
  } catch (err) {
    console.error("Error fetching pets:", err);
    res.status(500).json({ 
      error: "Failed to fetch pets",
      details: err.message 
    });
  }
});
app.put('/api/pets/:id', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      species, 
      breed, 
      age, 
      owner, 
      phoneNumber,  // Frontend sends this
      imageData, 
      imageType, 
      notes 
    } = req.body;
    
    const userId = req.user.id;

    const pool = await getPool();
    const checkResult = await pool.request()
      .input('id', sql.Int, id)
      .input('userId', sql.Int, userId)
      .query('SELECT id FROM Pets WHERE id = @id AND user_id = @userId');
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ error: "Pet not found" });
    }

    let updateFields = [];
    const request = pool.request()
      .input('id', sql.Int, id)
      .input('userId', sql.Int, userId);
    
    if (name !== undefined) {
      updateFields.push("name = @name");
      request.input('name', sql.NVarChar, name);
    }
    
    if (species !== undefined) {
      updateFields.push("species = @species");
      request.input('species', sql.NVarChar, species);
    }
    
    if (breed !== undefined) {
      updateFields.push("breed = @breed");
      request.input('breed', sql.NVarChar, breed || null);
    }
    
    if (age !== undefined) {
      updateFields.push("age = @age");
      request.input('age', sql.NVarChar, age || null);
    }
    
    if (owner !== undefined) {
      updateFields.push("owner = @owner");
      request.input('owner', sql.NVarChar, owner);
    }
    
    // Handle phone number - fix the parameter name
    if (phoneNumber !== undefined) {
      updateFields.push("phone_number = @phoneNumber");
      request.input('phoneNumber', sql.NVarChar, phoneNumber || null);
    }
    
    if (imageData !== undefined) {
      updateFields.push("image_data = @imageData");
      request.input('imageData', sql.NVarChar, imageData || null);
    }
    
    if (imageType !== undefined) {
      updateFields.push("image_type = @imageType");
      request.input('imageType', sql.NVarChar, imageType || null);
    }
    
    if (notes !== undefined) {
      updateFields.push("notes = @notes");
      request.input('notes', sql.NVarChar, notes || null);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }
    
    updateFields.push("updated_at = GETDATE()");
    
    await request.query(`
      UPDATE Pets 
      SET ${updateFields.join(", ")}
      WHERE id = @id AND user_id = @userId
    `);

    // Return the updated pet with phoneNumber field
    const updatedResult = await pool.request()
      .input('id', sql.Int, id)
      .input('userId', sql.Int, userId)
      .query(`
        SELECT 
          id,
          name,
          species,
          breed,
          age,
          owner,
          phone_number as phoneNumber,
          image_url as imageUrl,
          notes,
          created_at
        FROM Pets 
        WHERE id = @id AND user_id = @userId
      `);
    
    if (updatedResult.recordset.length === 0) {
      return res.status(404).json({ error: "Pet not found after update" });
    }
    
    const updatedPet = updatedResult.recordset[0];
    
    res.json({
      message: "Pet updated successfully",
      pet: updatedPet
    });
    
  } catch (err) {
    console.error("Error updating pet:", err);
    res.status(500).json({ 
      error: "Failed to update pet",
      details: err.message 
    });
  }
});
app.delete('/api/pets/:id', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const pool = await getPool();
    const checkResult = await pool.request()
      .input('id', sql.Int, id)
      .input('userId', sql.Int, userId)
      .query('SELECT id FROM Pets WHERE id = @id AND user_id = @userId');
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ error: "Pet not found" });
    }
    
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('userId', sql.Int, userId)
      .query('DELETE FROM Pets WHERE id = @id AND user_id = @userId');
    
    res.json({ message: "Pet deleted successfully" });
  } catch (err) {
    console.error("Error deleting pet:", err);
    res.status(500).json({ error: "Failed to delete pet" });
  }
});

app.get('/api/templates', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const pool = await getPool();
    
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT 
          id,
          name,
          description,
          template,
          created_at,
          updated_at
        FROM VisitTypeTemplates 
        WHERE user_id = @userId
        ORDER BY created_at DESC
      `);
    
    res.json(result.recordset);
  } catch (err) {
    console.error("Error fetching templates:", err);
    res.status(500).json({ error: "Failed to fetch templates" });
  }
});
app.get('/api/templates', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const pool = await getPool();
    
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT 
          id,
          name,
          description,
          template,
          created_at,
          updated_at
        FROM VisitTypeTemplates 
        WHERE user_id = @userId
        ORDER BY created_at DESC
      `);
    
    res.json(result.recordset);
  } catch (err) {
    console.error("Error fetching templates:", err);
    res.status(500).json({ error: "Failed to fetch templates" });
  }
});

app.post('/api/templates', authenticateJWT, async (req, res) => {
  try {
    const { name, description, template } = req.body;
    const userId = req.user.id;

    if (!name || !template) {
      return res.status(400).json({ error: "Name and template content are required" });
    }

    const pool = await getPool();
    
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .input('name', sql.NVarChar, name)
      .input('description', sql.NVarChar, description || null)
      .input('template', sql.NVarChar, template)
      .query(`
        INSERT INTO VisitTypeTemplates (user_id, name, description, template)
        OUTPUT inserted.*
        VALUES (@userId, @name, @description, @template)
      `);
    
    res.status(201).json({
      message: "Template created successfully",
      template: result.recordset[0]
    });
    
  } catch (err) {
    console.error("Error creating template:", err);
    res.status(500).json({ 
      error: "Failed to create template",
      details: err.message 
    });
  }
});

app.put('/api/templates/:id', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, template } = req.body;
    const userId = req.user.id;

    const pool = await getPool();
    const checkResult = await pool.request()
      .input('id', sql.Int, id)
      .input('userId', sql.Int, userId)
      .query('SELECT id FROM VisitTypeTemplates WHERE id = @id AND user_id = @userId');
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ error: "Template not found" });
    }
    await pool.request()
      .input('id', sql.Int, id)
      .input('userId', sql.Int, userId)
      .input('name', sql.NVarChar, name)
      .input('description', sql.NVarChar, description || null)
      .input('template', sql.NVarChar, template)
      .query(`
        UPDATE VisitTypeTemplates 
        SET name = @name, description = @description, template = @template, updated_at = GETDATE()
        WHERE id = @id AND user_id = @userId
      `);
    const updatedResult = await pool.request()
      .input('id', sql.Int, id)
      .input('userId', sql.Int, userId)
      .query(`
        SELECT * FROM VisitTypeTemplates 
        WHERE id = @id AND user_id = @userId
      `);
    
    res.json({
      message: "Template updated successfully",
      template: updatedResult.recordset[0]
    });
    
  } catch (err) {
    console.error("Error updating template:", err);
    res.status(500).json({ 
      error: "Failed to update template",
      details: err.message 
    });
  }
});

app.delete('/api/templates/:id', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const pool = await getPool();
    const checkResult = await pool.request()
      .input('id', sql.Int, id)
      .input('userId', sql.Int, userId)
      .query('SELECT id FROM VisitTypeTemplates WHERE id = @id AND user_id = @userId');
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ error: "Template not found" });
    }
    
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('userId', sql.Int, userId)
      .query('DELETE FROM VisitTypeTemplates WHERE id = @id AND user_id = @userId');
    
    res.json({ message: "Template deleted successfully" });
  } catch (err) {
    console.error("Error deleting template:", err);
    res.status(500).json({ error: "Failed to delete template" });
  }
});

app.get('/api/clinics', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const pool = await getPool();
    
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT 
          id,
          name,
          address,
          city,
          state,
          zip_code as zipCode,
          phone,
          email,
          manager,
          logo_url as logoUrl,
          type,
          notes,
          pet_count as petCount,
          created_at,
          updated_at
        FROM Clinics 
        WHERE user_id = @userId
        ORDER BY created_at DESC
      `);
    
    res.json(result.recordset);
  } catch (err) {
    console.error("Error fetching clinics:", err);
    res.status(500).json({ error: "Failed to fetch clinics" });
  }
});
app.post('/api/clinics', authenticateJWT, async (req, res) => {
  try {
    const {
      name,
      address,
      city,
      state,
      zipCode,
      phone,
      email,
      manager,
      logoUrl,
      type,
      notes
    } = req.body;
    
    const userId = req.user.id;

    if (!name || !address || !city || !manager) {
      return res.status(400).json({ error: "Name, address, city and manager are required" });
    }

    const pool = await getPool();
    
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .input('name', sql.NVarChar, name)
      .input('address', sql.NVarChar, address)
      .input('city', sql.NVarChar, city)
      .input('state', sql.NVarChar, state || null)
      .input('zipCode', sql.NVarChar, zipCode || null)
      .input('phone', sql.NVarChar, phone || null)
      .input('email', sql.NVarChar, email || null)
      .input('manager', sql.NVarChar, manager)
      .input('logoUrl', sql.NVarChar, logoUrl || null)
      .input('type', sql.NVarChar, type || null)
      .input('notes', sql.NVarChar, notes || null)
      .query(`
        INSERT INTO Clinics (
          user_id, name, address, city, state, zip_code, phone, email, 
          manager, logo_url, type, notes, pet_count
        )
        OUTPUT inserted.id, inserted.name, inserted.address, inserted.city, 
               inserted.state, inserted.zip_code as zipCode, inserted.phone, 
               inserted.email, inserted.manager, inserted.logo_url as logoUrl, 
               inserted.type, inserted.notes, inserted.pet_count as petCount,
               inserted.created_at, inserted.updated_at
        VALUES (
          @userId, @name, @address, @city, @state, @zipCode, @phone, @email,
          @manager, @logoUrl, @type, @notes, 0
        )
      `);
    
    const clinic = result.recordset[0];
    res.status(201).json(clinic);
    
  } catch (err) {
    console.error("Error creating clinic:", err);
    res.status(500).json({ 
      error: "Failed to create clinic",
      details: err.message 
    });
  }
});
app.put('/api/clinics/:id', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      address,
      city,
      state,
      zipCode,
      phone,
      email,
      manager,
      logoUrl,
      type,
      notes
    } = req.body;
    
    const userId = req.user.id;

    const pool = await getPool();
    const checkResult = await pool.request()
      .input('id', sql.Int, id)
      .input('userId', sql.Int, userId)
      .query('SELECT id FROM Clinics WHERE id = @id AND user_id = @userId');
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ error: "Clinic not found" });
    }

    await pool.request()
      .input('id', sql.Int, id)
      .input('userId', sql.Int, userId)
      .input('name', sql.NVarChar, name)
      .input('address', sql.NVarChar, address)
      .input('city', sql.NVarChar, city)
      .input('state', sql.NVarChar, state || null)
      .input('zipCode', sql.NVarChar, zipCode || null)
      .input('phone', sql.NVarChar, phone || null)
      .input('email', sql.NVarChar, email || null)
      .input('manager', sql.NVarChar, manager)
      .input('logoUrl', sql.NVarChar, logoUrl || null)
      .input('type', sql.NVarChar, type || null)
      .input('notes', sql.NVarChar, notes || null)
      .query(`
        UPDATE Clinics 
        SET name = @name, address = @address, city = @city, state = @state,
            zip_code = @zipCode, phone = @phone, email = @email, manager = @manager,
            logo_url = @logoUrl, type = @type, notes = @notes, updated_at = GETDATE()
        WHERE id = @id AND user_id = @userId
      `);
    const updatedResult = await pool.request()
      .input('id', sql.Int, id)
      .input('userId', sql.Int, userId)
      .query(`
        SELECT 
          id,
          name,
          address,
          city,
          state,
          zip_code as zipCode,
          phone,
          email,
          manager,
          logo_url as logoUrl,
          type,
          notes,
          pet_count as petCount,
          created_at,
          updated_at
        FROM Clinics 
        WHERE id = @id AND user_id = @userId
      `);
    
    res.json(updatedResult.recordset[0]);
    
  } catch (err) {
    console.error("Error updating clinic:", err);
    res.status(500).json({ 
      error: "Failed to update clinic",
      details: err.message 
    });
  }
});
app.delete('/api/clinics/:id', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const pool = await getPool();
    const checkResult = await pool.request()
      .input('id', sql.Int, id)
      .input('userId', sql.Int, userId)
      .query('SELECT id FROM Clinics WHERE id = @id AND user_id = @userId');
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ error: "Clinic not found" });
    }
    
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('userId', sql.Int, userId)
      .query('DELETE FROM Clinics WHERE id = @id AND user_id = @userId');
    
    res.json({ message: "Clinic deleted successfully" });
  } catch (err) {
    console.error("Error deleting clinic:", err);
    res.status(500).json({ error: "Failed to delete clinic" });
  }
});
app.get('/api/files', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const pool = await getPool();
    
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT 
          id,
          name,
          type,
          size,
          url,
          upload_date as uploadDate
        FROM Files 
        WHERE user_id = @userId
        ORDER BY upload_date DESC
      `);
    
    res.json(result.recordset);
  } catch (err) {
    console.error("Error fetching files:", err);
    res.status(500).json({ error: "Failed to fetch files" });
  }
});
app.post('/api/upload', authenticateJWT, async (req, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ error: 'No files were uploaded.' });
    }

    const userId = req.user.id;
    const uploadedFile = req.files.file;
    
    let fileUrl;
    let storageType = 'local';
    const azureAvailable = containerClient && AZURE_STORAGE_CONNECTION_STRING;

    if (azureAvailable) {
      try {
        const azureResult = await uploadToAzureBlob(
          uploadedFile.data,
          uploadedFile.name,
          uploadedFile.mimetype,
          userId
        );
        fileUrl = azureResult.url;
        storageType = 'azure';
      } catch (azureError) {
        console.warn('Azure upload failed, falling back to local storage:', azureError.message);
        azureAvailable = false;
      }
    }

    if (!azureAvailable) {
      const fileName = `${Date.now()}_${uploadedFile.name}`;
      const uploadDir = path.join(__dirname, 'uploads');
      
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      const filePath = path.join(uploadDir, fileName);
      await uploadedFile.mv(filePath);
      fileUrl = `/uploads/${fileName}`;
    }
    const pool = await getPool();
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .input('name', sql.NVarChar, uploadedFile.name)
      .input('type', sql.NVarChar, uploadedFile.mimetype)
      .input('size', sql.Int, uploadedFile.size)
      .input('url', sql.NVarChar, fileUrl)
      .query(`
        INSERT INTO Files (user_id, name, type, size, url)
        OUTPUT inserted.id, inserted.name, inserted.type, inserted.size, inserted.url, inserted.upload_date
        VALUES (@userId, @name, @type, @size, @url)
      `);
    
    const fileRecord = result.recordset[0];
    fileRecord.storageType = storageType;

    res.status(201).json({
      message: `File uploaded successfully to ${storageType}`,
      file: fileRecord
    });
    
  } catch (err) {
    console.error("Error uploading file:", err);
    res.status(500).json({ 
      error: "Failed to upload file",
      details: err.message 
    });
  }
});
app.get('/api/files/download/:id', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const pool = await getPool();
    
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('userId', sql.Int, userId)
      .query('SELECT * FROM Files WHERE id = @id AND user_id = @userId');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "File not found" });
    }
    
    const file = result.recordset[0];
    if (file.url.startsWith('https://') && file.url.includes('blob.core.windows.net')) {
      if (!containerClient) {
        return res.status(500).json({ error: "Azure storage not configured" });
      }
      const blobName = file.url.split('/').slice(3).join('/');
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
      res.setHeader('Content-Type', file.type);
      const downloadResponse = await blockBlobClient.download();
      downloadResponse.readableStreamBody.pipe(res);
      
    } else {
      const filePath = path.join(__dirname, file.url);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "File not found on server" });
      }
      
      res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
      res.setHeader('Content-Type', file.type);
      
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    }
  } catch (err) {
    console.error("Error downloading file:", err);
    res.status(500).json({ error: "Failed to download file" });
  }
});
app.delete('/api/files/:id', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const pool = await getPool();
    const fileResult = await pool.request()
      .input('id', sql.Int, id)
      .input('userId', sql.Int, userId)
      .query('SELECT * FROM Files WHERE id = @id AND user_id = @userId');
    
    if (fileResult.recordset.length === 0) {
      return res.status(404).json({ error: "File not found" });
    }
    
    const file = fileResult.recordset[0];
    if (file.url.startsWith('https://') && file.url.includes('blob.core.windows.net')) {

      if (containerClient) {
        const url = new URL(file.url);
        const pathParts = url.pathname.split('/');
        const blobName = pathParts.slice(2).join('/');
        
        console.log('🔍 Deleting blob:', blobName);
        
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        const exists = await blockBlobClient.exists();
        if (!exists) {
          console.warn('Blob not found in Azure, but deleting from database anyway');
        } else {
          await blockBlobClient.delete();
          console.log(`File deleted from Azure: ${blobName}`);
        }
      }
    } else {
      const filePath = path.join(__dirname, file.url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Local file deleted: ${filePath}`);
      }
    }
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('userId', sql.Int, userId)
      .query('DELETE FROM Files WHERE id = @id AND user_id = @userId');
    
    res.json({ message: "File deleted successfully" });
  } catch (err) {
    console.error("Error deleting file:", err);
    res.status(500).json({ 
      error: "Failed to delete file",
      details: err.message 
    });
  }
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.post('/api/upload', authenticateJWT, async (req, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ error: 'No files were uploaded.' });
    }

    const userId = req.user.id;
    const uploadedFile = req.files.file;
    const fileName = `${Date.now()}_${uploadedFile.name}`;
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const filePath = path.join(uploadDir, fileName);
    await uploadedFile.mv(filePath);
    const pool = await getPool();
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .input('name', sql.NVarChar, uploadedFile.name)
      .input('type', sql.NVarChar, uploadedFile.mimetype)
      .input('size', sql.Int, uploadedFile.size)
      .input('url', sql.NVarChar, `/uploads/${fileName}`)
      .query(`
        INSERT INTO Files (user_id, name, type, size, url)
        OUTPUT inserted.id, inserted.name, inserted.type, inserted.size, inserted.url, inserted.upload_date
        VALUES (@userId, @name, @type, @size, @url)
      `);
    
    res.status(201).json({
      message: "File uploaded successfully",
      file: result.recordset[0]
    });
    
  } catch (err) {
    console.error("Error uploading file:", err);
    res.status(500).json({ 
      error: "Failed to upload file",
      details: err.message 
    });
  }
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline'); 
    } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (filePath.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    } else if (filePath.endsWith('.txt')) {
      res.setHeader('Content-Type', 'text/plain');
    }
    res.setHeader('Cache-Control', 'public, max-age=3600');
  }
}));
app.get('/api/files/download/:id', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const pool = await getPool();
    
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('userId', sql.Int, userId)
      .query('SELECT * FROM Files WHERE id = @id AND user_id = @userId');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "File not found" });
    }
    
    const file = result.recordset[0];
    const filePath = path.join(__dirname, file.url);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found on server" });
    }
    res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', file.size);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (err) {
    console.error("Error downloading file:", err);
    res.status(500).json({ error: "Failed to download file" });
  }
});

app.get('/api/files/download/:id', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const pool = await getPool();
    
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('userId', sql.Int, userId)
      .query('SELECT * FROM Files WHERE id = @id AND user_id = @userId');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "File not found" });
    }
    
    const file = result.recordset[0];
    const filePath = path.join(__dirname, file.url);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found on server" });
    }
    
    res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
    res.setHeader('Content-Type', file.type);
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (err) {
    console.error("Error downloading file:", err);
    res.status(500).json({ error: "Failed to download file" });
  }
});
app.get('/api/files/content/:id', async (req, res) => {
  try {
    let token = req.headers.authorization?.split(' ')[1];
    
    if (!token && req.query.token) {
      token = req.query.token;
    }
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      req.user = decoded;
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { id } = req.params;
    const userId = req.user.id;
    const pool = await getPool();
    
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('userId', sql.Int, userId)
      .query('SELECT * FROM Files WHERE id = @id AND user_id = @userId');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "File not found" });
    }
    
    const file = result.recordset[0];
    const filePath = path.join(__dirname, file.url);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found on server" });
    }
    if (file.type.includes('text') || 
        file.name.match(/\.(txt|json|xml|html|css|js|md)$/i)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Cache-Control', 'private, max-age=3600');
      res.send(content);
    } else {
      res.status(400).json({ error: "File type not supported for text content" });
    }
  } catch (err) {
    console.error("Error fetching file content:", err);
    res.status(500).json({ error: "Failed to fetch file content" });
  }
});
app.get('/api/files/view/:id', async (req, res) => {
  try {
    let token = req.headers.authorization?.split(' ')[1];
    
    if (!token && req.query.token) {
      token = req.query.token;
    }
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      req.user = decoded;
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { id } = req.params;
    const userId = req.user.id;
    const pool = await getPool();
    
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('userId', sql.Int, userId)
      .query('SELECT * FROM Files WHERE id = @id AND user_id = @userId');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "File not found" });
    }
    
    const file = result.recordset[0];
    const filePath = path.join(__dirname, file.url);
     if (req.query.print) {
      res.setHeader('Content-Disposition', `inline; filename="${file.name}"`);
    } else {
      res.setHeader('Content-Disposition', `inline; filename="${file.name}"`);
    }
    
    res.setHeader('Cache-Control', 'private, max-age=3600');
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found on server" });
    }
    res.setHeader('Content-Type', file.type);
    res.setHeader('Content-Disposition', `inline; filename="${file.name}"`);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (err) {
    console.error("Error serving file:", err);
    res.status(500).json({ error: "Failed to serve file" });
  }
});
app.get('/api/files/print/:id', authenticateJWTWithQuery, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const pool = await getPool();
    
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('userId', sql.Int, userId)
      .query('SELECT * FROM Files WHERE id = @id AND user_id = @userId');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "File not found" });
    }
    
    const file = result.recordset[0];
    const filePath = path.join(__dirname, file.url);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found on server" });
    }
    
    res.setHeader('Content-Type', file.type);
    res.setHeader('Content-Disposition', `inline; filename="${file.name}"`);
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (err) {
    console.error("Error serving file for printing:", err);
    res.status(500).json({ error: "Failed to serve file for printing" });
  }
});
app.post('/api/audio-files/upload', authenticateJWT, async (req, res) => {
  try {
    console.log('Audio upload request received');
    
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ error: 'No audio file uploaded' });
    }

    const audioFile = req.files.audio;
    const userId = req.user.id;
    
    console.log('Uploading audio file:', {
      name: audioFile.name,
      size: audioFile.size,
      type: audioFile.mimetype,
      userId: userId
    });

    let fileUrl;
    let blobName = null;
    if (containerClient && AZURE_STORAGE_CONNECTION_STRING) {
      try {
        const azureResult = await uploadToAzureBlob(
          audioFile.data,
          audioFile.name,
          audioFile.mimetype,
          userId
        );
        fileUrl = azureResult.url;
        blobName = azureResult.blobName;
        console.log(`✅ Audio file uploaded to Azure: ${blobName}`);
      } catch (azureError) {
        console.error('Azure upload failed:', azureError.message);
        return res.status(500).json({ error: 'Failed to upload to cloud storage' });
      }
    } else {
      const fileName = `audio_${userId}_${Date.now()}_${audioFile.name}`;
      const uploadDir = path.join(__dirname, 'uploads', 'audio');
      
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      const filePath = path.join(uploadDir, fileName);
      await audioFile.mv(filePath);
      fileUrl = `/uploads/audio/${fileName}`;
    }
    const pool = await getPool();
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .input('name', sql.NVarChar, audioFile.name)
      .input('type', sql.NVarChar, audioFile.mimetype)
      .input('size', sql.Int, audioFile.size)
      .input('url', sql.NVarChar, fileUrl)
      .input('blobName', sql.NVarChar, blobName)
      .query(`
        INSERT INTO audioFiles (user_id, name, type, size, url, blob_name)
        OUTPUT inserted.id, inserted.name, inserted.type, inserted.size, 
               inserted.url, inserted.blob_name, inserted.upload_date
        VALUES (@userId, @name, @type, @size, @url, @blobName)
      `);
    
    console.log('✅ Audio file saved to database:', result.recordset[0]);
    
    res.status(201).json({ 
      success: true, 
      audioFile: result.recordset[0],
      message: 'Audio file uploaded successfully'
    });
    
  } catch (error) {
    console.error('Audio upload error:', error);
    res.status(500).json({ 
      error: 'Failed to upload audio file',
      details: error.message 
    });
  }
});

app.delete('/api/audio-files/:id', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const pool = await getPool();
    const fileResult = await pool.request()
      .input('id', sql.Int, id)
      .input('userId', sql.Int, userId)
      .query('SELECT * FROM audioFiles WHERE id = @id AND user_id = @userId');
    
    if (fileResult.recordset.length === 0) {
      return res.status(404).json({ error: "Audio file not found" });
    }
    
    const file = fileResult.recordset[0];
    if (file.blob_name && containerClient) {
      try {
        const blockBlobClient = containerClient.getBlockBlobClient(file.blob_name);
        const exists = await blockBlobClient.exists();
        
        if (exists) {
          await blockBlobClient.delete();
          console.log(`Audio file deleted from Azure: ${file.blob_name}`);
        } else {
          console.warn(` Blob not found in Azure: ${file.blob_name}`);
        }
      } catch (azureError) {
        console.error('Error deleting from Azure:', azureError.message);
      }
    }
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('userId', sql.Int, userId)
      .query('DELETE FROM audioFiles WHERE id = @id AND user_id = @userId');
    
    res.json({ 
      message: "Audio file deleted successfully",
      deletedFromAzure: !!file.blob_name
    });
  } catch (err) {
    console.error("Error deleting audio file:", err);
    res.status(500).json({ 
      error: "Failed to delete audio file",
      details: err.message 
    });
  }
});
app.get('/api/audio-files/debug/:id', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const pool = await getPool();
    
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('userId', sql.Int, userId)
      .query('SELECT * FROM audioFiles WHERE id = @id AND user_id = @userId');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "Audio file not found" });
    }
    
    const file = result.recordset[0];
    let storageInfo = {};
    if (file.blob_name && containerClient) {
      try {
        const blockBlobClient = containerClient.getBlockBlobClient(file.blob_name);
        const exists = await blockBlobClient.exists();
        storageInfo = {
          existsInAzure: exists,
          blobName: file.blob_name
        };
      } catch (azureError) {
        storageInfo = { azureError: azureError.message };
      }
    } else if (file.url.startsWith('/')) {
      const filePath = path.join(__dirname, file.url);
      storageInfo = {
        existsLocally: fs.existsSync(filePath),
        filePath: filePath
      };
    }
    
    res.json({
      fileInfo: file,
      storageInfo: storageInfo,
      supportedFormats: ['mp3', 'wav', 'ogg', 'm4a', 'aac']
    });
  } catch (err) {
    console.error("Debug error:", err);
    res.status(500).json({ error: "Debug failed" });
  }
});
app.put('/api/audio-files/:id/duration', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const { duration } = req.body;
    const userId = req.user.id;
    const pool = await getPool();
    
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('userId', sql.Int, userId)
      .input('duration', sql.Int, duration)
      .query(`
        UPDATE audioFiles 
        SET duration = @duration 
        WHERE id = @id AND user_id = @userId
      `);
    
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: "Audio file not found" });
    }
    
    res.json({ message: "Duration updated successfully" });
  } catch (err) {
    console.error("Error updating duration:", err);
    res.status(500).json({ error: "Failed to update duration" });
  }
});
app.use('/uploads/audio', express.static(path.join(__dirname, 'uploads', 'audio')));
app.get('/api/audio-files', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const pool = await getPool();
    
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT 
          id,
          name,
          type,
          size,
          url,
          blob_name as blobName,
          duration,
          upload_date as uploadDate
        FROM audioFiles 
        WHERE user_id = @userId
        ORDER BY upload_date DESC
      `);
    const filesWithStreamUrl = result.recordset.map(file => ({
      ...file,
      streamUrl: `http://localhost:5000/api/audio-files/stream/${file.id}`
    }));
    
    res.json(filesWithStreamUrl);
  } catch (err) {
    console.error("Error fetching audio files:", err);
    res.status(500).json({ error: "Failed to fetch audio files" });
  }
});

app.get('/api/audio-files/stream/:id', authenticateJWTWithQuery, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const pool = await getPool();
    
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('userId', sql.Int, userId)
      .query('SELECT * FROM audioFiles WHERE id = @id AND user_id = @userId');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "Audio file not found" });
    }
    
    const file = result.recordset[0];
    const contentType = getAudioContentType(file.name, file.type);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    
    if (file.blob_name && containerClient) {
      try {
        const blockBlobClient = containerClient.getBlockBlobClient(file.blob_name);
        const downloadResponse = await blockBlobClient.download();

        downloadResponse.readableStreamBody.pipe(res);
      } catch (azureError) {
        console.error('Azure stream error:', azureError);
        res.status(500).json({ error: 'Failed to stream from Azure' });
      }
    } else {
      const filePath = path.join(__dirname, file.url);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "File not found on server" });
      }
      
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    }
  } catch (err) {
    console.error("Error streaming audio:", err);
    res.status(500).json({ error: "Failed to stream audio" });
  }
});
function getAudioContentType(filename, mimeType) {
  const ext = path.extname(filename).toLowerCase();
  const contentTypes = {
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.m4a': 'audio/mp4',
    '.aac': 'audio/aac',
    '.flac': 'audio/flac',
    '.webm': 'audio/webm'
  };
  
  return contentTypes[ext] || mimeType || 'application/octet-stream';
}

function getContentType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const contentTypes = {
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.m4a': 'audio/mp4',
    '.aac': 'audio/aac',
  };
  return contentTypes[ext] || 'application/octet-stream';
}
app.get('/api/audio-files/debug/:id', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const pool = await getPool();
    
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('userId', sql.Int, userId)
      .query('SELECT * FROM audioFiles WHERE id = @id AND user_id = @userId');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "Audio file not found" });
    }
    
    const file = result.recordset[0];
    let storageInfo = {};
    if (file.blob_name && containerClient) {
      try {
        const blockBlobClient = containerClient.getBlockBlobClient(file.blob_name);
        const exists = await blockBlobClient.exists();
        storageInfo = {
          existsInAzure: exists,
          blobName: file.blob_name
        };
      } catch (azureError) {
        storageInfo = { azureError: azureError.message };
      }
    } else if (file.url.startsWith('/')) {
      const filePath = path.join(__dirname, file.url);
      storageInfo = {
        existsLocally: fs.existsSync(filePath),
        filePath: filePath
      };
    }
    
    res.json({
      fileInfo: file,
      storageInfo: storageInfo,
      supportedFormats: ['mp3', 'wav', 'ogg', 'm4a', 'aac']
    });
  } catch (err) {
    console.error("Debug error:", err);
    res.status(500).json({ error: "Debug failed" });
  }
});
app.get('/api/user/profile', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const pool = await getPool();
    
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT 
          id,
          email,
          name,
          professional_title,
          phone_number,
          phone_verified,
          avatar_seed,
          createdAt,
          updatedAt
        FROM Users 
        WHERE id = @userId
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json(result.recordset[0]);
  } catch (err) {
    console.error("Error fetching user profile:", err);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
});
app.get('/api/user/profile', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const pool = await getPool();
    
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT 
          id,
          email,
          name,
          professional_title,
          phone_number,
          phone_verified,
          avatar_seed,
          createdAt,
          updatedAt
        FROM Users 
        WHERE id = @userId
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json(result.recordset[0]);
  } catch (err) {
    console.error("Error fetching user profile:", err);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
});
app.put('/api/user/profile', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      professional_title, 
      phone_number, 
      avatar_seed 
    } = req.body;
    
    console.log('Profile update request:', { userId, professional_title, phone_number, avatar_seed });
    
    const pool = await getPool();
    let updateFields = [];
    const request = pool.request()
      .input('userId', sql.Int, userId);
    
    if (professional_title !== undefined) {
      updateFields.push("professional_title = @professional_title");
      request.input('professional_title', sql.NVarChar, professional_title || null);
    }
    
    if (phone_number !== undefined) {
      updateFields.push("phone_number = @phone_number");
      request.input('phone_number', sql.NVarChar, phone_number || null);
      updateFields.push("phone_verified = 0");
    }
    
    if (avatar_seed !== undefined) {
      updateFields.push("avatar_seed = @avatar_seed");
      request.input('avatar_seed', sql.NVarChar, avatar_seed || 'vet');
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }
    
    updateFields.push("updatedAt = GETDATE()");
    
    const query = `
      UPDATE Users 
      SET ${updateFields.join(", ")}
      WHERE id = @userId
      
      SELECT 
        id,
        email,
        name,
        professional_title,
        phone_number,
        phone_verified,
        avatar_seed,
        createdAt,
        updatedAt
      FROM Users 
      WHERE id = @userId
    `;
    
    const result = await request.query(query);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json({
      message: "Profile updated successfully",
      user: result.recordset[0]
    });
    
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ error: "Failed to update profile", details: err.message });
  }
});

app.post('/api/user/verify-phone', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const pool = await getPool();

    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        UPDATE Users 
        SET phone_verified = 1, updatedAt = GETDATE()
        WHERE id = @userId AND phone_number IS NOT NULL
      `);
    
    if (result.rowsAffected[0] === 0) {
      return res.status(400).json({ error: "Phone number not set or user not found" });
    }
    
    res.json({ message: "Phone number verified successfully" });
    
  } catch (err) {
    console.error("Error verifying phone:", err);
    res.status(500).json({ error: "Failed to verify phone number" });
  }
});
app.post('/api/user/change-password', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current password and new password are required" });
    }
    
    const pool = await getPool();
    const userResult = await pool.request()
      .input('userId', sql.Int, userId)
      .query('SELECT password FROM Users WHERE id = @userId');
    
    if (userResult.recordset.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const user = userResult.recordset[0];
    
    const passwordMatch = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.request()
      .input('userId', sql.Int, userId)
      .input('newPassword', sql.NVarChar, hashedPassword)
      .query('UPDATE Users SET password = @newPassword, updatedAt = GETDATE() WHERE id = @userId');
    
    res.json({ message: "Password updated successfully" });
    
  } catch (err) {
    console.error("Error changing password:", err);
    res.status(500).json({ error: "Failed to change password" });
  }
});
app.get('/api/user/subscription', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const pool = await getPool();
    
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT 
          us.*,
          sp.name as plan_name,
          sp.description as plan_description,
          sp.monthly_price,
          sp.yearly_price,
          sp.features
        FROM user_subscriptions us
        INNER JOIN subscription_plans sp ON us.plan_id = sp.id
        WHERE us.user_id = @userId AND us.status IN ('active', 'pending')
        ORDER BY us.created_at DESC
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "No active subscription found" });
    }
    
    const subscription = result.recordset[0];
    const price = subscription.billing_cycle === 'monthly' 
      ? subscription.monthly_price 
      : subscription.yearly_price;
    
    res.json({
      id: subscription.id,
      plan: {
        id: subscription.plan_id,
        name: subscription.plan_name,
        description: subscription.plan_description,
        price: price,
        features: JSON.parse(subscription.features)
      },
      billingCycle: subscription.billing_cycle,
      status: subscription.status,
      currentPeriodStart: subscription.current_period_start,
      currentPeriodEnd: subscription.current_period_end,
      nextBillingDate: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end
    });
  } catch (err) {
    console.error("Error fetching subscription:", err);
    res.status(500).json({ error: "Failed to fetch subscription" });
  }
});

app.post('/api/user/subscribe', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const { planId, billingCycle } = req.body;
    
    if (!planId || !billingCycle) {
      return res.status(400).json({ error: "Plan ID and billing cycle are required" });
    }
    
    const pool = await getPool();
    const planResult = await pool.request()
      .input('planId', sql.NVarChar, planId)
      .query('SELECT * FROM subscription_plans WHERE id = @planId AND is_active = 1');
    
    if (planResult.recordset.length === 0) {
      return res.status(404).json({ error: "Plan not found" });
    }
    
    const plan = planResult.recordset[0];
    const price = billingCycle === 'monthly' ? plan.monthly_price : plan.yearly_price;

    const currentPeriodStart = new Date();
    const currentPeriodEnd = new Date();
    
    if (billingCycle === 'monthly') {
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
    } else {
      currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
    }
    const existingSubResult = await pool.request()
      .input('userId', sql.Int, userId)
      .query('SELECT id FROM user_subscriptions WHERE user_id = @userId AND status IN (\'active\', \'pending\')');
    
    if (existingSubResult.recordset.length > 0) {
      await pool.request()
        .input('userId', sql.Int, userId)
        .input('planId', sql.NVarChar, planId)
        .input('billingCycle', sql.NVarChar, billingCycle)
        .input('currentPeriodStart', sql.Date, currentPeriodStart)
        .input('currentPeriodEnd', sql.Date, currentPeriodEnd)
        .query(`
          UPDATE user_subscriptions 
          SET plan_id = @planId, billing_cycle = @billingCycle, 
              current_period_start = @currentPeriodStart, current_period_end = @currentPeriodEnd,
              status = 'active', cancel_at_period_end = 0, updated_at = GETDATE()
          WHERE user_id = @userId
        `);
    } else {
      await pool.request()
        .input('userId', sql.Int, userId)
        .input('planId', sql.NVarChar, planId)
        .input('billingCycle', sql.NVarChar, billingCycle)
        .input('currentPeriodStart', sql.Date, currentPeriodStart)
        .input('currentPeriodEnd', sql.Date, currentPeriodEnd)
        .query(`
          INSERT INTO user_subscriptions 
            (user_id, plan_id, billing_cycle, current_period_start, current_period_end, status)
          VALUES 
            (@userId, @planId, @billingCycle, @currentPeriodStart, @currentPeriodEnd, 'active')
        `);
    }
    
    const subscriptionResult = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT 
          us.*,
          sp.name as plan_name,
          sp.description as plan_description,
          sp.monthly_price,
          sp.yearly_price,
          sp.features
        FROM user_subscriptions us
        INNER JOIN subscription_plans sp ON us.plan_id = sp.id
        WHERE us.user_id = @userId
        ORDER BY us.created_at DESC
      `);
    
    const subscription = subscriptionResult.recordset[0];
    
    res.json({
      subscription: {
        id: subscription.id,
        plan: {
          id: subscription.plan_id,
          name: subscription.plan_name,
          description: subscription.plan_description,
          price: price,
          features: JSON.parse(subscription.features)
        },
        billingCycle: subscription.billing_cycle,
        status: subscription.status,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
        nextBillingDate: subscription.current_period_end
      },
      plan: {
        id: plan.id,
        name: plan.name,
        description: plan.description
      }
    });
  } catch (err) {
    console.error("Error creating subscription:", err);
    res.status(500).json({ error: "Failed to create subscription" });
  }
});

app.post('/api/user/cancel-subscription', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const pool = await getPool();
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        UPDATE user_subscriptions 
        SET status = 'cancelled', updated_at = GETDATE()
        WHERE user_id = @userId AND status = 'active'
      `);
    
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: "No active subscription found" });
    }
    
    res.json({ message: "Subscription cancelled successfully" });
  } catch (err) {
    console.error("Error cancelling subscription:", err);
    res.status(500).json({ error: "Failed to cancel subscription" });
  }
});

app.get('/api/user/payment-methods', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const pool = await getPool();
    
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT 
          id,
          type,
          details,
          is_default,
          created_at,
          updated_at
        FROM payment_methods 
        WHERE user_id = @userId
        ORDER BY is_default DESC, created_at DESC
      `);
    const paymentMethods = result.recordset.map(method => ({
      id: method.id,
      type: method.type,
      details: JSON.parse(method.details),
      isDefault: method.is_default,
      createdAt: method.created_at,
      updatedAt: method.updated_at
    }));
    
    res.json(paymentMethods);
  } catch (err) {
    console.error("Error fetching payment methods:", err);
    res.status(500).json({ error: "Failed to fetch payment methods" });
  }
});
app.post('/api/user/payment-methods', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, details } = req.body;
    
    if (!type || !details) {
      return res.status(400).json({ error: "Type and details are required" });
    }
    
    const pool = await getPool();
    const existingMethodsResult = await pool.request()
      .input('userId', sql.Int, userId)
      .query('SELECT COUNT(*) as count FROM payment_methods WHERE user_id = @userId');
    
    const isFirstMethod = existingMethodsResult.recordset[0].count === 0;
    
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .input('type', sql.NVarChar, type)
      .input('details', sql.NVarChar, JSON.stringify(details))
      .input('isDefault', sql.Bit, isFirstMethod ? 1 : 0)
      .query(`
        INSERT INTO payment_methods (user_id, type, details, is_default)
        OUTPUT inserted.id, inserted.type, inserted.details, inserted.is_default, inserted.created_at
        VALUES (@userId, @type, @details, @isDefault)
      `);
    
    const newMethod = result.recordset[0];
    
    res.status(201).json({
      id: newMethod.id,
      type: newMethod.type,
      details: JSON.parse(newMethod.details),
      isDefault: newMethod.is_default,
      createdAt: newMethod.created_at
    });
  } catch (err) {
    console.error("Error adding payment method:", err);
    res.status(500).json({ error: "Failed to add payment method" });
  }
});
app.put('/api/user/payment-methods/:id', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { details } = req.body;
    
    if (!details) {
      return res.status(400).json({ error: "Details are required" });
    }
    
    const pool = await getPool();
    const checkResult = await pool.request()
      .input('id', sql.Int, id)
      .input('userId', sql.Int, userId)
      .query('SELECT id FROM payment_methods WHERE id = @id AND user_id = @userId');
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ error: "Payment method not found" });
    }
    await pool.request()
      .input('id', sql.Int, id)
      .input('userId', sql.Int, userId)
      .input('details', sql.NVarChar, JSON.stringify(details))
      .query(`
        UPDATE payment_methods 
        SET details = @details, updated_at = GETDATE()
        WHERE id = @id AND user_id = @userId
      `);
    const updatedResult = await pool.request()
      .input('id', sql.Int, id)
      .input('userId', sql.Int, userId)
      .query(`
        SELECT 
          id,
          type,
          details,
          is_default,
          created_at,
          updated_at
        FROM payment_methods 
        WHERE id = @id AND user_id = @userId
      `);
    
    if (updatedResult.recordset.length === 0) {
      return res.status(404).json({ error: "Payment method not found after update" });
    }
    
    const updatedMethod = updatedResult.recordset[0];
    
    res.json({
      id: updatedMethod.id,
      type: updatedMethod.type,
      details: JSON.parse(updatedMethod.details),
      isDefault: updatedMethod.is_default,
      updatedAt: updatedMethod.updated_at
    });
  } catch (err) {
    console.error("Error updating payment method:", err);
    res.status(500).json({ 
      error: "Failed to update payment method",
      details: err.message 
    });
  }
});
app.delete('/api/user/payment-methods/:id', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const pool = await getPool();
    const methodResult = await pool.request()
      .input('id', sql.Int, id)
      .input('userId', sql.Int, userId)
      .query('SELECT is_default FROM payment_methods WHERE id = @id AND user_id = @userId');
    
    if (methodResult.recordset.length === 0) {
      return res.status(404).json({ error: "Payment method not found" });
    }
    
    const isDefault = methodResult.recordset[0].is_default;
    
    if (isDefault) {
      return res.status(400).json({ error: "Cannot delete default payment method" });
    }
    
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('userId', sql.Int, userId)
      .query('DELETE FROM payment_methods WHERE id = @id AND user_id = @userId');
    
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: "Payment method not found" });
    }
    
    res.json({ message: "Payment method deleted successfully" });
  } catch (err) {
    console.error("Error deleting payment method:", err);
    res.status(500).json({ error: "Failed to delete payment method" });
  }
});
app.post('/api/user/payment-methods/:id/set-default', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const pool = await getPool();
    await pool.request()
      .input('userId', sql.Int, userId)
      .query('UPDATE payment_methods SET is_default = 0 WHERE user_id = @userId');
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('userId', sql.Int, userId)
      .query(`
        UPDATE payment_methods 
        SET is_default = 1, updated_at = GETDATE()
        WHERE id = @id AND user_id = @userId
      `);
    
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: "Payment method not found" });
    }
    
    res.json({ message: "Default payment method updated successfully" });
  } catch (err) {
    console.error("Error setting default payment method:", err);
    res.status(500).json({ error: "Failed to set default payment method" });
  }
});
// Auth0 callback endpoint

// Improved Auth0 callback endpoint
app.post('/api/auth/auth0/callback', checkJwt, async (req, res) => {
  try {
    const auth0User = req.auth.payload;
    console.log('🔐 Auth0 callback received:', {
      sub: auth0User.sub,
      email: auth0User.email,
      name: auth0User.name
    });

    const pool = await getPool();
    
    // Check if user exists by auth0_id OR email
    const userResult = await pool.request()
      .input('auth0Id', sql.NVarChar, auth0User.sub)
      .input('email', sql.NVarChar, auth0User.email)
      .query(`
        SELECT * FROM Users 
        WHERE auth0_id = @auth0Id OR email = @email
        ORDER BY 
          CASE 
            WHEN auth0_id = @auth0Id THEN 1
            ELSE 2 
          END
      `);
    
    let user;
    
    if (userResult.recordset.length === 0) {
      // Create new user
      console.log('👤 Creating new user from Auth0...');
      const createResult = await pool.request()
        .input('auth0Id', sql.NVarChar, auth0User.sub)
        .input('email', sql.NVarChar, auth0User.email)
        .input('name', sql.NVarChar, auth0User.name || auth0User.email.split('@')[0])
        .input('emailVerified', sql.Bit, auth0User.email_verified ? 1 : 0)
        .query(`
          INSERT INTO Users (auth0_id, email, name, email_verified, createdAt, updatedAt)
          OUTPUT inserted.id, inserted.email, inserted.name, inserted.auth0_id, inserted.createdAt
          VALUES (@auth0Id, @email, @name, @emailVerified, GETDATE(), GETDATE())
        `);
      
      user = createResult.recordset[0];
      console.log('✅ New user created:', user.email);
    } else {
      // User exists - handle account linking
      user = userResult.recordset[0];
      
      if (user.auth0_id !== auth0User.sub) {
        console.log('🔗 Linking Auth0 account to existing user...');
        
        // Update user with Auth0 ID
        await pool.request()
          .input('id', sql.Int, user.id)
          .input('auth0Id', sql.NVarChar, auth0User.sub)
          .input('emailVerified', sql.Bit, auth0User.email_verified ? 1 : 0)
          .query(`
            UPDATE Users 
            SET auth0_id = @auth0Id, 
                email_verified = @emailVerified,
                updatedAt = GETDATE()
            WHERE id = @id
          `);
        
        user.auth0_id = auth0User.sub;
      }
      
      console.log('✅ Existing user authenticated:', user.email);
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        name: user.name,
        auth0Id: user.auth0_id 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        auth0Id: user.auth0_id,
        createdAt: user.createdAt
      }
    });
    
  } catch (error) {
    console.error('❌ Auth0 callback error:', error);
    
    // Handle specific error cases
    if (error.number === 2627) {
      return res.status(409).json({ 
        success: false,
        error: 'Account linking required',
        code: 'ACCOUNT_LINKING_REQUIRED',
        message: 'This email is already registered with a different authentication method.'
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Authentication failed',
      details: error.message 
    });
  }
});
// Add this with your other auth routes
// Improved Auth0 sync endpoint
app.post('/api/auth/auth0/sync', async (req, res) => {
  try {
    const { auth0Id, email, name, emailVerified } = req.body;
    
    console.log("🔄 Auth0 sync request:", { auth0Id, email, name });
    
    if (!auth0Id || !email) {
      return res.status(400).json({ error: 'Auth0 ID and email are required' });
    }

    const pool = await getPool();
    
    // Check if user exists by auth0_id OR email
    const userResult = await pool.request()
      .input('auth0Id', sql.NVarChar, auth0Id)
      .input('email', sql.NVarChar, email)
      .query(`
        SELECT * FROM Users 
        WHERE auth0_id = @auth0Id OR email = @email
        ORDER BY 
          CASE 
            WHEN auth0_id = @auth0Id THEN 1  -- Prefer exact auth0_id match
            ELSE 2 
          END
      `);
    
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
      // User exists - update with Auth0 info
      user = userResult.recordset[0];
      console.log("✅ User found, updating Auth0 info:", user.id);
      
      // If user exists by email but not by auth0_id, link the Auth0 account
      if (user.auth0_id !== auth0Id) {
        await pool.request()
          .input('id', sql.Int, user.id)
          .input('auth0Id', sql.NVarChar, auth0Id)
          .input('name', sql.NVarChar, name || email.split('@')[0])
          .input('emailVerified', sql.Bit, emailVerified ? 1 : 0)
          .query(`
            UPDATE Users 
            SET auth0_id = @auth0Id, 
                name = COALESCE(@name, name),
                email_verified = @emailVerified,
                updatedAt = GETDATE()
            WHERE id = @id
          `);
        
        // Refresh user data
        const updatedResult = await pool.request()
          .input('id', sql.Int, user.id)
          .query('SELECT * FROM Users WHERE id = @id');
        
        user = updatedResult.recordset[0];
      }
    }
    
    // Generate token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        auth0Id: user.auth0_id 
      }, 
      process.env.JWT_SECRET || 'your-secret-key', 
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
    console.error('❌ Auth0 sync error:', error);
    
    // Handle specific SQL errors
    if (error.number === 2627) { // Unique constraint violation
      if (error.message.includes('email')) {
        return res.status(409).json({ 
          error: 'Email already exists with different authentication method',
          code: 'EMAIL_EXISTS'
        });
      }
    }
    
    res.status(500).json({ 
      error: 'Failed to sync user',
      details: error.message 
    });
  }
});
app.get('/api/auth/auth0/callback', checkJwt, handleAuth0User, async (req, res) => {
  try {
    const auth0User = req.auth.payload;
    const pool = await getPool();
    
    // Get or create user from database
    const result = await pool.request()
      .input('auth0Id', sql.NVarChar, auth0User.sub)
      .query('SELECT * FROM Users WHERE auth0_id = @auth0Id');
    
    let user;
    if (result.recordset.length === 0) {
      // Create new user
      const createResult = await pool.request()
        .input('auth0Id', sql.NVarChar, auth0User.sub)
        .input('email', sql.NVarChar, auth0User.email)
        .input('name', sql.NVarChar, auth0User.name || auth0User.email.split('@')[0])
        .input('emailVerified', sql.Bit, auth0User.email_verified ? 1 : 0)
        .query(`
          INSERT INTO Users (auth0_id, email, name, email_verified, createdAt)
          OUTPUT inserted.*
          VALUES (@auth0Id, @email, @name, @emailVerified, GETDATE())
        `);
      user = createResult.recordset[0];
    } else {
      user = result.recordset[0];
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        name: user.name,
        auth0Id: user.auth0_id 
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    // Redirect to frontend with token
    res.redirect(`${process.env.VITE_AUTH_REDIRECT_URI}?token=${token}`);
    
  } catch (error) {
    console.error('Auth0 callback error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});
// Add this to your server.js after all other routes
app.get('/api/users/by-sub/:sub', authenticateJWT, async (req, res) => {
  try {
    const { sub } = req.params;
    const pool = await getPool();
    
    const result = await pool.request()
      .input('auth0Id', sql.NVarChar, sub)
      .query('SELECT id, email, name, auth0_id, createdAt FROM Users WHERE auth0_id = @auth0Id');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json(result.recordset[0]);
  } catch (error) {
    console.error("Error fetching user by auth0 sub:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});
app.get('/api/users/auth0/:auth0Id', authenticateJWT, async (req, res) => {
  try {
    const { auth0Id } = req.params;
    const pool = await getPool();
    
    const result = await pool.request()
      .input('auth0Id', sql.NVarChar, auth0Id)
      .query('SELECT id, email, name, auth0_id, createdAt FROM Users WHERE auth0_id = @auth0Id');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json(result.recordset[0]);
  } catch (error) {
    console.error("Error fetching user by Auth0 ID:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});
// Add this to your server.js
app.post('/api/auth/link-auth0', authenticateJWT, async (req, res) => {
  try {
    const { auth0Id, email } = req.body;
    const userId = req.user.id;

    if (!auth0Id || !email) {
      return res.status(400).json({ error: 'Auth0 ID and email are required' });
    }

    const pool = await getPool();
    
    // Verify that the email matches the authenticated user
    const userResult = await pool.request()
      .input('userId', sql.Int, userId)
      .query('SELECT email FROM Users WHERE id = @userId');
    
    if (userResult.recordset.length === 0 || userResult.recordset[0].email !== email) {
      return res.status(403).json({ error: 'Email does not match authenticated user' });
    }

    // Check if Auth0 ID is already linked to another account
    const auth0Check = await pool.request()
      .input('auth0Id', sql.NVarChar, auth0Id)
      .query('SELECT id FROM Users WHERE auth0_id = @auth0Id AND id != @userId');
    
    if (auth0Check.recordset.length > 0) {
      return res.status(409).json({ error: 'Auth0 account already linked to another user' });
    }

    // Link the Auth0 account
    await pool.request()
      .input('userId', sql.Int, userId)
      .input('auth0Id', sql.NVarChar, auth0Id)
      .query('UPDATE Users SET auth0_id = @auth0Id, updatedAt = GETDATE() WHERE id = @userId');

    res.json({ success: true, message: 'Auth0 account linked successfully' });
    
  } catch (error) {
    console.error('Account linking error:', error);
    res.status(500).json({ error: 'Failed to link Auth0 account' });
  }
});