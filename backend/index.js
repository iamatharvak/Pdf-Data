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
    origin: "https://pdf-data-xlwv-8jh7qll28-iamatharvaks-projects.vercel.app",
    methods: ["GET", "POST"],
  })
);

let extractedDataCache = null;

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    console.log(req.file.path);
    const filePath = req.file.path;
    const query = req.body.query;

    const pdfBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(pdfBuffer);

    const prompt = `
    PDF Content: ${pdfData.text}

    User Query: ${query}

    Instruction: Extract the financial data from the PDF content provided. Present the extracted data in a JSON format with two keys:
    1. "columns": An array of column names for the table.
    2. "rows": A 2D array where each sub-array represents a row of data.
    `;

    const result = await model.generateContent(prompt);

    fs.unlinkSync(filePath);

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

app.get("/download", (req, res) => {
  try {
    if (!extractedDataCache) {
      return res
        .status(400)
        .send("No extracted data available. Please upload a PDF first.");
    }

    const extractedData = extractedDataCache;

    const workbook = XLSX.utils.book_new();
    const worksheetData = [extractedData.columns, ...extractedData.rows];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

    const excelBuffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    res.setHeader("Content-Disposition", "attachment; filename=data.xlsx");
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    console.log("here response", excelBuffer);
    res.send(excelBuffer);
  } catch (error) {
    console.error("Error during download:", error);
    res.status(500).send("Error generating Excel file.");
  }
});

// function parsePDFContent(pdfText) {
//   const lines = pdfText.split("\n");
//   const columns = lines[0].split(/\s+/); // Example: Assume first line contains column headers
//   const rows = lines.slice(1).map((line) => line.split(/\s+/));

//   return {
//     columns: columns,
//     rows: rows,
//   };
// }

// function parsePDFContent(pdfText) {
//   const lines = pdfText.split("\n");
//   const columns = lines[0].split(/\s+/);
//   const rows = lines.slice(1).map((line) => line.split(/\s+/));
//   return {
//     columns: columns,
//     rows: rows,
//   };
// }

app.listen(5000, () => console.log("Server running on http://localhost:5000"));
