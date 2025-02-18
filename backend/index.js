const express = require("express");
const multer = require("multer");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const cors = require("cors");
const XLSX = require("xlsx");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const apikey = process.env.API_KEY;
const app = express();
const upload = multer({ dest: "uploads/" });
const genAI = new GoogleGenerativeAI(apikey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    // allowedHeaders: ["Content-Type", "Authorization"],
  })
);
const allowedOrigins = [
  "https://pdf-data-xlwv-git-main-v2-iamatharvaks-projects.vercel.app",
  "http://localhost:3000",
];

let extractedDataCache = null;

app.post("/upload", upload.single("file"), async (req, res) => {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://pdf-data-xlwv-git-main-v2-iamatharvaks-projects.vercel.app"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  // res.setHeader("Access-Control-Allow-Credentials", "true");

  try {
    console.log(req.file);
    const query = req.body.query;

    if (!req.file || !query) {
      return res.status(400).json({ error: "File and query are required" });
    }

    const pdfBuffer = fs.readFileSync(req.file.path);
    const pdfData = await pdfParse(pdfBuffer);

    const prompt = `
    PDF Content: ${pdfData.text}

    User Query: ${query}

    Instruction: Extract the financial data from the PDF content provided. Present the extracted data in JSON format.
    `;

    const result = await model.generateContent(prompt);
    const rawResponse = result.response.text();

    const cleanedResponse = rawResponse
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    const jsonResponse = JSON.parse(cleanedResponse);

    res.json(jsonResponse);
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).send("Error processing the file.");
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
