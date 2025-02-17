const express = require("express");
const multer = require("multer");
const cors = require("cors");
const NodeCache = require("node-cache");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const app = express();
const PORT = 5000;

// CORS Configuration
app.use(
  cors({
    origin: ["https://pdf-data-xlwv.vercel.app", "http://localhost:3000"],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Multer Storage (Memory to avoid saving files)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Google Generative AI Setup
const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Changed to flash model

// API Cache (TTL: 1 hour)
const cache = new NodeCache({ stdTTL: 3600 });

// Function to split text into chunks
function splitText(text, chunkSize = 5000) {
  let chunks = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks;
}

// Upload and Process PDF
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const pdfBuffer = req.file.buffer;
    const pdfBase64 = pdfBuffer.toString("base64");

    // Check Cache First
    if (cache.has(pdfBase64)) {
      return res.json({ extractedData: cache.get(pdfBase64) });
    }

    const chunks = splitText(pdfBase64, 50000); 
    let extractedData = "";

    for (const chunk of chunks) {
      const prompt = `Extract table data from this PDF chunk: ${chunk}`;
      const result = await model.generateContent(prompt);
      const rawResponse = await result.response.text();
      extractedData += rawResponse + "\n";
    }

    // Store in cache
    cache.set(pdfBase64, extractedData);

    res.json({ extractedData });
  } catch (error) {
    console.error("Error processing file:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
