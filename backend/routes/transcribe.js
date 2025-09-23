import express from "express";
import fetch from "node-fetch";
import fs from "fs";
import FormData from "form-data";
import path from "path";

const router = express.Router();

router.post("/", async (req, res) => {
   console.log("Received /api/transcribe request at", new Date().toISOString());
  try {
    console.log("OPENAI_API_KEY loaded:", process.env.OPENAI_API_KEY ? "✅ Yes" : "❌ No");

    if (!req.files || !req.files.audio) {
      return res.status(400).json({ error: "No audio file uploaded" });
    }

    const audioFile = req.files.audio;
    const uploadDir = "./uploads";

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }

    const tempPath = path.join(uploadDir, audioFile.name);
    await audioFile.mv(tempPath);

    const formData = new FormData();
    formData.append("file", fs.createReadStream(tempPath));
    formData.append("model", "whisper-1");

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        ...formData.getHeaders(),
      },
      body: formData,
    });

    const data = await response.json();
    fs.unlinkSync(tempPath);

    console.log("OpenAI API raw response:", data);

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || "Unknown error from OpenAI",
      });
    }

    res.json({ text: data.text });
  } catch (error) {
    console.error("Transcription Error:", error);
    res.status(500).json({ error: error.message || "Transcription failed" });
  }
});

export default router;
