const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { nanoid } = require('nanoid');
const { parseZipStructure } = require('../utils/structureParser');
const { analyzeStructure, isGeminiConfigured } = require('../utils/gemini');
const { publicKeyPem, decryptPayload } = require('../utils/crypto');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer (memory storage for immediate processing)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB limit
});

// In-memory store for shareable links (id -> data)
// For production, use a database (e.g., MongoDB, PostgreSQL)
const analysisStore = new Map();

router.get('/ping', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is awake' });
});

router.get('/public-key', (req, res) => {
  res.json({ publicKey: publicKeyPem });
});

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    let zipBuffer;

    // Check if the payload is encrypted or a raw file
    if (req.body.encryptedData) {
      // Handle Encrypted Payload
      const { encryptedFile, encryptedKey, iv } = JSON.parse(req.body.encryptedData);
      zipBuffer = decryptPayload(encryptedFile, encryptedKey, iv);
    } else if (req.file) {
      // Handle standard file upload (keep for backward compatibility/testing)
      if (req.file.mimetype !== 'application/zip' && req.file.mimetype !== 'application/x-zip-compressed') {
        return res.status(400).json({ error: 'Only ZIP files are allowed' });
      }
      zipBuffer = req.file.buffer;
    } else {
      return res.status(400).json({ error: 'No data received' });
    }

    // 1. Parse ZIP structure from buffer
    const structure = parseZipStructure(zipBuffer);

    // 2. Upload to Cloudinary (optional/mocked based on your current setup)
    let fileUrl = 'https://mock-url.com/mock.zip';
    if (process.env.CLOUDINARY_API_KEY) {
      const uploadResult = await new Promise((resolve, reject) => {
        const publicId = `${nanoid(12)}.zip`;
        const uploadStream = cloudinary.uploader.upload_stream(
          { 
            resource_type: 'raw', 
            public_id: publicId,
            use_filename: true
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(zipBuffer);
      });
      fileUrl = uploadResult.secure_url;
    }

    // 3. Call Gemini API
    let analysis;
    if (isGeminiConfigured) {
      const framework = req.body.framework || "Generic Software Project";
      analysis = await analyzeStructure(structure, framework);
    } else {
      analysis = {
        score: 7,
        issues: ["Missing tests folder", "No clear separation of utils"],
        suggestions: ["Add a tests folder", "Group utility functions into a utils/ directory"],
        improved_structure: {
          ...structure,
          "tests": { "App.test.tsx": true },
          "src": { ...(structure.src || {}), "utils": { "helpers.ts": true } }
        }
      };
    }

    const shareId = nanoid(10);
    const resultData = {
      fileUrl,
      structure,
      analysis,
      createdAt: new Date().toISOString()
    };
    
    analysisStore.set(shareId, resultData);

    res.json({
      ...resultData,
      shareId
    });

  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ error: error.message || 'Analysis failed' });
  }
});

router.post('/analyze-direct', async (req, res) => {
  try {
    const { structure, projectName, framework } = req.body;

    if (!structure) {
      return res.status(400).json({ error: 'No structure provided' });
    }

    // 1. Analyze structure with Gemini
    const analysis = await analyzeStructure(structure, framework || "Generic Software Project");

    // 2. Store analysis for sharing
    const id = nanoid(10);
    const resultData = {
      analysis,
      structure,
      projectName: projectName || 'Manual Analysis',
      fileUrl: null,
      date: new Date().toISOString()
    };
    
    analysisStore.set(id, resultData);

    res.json({
      ...resultData,
      shareId: id
    });
  } catch (error) {
    console.error('Direct Analysis Error:', error);
    res.status(500).json({ error: error.message || 'Analysis failed' });
  }
});

router.get('/analysis/:id', (req, res) => {
  const data = analysisStore.get(req.params.id);
  if (!data) {
    return res.status(404).json({ error: 'Analysis not found' });
  }
  res.json(data);
});

module.exports = router;
