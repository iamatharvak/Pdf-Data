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
    origin: [
      "https://pdf-data-xlwv-git-main-v2-iamatharvaks-projects.vercel.app",
      "http://localhost:3000",
    ],
    methods: ["GET", "POST"],
  })
);

let extractedDataCache = null;

app.post("/upload", upload.single("file"), async (req, res) => {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://pdf-data-xlwv-git-main-v2-iamatharvaks-projects.vercel.app"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  try {
    console.log(req.file);
    const fileBuffer = req.file.buffer;
    const query = req.body.query;

    const pdfBuffer = fs.readFileSync(fileBuffer);
    const pdfData = await pdfParse(pdfBuffer);

    const prompt = `
    PDF Content: ${pdfData.text}

    User Query: ${query}

    Instruction: Extract the financial data from the PDF content provided. Present the extracted data in a JSON format with two keys:
    1. "columns": An array of column names for the table.
    2. "rows": A 2D array where each sub-array represents a row of data.
    `;

    const result = await model.generateContent(prompt);

    // Log raw response for debugging
    const rawResponse = result.response.text();
    console.log("Raw Model Response:", rawResponse);

    const cleanedResponse = rawResponse
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    console.log("Cleaned Response:", cleanedResponse);

    const jsonResponse = JSON.parse(cleanedResponse);
    console.log("Parsed JSON Response:", jsonResponse);

    res.json(jsonResponse);
    extractedDataCache = jsonResponse;
  } catch (error) {
    console.error("Error processing the request:", error);
    res.status(500).send("Error processing the file.");
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
