const express = require("express");
const multer = require("multer");
const axios = require("axios");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const cors = require("cors");
const cheerio = require("cheerio");
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
    const filePath = req.file.path;
    const query = req.body.query || "";
    let selectedMetrics = req.body.metrics || [];

    if (typeof selectedMetrics === "string") {
      selectedMetrics = JSON.parse(selectedMetrics);
    }
    if (!Array.isArray(selectedMetrics)) {
      selectedMetrics = [];
    }

    if (
      (query && selectedMetrics.length > 0) ||
      (!query && selectedMetrics.length === 0)
    ) {
      fs.unlinkSync(filePath);
      return res
        .status(400)
        .send(
          "Please provide either a query or selected metrics, but not both or neither."
        );
    }

    const pdfBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(pdfBuffer);
    const pdfText = pdfData.text;

    let response = {};

    if (selectedMetrics.length > 0) {
      const prompt = `
        PDF Content: ${pdfText}
        Instruction: Extract the following financial metrics from the PDF content: ${selectedMetrics.join(
          ", "
        )}. 
        Extract the requested financial data from the PDF content provided .Present the extracted data in a JSON format with two keys:
          1. "columns": An array of column names for the table, including "Year" (the fiscal year or period the data pertains to, inferred from the PDF context) where applicable.
          2. "rows": A 2D array where each sub-array represents a row of data.
            Additional Guidance: If the query involves financial metrics like yield, cost of borrowing, or spread, ensure they are presented in that order of precedence (yield > cost of borrowing > spread) in the table columns or rows where relevant.
      `;

      const result = await model.generateContent(prompt);
      const rawResponse = result.response
        .text()
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      let jsonResponse;
      try {
        jsonResponse = JSON.parse(rawResponse);
        if (jsonResponse.columns && jsonResponse.rows) {
          response.query = jsonResponse;
        } else {
          response.query = {
            text: "Unable to extract metrics in table format.",
          };
        }
      } catch (e) {
        response.query = { text: "Error parsing metrics data." };
      }
    }

    if (query) {
      let prompt;
      if (query.toLowerCase().includes("table")) {
        prompt = `
          PDF Content: ${pdfText}
          User Query: ${query}
          Instruction: Extract the requested financial data from the PDF content provided. Present the extracted data in a JSON format with two keys:
            1. "columns": An array of column names for the table, including "Year" (the fiscal year or period the data pertains to, inferred from the PDF context) where applicable.
            2. "rows": A 2D array where each sub-array represents a row of data.
            Additional Guidance: If the query involves financial metrics like yield, cost of borrowing, or spread, ensure they are presented in that order of precedence (yield > cost of borrowing > spread) in the table columns or rows where relevant.
        `;
      } else {
        prompt = `
          PDF Content: ${pdfText}
          User Query: ${query}
          Instruction: Respond to the user's query by providing a detailed paragraph based on the PDF content. If specific data is requested and not directly available, calculate it if possible using the available data and explain the process in the paragraph.
          Additional Guidance: If the query involves financial metrics like yield, cost of borrowing, or spread, ensure they are presented in that order of precedence (yield > cost of borrowing > spread) in the table columns or rows where relevant.
        `;
      }

      const result = await model.generateContent(prompt);
      const rawResponse = result.response
        .text()
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      let jsonResponse;
      try {
        jsonResponse = JSON.parse(rawResponse);
        if (jsonResponse.columns && jsonResponse.rows) {
          response.query = jsonResponse;
        } else {
          response.query = { text: rawResponse };
        }
      } catch (e) {
        response.query = { text: rawResponse };
      }
    }

    const finalResponse = {
      data: [response],
      query: query || null,
      metrics: selectedMetrics.length > 0 ? selectedMetrics : null,
    };

    extractedDataCache = response;
    fs.unlinkSync(filePath);

    res.json(finalResponse);
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
    console.log("Raw response:", rawResponse);

    let cleanedResponse = rawResponse
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    cleanedResponse = cleanedResponse.replace(/[^a-zA-Z0-9\s{}[\],":.-]/g, "");

    function isValidJson(str) {
      try {
        JSON.parse(str);
        return true;
      } catch (e) {
        return false;
      }
    }

    try {
      if (isValidJson(cleanedResponse)) {
        const jsonResponse = JSON.parse(cleanedResponse);
        res.json(jsonResponse);
      } else {
        console.error("Invalid JSON format after cleaning.");
        res.status(500).send("Error: Invalid JSON response format.");
      }
    } catch (error) {
      console.error("Error parsing JSON:", error);
      res.status(500).send("Error processing the file.");
    }
  } catch (error) {
    console.error("Error processing the comparison:", error);
    res.status(500).send("Error processing the file.");
  }
});

app.get("/api/getCompanyReports", async (req, res) => {
  const companyName = req.query.companyName;
  if (!companyName) {
    return res.status(400).json({ error: "Company name is required" });
  }

  try {
    const companyUrl = `https://www.screener.in/company/${companyName}/`;
    const response = await axios.get(companyUrl);
    if (response.status !== 200) {
      return res.status(404).json({ error: "Company not found" });
    }

    const $ = cheerio.load(response.data);

    const reports = {
      transcripts: [],
      notes: [],
      ppts: [],
      recordings: [],
    };

    $(".concall-link").each((i, element) => {
      let link = $(element).attr("href");
      let type = $(element).text().trim();
      let dateElement = $(element)
        .closest(".report-container")
        .find(".ink-600.font-size-15")
        .text()
        .trim();
      let date = dateElement || "Unknown Date";

      if (link) {
        const fullLink = link.startsWith("http")
          ? link
          : `https://www.screener.in${link}`;

        if (type.includes("Transcript")) {
          reports.transcripts.push({ link: fullLink, date });
        } else if (type.includes("Notes")) {
          reports.notes.push({ link: fullLink, date });
        } else if (type.includes("PPT")) {
          reports.ppts.push({ link: fullLink, date });
        } else if (type.includes("REC")) {
          reports.recordings.push({ link: fullLink, date });
        }
      }
    });

    if (
      reports.transcripts.length === 0 &&
      reports.notes.length === 0 &&
      reports.ppts.length === 0 &&
      reports.recordings.length === 0
    ) {
      return res
        .status(404)
        .json({ error: "No reports found for this company." });
    }

    return res.json({ reports });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "An error occurred while fetching the company data" });
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
