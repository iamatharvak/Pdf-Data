const express = require("express");
const multer = require("multer");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const cors = require("cors");
const XLSX = require("xlsx");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();
const PORT = 5000;

const apikey = process.env.API_KEY;
const app = express();
const upload = multer({ dest: "uploads/" });
const genAI = new GoogleGenerativeAI(apikey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
app.use(
  cors({
    origin: ["http://localhost:3000", "https://pdf-data-xlwv.vercel.app"],
    methods: ["GET", "POST"],
  })
);

let extractedDataCache = null;

app.post("/upload", upload.single("file"), async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  try {
    console.log(req.body);
    const filePath = req.file.path;

    const query = req.body.query || "";
    let selectedMetrics = req.body.metrics || [];
    console.log(req.body.metrics);

    if (typeof selectedMetrics === "string") {
      selectedMetrics = JSON.parse(selectedMetrics);
    }

    // if (!Array.isArray(selectedMetrics)) {
    //   selectedMetrics = [];
    // }
    const pdfBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(pdfBuffer);

    let prompt;

    if (
      query.toLowerCase().includes("summarize") ||
      query.toLowerCase().includes("describe")
    ) {
      prompt = ` 
      PDF Content: ${pdfData.text}
      
      User Query: ${query}

      Instruction: Please summarize or describe the content of the PDF in a detailed paragraph.
      `;
    } else {
      prompt = ` 
      PDF Content: ${pdfData.text}

      User Query: ${query}

      Instruction: Extract the relevant data from the PDF content in a structured table format. Present the extracted data in a JSON format with two keys:
      1. "columns": An array of column names for the table.
      2. "rows": A 2D array where each sub-array represents a row of data.
      `;
    }

    const result = await model.generateContent(prompt);
    const rawResponse = result.response.text();
    const cleanedResponse = rawResponse
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let jsonResponse;
    let paragraphResponse = "";
    let tableResponse = {};

    try {
      jsonResponse = JSON.parse(cleanedResponse);
      if (jsonResponse.columns && jsonResponse.rows) {
        tableResponse = jsonResponse;
      }
    } catch (e) {
      paragraphResponse = cleanedResponse;
    }

    let extractedMetrics = {};
    const financialMetrics = [
      "AUM",
      "Disbursement Value",
      "Total Income",
      "NIM",
      "Profit After Tax (PAT)",
      "ROA",
      "ROE",
      "Operating Expenses",
      "GNPA & NNPA",
      "DPD Buckets",
      "Provision Coverage Ratio (PCR)",
      "Write-offs (%)",
    ];

    if (selectedMetrics.length > 0) {
      const pdfText = pdfData.text;

      selectedMetrics.forEach((metric) => {
        if (financialMetrics.includes(metric)) {
          const regex = new RegExp(
            `${metric}[^\\d]*(\\p{Sc}*\\d{1,3}(?:[\\d,]{3})*(?:\\.\\d+)?\\s*(?:Mn|B|K)?)`,
            "iu"
          );
          const match = pdfText.match(regex);
          if (match) {
            extractedMetrics[metric] = match[1].trim();
          }
        }
      });
    }
    const filteredMetrics = {};
    selectedMetrics.forEach((metric) => {
      if (extractedMetrics[metric]) {
        filteredMetrics[metric] = extractedMetrics[metric];
      }
    });

    const response = {
      paragraph: paragraphResponse || "No paragraph content found.",
      table: tableResponse || "No table content found.",
      metrics: filteredMetrics,
    };

    extractedDataCache = {
      paragraph: paragraphResponse,
      table: tableResponse,
      metrics: extractedMetrics,
    };

    res.json(response);
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
app.post("/compare", upload.array("file", 2), async (req, res) => {
  try {
    if (!req.files || req.files.length !== 2) {
      return res.status(400).send("Please upload exactly two PDFs.");
    }

    const file1Path = req.files[0].path;
    const file2Path = req.files[1].path;

    const pdfBuffer1 = fs.readFileSync(file1Path);
    const pdfBuffer2 = fs.readFileSync(file2Path);

    const pdfData1 = await pdfParse(pdfBuffer1);
    const pdfData2 = await pdfParse(pdfBuffer2);

    const prompt = `
      PDF 1 Content: ${pdfData1.text}
      
      PDF 2 Content: ${pdfData2.text}
      
      Instruction: Extract the financial data from both PDFs and compare them. Return a JSON object with:
      1. "differences": A description of the differences.
      2. "table1": Extracted data from PDF 1 in JSON format.
      3. "table2": Extracted data from PDF 2 in JSON format.
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
    console.error("Error processing the comparison:", error);
    res.status(500).send("Error processing the file.");
  }
});

app.listen(PORT, console.log(`Server started to run on ${PORT}`));

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
