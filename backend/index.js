const express = require("express");
const path = require("path");
const multer = require("multer");
const axios = require("axios");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const cors = require("cors");
const cheerio = require("cheerio");
const XLSX = require("xlsx");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();
const PORT = 5001;

const apikey = process.env.API_KEY;
const app = express();
const upload = multer({ dest: "uploads/" });
const genAI = new GoogleGenerativeAI(apikey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const { promisify } = require("util");
const { generateKey } = require("crypto");
const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);
const tempDir = path.join(__dirname, "temp");

app.use(
  cors({
    origin: ["https://pdf-data-xlwv.vercel.app", "http://localhost:3000"],
    methods: ["GET", "POST"],
  })
);

app.use(express.json());

// const allowedOrigins = [
//   // "https://pdf-data-xlwv-git-main-v2-iamatharvaks-projects.vercel.app",
//   "http://localhost:3000",
// ];

let extractedDataCache = null;

app.post("/upload", upload.single("file"), async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  try {
    // if (!req.file) {
    //   return res.status(400).send("No file was uploaded.");
    // }

    const filePath = req.file.path;
    const query = req.body.query || "";
    let selectedMetrics = req.body.metrics || [];

    // Handle metrics parsing
    try {
      if (typeof selectedMetrics === "string") {
        selectedMetrics = JSON.parse(selectedMetrics);
      }
      if (!Array.isArray(selectedMetrics)) {
        selectedMetrics = [];
      }
    } catch (error) {
      fs.unlinkSync(filePath);
      return res.status(400).send("Invalid metrics format provided.");
    }

    // Validate input parameters
    if ((query && selectedMetrics.length > 0) || (!query && selectedMetrics.length === 0)) {
      fs.unlinkSync(filePath);
      return res.status(400).send(
        "Please provide either a query or selected metrics, but not both or neither."
      );
    }

    // Extract text from PDF with better error handling
    // let pdfText;
    
      const pdfBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(pdfBuffer);
      const pdfText = pdfData.text;
      
      

    let response = {};

    // Process based on whether metrics or query is provided
    if (selectedMetrics.length > 0) {
      // Build a prompt focused on extracting specific metrics
      const prompt = `
      You are a financial data extraction specialist for investment analysts.
      
      TASK: Extract specific financial metrics from company reports.
      
      PDF CONTENT: ${pdfText.substring(0, 25000)}
      
      REQUESTED METRICS: ${selectedMetrics.join(", ")}
      
      INSTRUCTIONS:
      1. Search the PDF content carefully for the requested financial metrics.
      2. Look for these metrics in tables, text paragraphs, bullet points, and footnotes.
      3. Consider different terminologies companies might use for the same metrics.
      4. For each metric, extract both the value and the time period it represents.
      5. Try to find the most recent data available in the document.
      6. If a metric is not found, mark it as "Not Found" rather than leaving it blank.
      
      RESPONSE FORMAT: Provide the data in JSON with:
      {
        "columns": ["Metric", "Value", "Year", "Notes"],
        "rows": [
          ["Metric Name 1", "Value 1", "Period 1", "Any notes about this data point"],
          ["Metric Name 2", "Value 2", "Period 2", "Any notes about this data point"]
        ]
      }
      
      If the data exists in a time series, include multiple years in columns instead.
      `;

      const result = await model.generateContent({
        prompt,
        generationConfig: { temperature: 0 }
      });
      
      const rawResponse = result.response.text();
      console.log("Raw metrics response:", rawResponse);
      
      // Process the model response with better error handling
      const processedResponse = processModelResponse(rawResponse);
      response.query = processedResponse.data;
    }

    if (query) {
      // Build a prompt focused on the user's specific query
      const prompt = `
      You are a financial data extraction specialist for investment analysts.
      
      TASK: Answer a specific query about financial data from a company report.
      
      PDF CONTENT: ${pdfText.substring(0, 25000)}
      
      USER QUERY: ${query}
      
      INSTRUCTIONS:
      1. Focus specifically on answering the user query with precise data from the document.
      2. Search for relevant information in tables, text, footnotes, and graphs described in text.
      3. When presenting financial data, always include the time period it represents.
      4. If data appears in multiple places, use the most detailed or recent instance.
      5. If requested data is not found, clearly state this rather than making assumptions.
      
      RESPONSE FORMAT: Provide the data in JSON with:
      {
        "columns": ["Appropriate Column Headers Based on Query"],
        "rows": [["Data Row 1"], ["Data Row 2"]]
      }
      
      If the query is general and doesn't fit tabular format, respond with:
      {
        "text": "Your detailed answer here"
      }
      `;

      const result = await model.generateContent(
        (prompt.toString()),
       
      );
      console.log("1");
      
      const rawResponse = result.response.text();
      console.log("Raw query response:", rawResponse);
      
      // Process the model response
      const processedResponse = processModelResponse(rawResponse);
      response.query = processedResponse.data;
    }

    const finalResponse = {
      data: [response],
      query: query || null,
      metrics: selectedMetrics.length > 0 ? selectedMetrics : null,
    };

    console.log("Final response structure:", JSON.stringify(finalResponse, null, 2));
    
    // Clean up the uploaded file
    fs.unlinkSync(filePath);

    res.json(finalResponse);
  } catch (error) {
    console.error("Error processing request:", error);
    
    // Clean up the uploaded file if it exists
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error("Error deleting uploaded file:", unlinkError);
      }
    }
    
    res.status(500).send("Error processing the file: " + error.message);
  }
});

// Helper function to process model responses
function processModelResponse(rawResponse) {
  try {
    // Clean up the response
    const cleanResponse = rawResponse
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    
    // Try to parse as JSON
    try {
      const jsonResponse = JSON.parse(cleanResponse);
      
      // Validate the expected structure
      if (jsonResponse.columns && Array.isArray(jsonResponse.columns) && 
          jsonResponse.rows && Array.isArray(jsonResponse.rows)) {
        return { success: true, data: jsonResponse };
      } else if (jsonResponse.text) {
        return { success: true, data: jsonResponse };
      } else {
        // Has JSON but incorrect structure
        return { 
          success: false, 
          data: { text: "The data couldn't be structured properly. Raw extraction results: " + cleanResponse }
        };
      }
    } catch (e) {
      // Not valid JSON, return as text
      return { 
        success: true, 
        data: { text: cleanResponse }
      };
    }
  } catch (error) {
    console.error("Error processing model response:", error);
    return { 
      success: false, 
      data: { text: "Failed to process the response from the AI model." }
    };
  }
}

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
  const t0 = Date.now();
  try {
    if (!req.files || req.files.length !== 2) {
      return res.status(400).json({ error: "Please upload exactly two PDFs." });
    }
    
    const file1Path = req.files[0].path;
    const file2Path = req.files[1].path;
    const pdfBuffer1 = fs.readFileSync(file1Path);
    const pdfBuffer2 = fs.readFileSync(file2Path);
    const pdfData1 = await pdfParse(pdfBuffer1);
    const pdfData2 = await pdfParse(pdfBuffer2);
    
    // Check if this is a query-based comparison
    const { metrics, query, type } = req.body;
    let prompt;
    
    if (type === "query" && query) {
      // Handle query-based comparison
      prompt = `
        PDF 1 Content: ${pdfData1.text}
        
        PDF 2 Content: ${pdfData2.text}
        
        Instruction: ${query} 
        
        Compare these two investor decks based on the query above. Return a JSON object with:
        1. "comparison": A detailed analysis addressing the query.
        2. "table1": Relevant extracted data from PDF 1 in JSON format.
        3. "table2": Relevant extracted data from PDF 2 in JSON format.
      `;
    } else {
      // Handle metrics-based comparison (existing functionality)
      const selectedMetrics = metrics ? JSON.parse(metrics) : null;
      let metricInstruction = "";
      
      if (selectedMetrics && selectedMetrics.length > 0) {
        metricInstruction = `Only extract and compare the following metrics: ${selectedMetrics.join(
          ", "
        )}.`;
      } else {
        metricInstruction = "Extract and compare all available financial data.";
      }
      
      prompt = `
        PDF 1 Content: ${pdfData1.text}
        
        PDF 2 Content: ${pdfData2.text}
        
        Instruction: Extract the financial data from both PDFs and compare them.${metricInstruction} Return a JSON object with:
        1. "differences": A description of the differences.
        2. "table1": Extracted data from PDF 1 in JSON format.
        3. "table2": Extracted data from PDF 2 in JSON format.
      `;
    }
    
    const t2 = Date.now();
    const result = await model.generateContent(prompt);
    console.log("AI generateContent time:", Date.now() - t2, "ms");
    
    const rawResponse = result.response.text();
    console.log("Raw AI Response:", rawResponse);
    
    const t3 = Date.now();
    // Cleaning AI response properly
    let cleanedResponse = rawResponse
      .replace(/```json/g, "") // Remove markdown json start
      .replace(/```/g, "") // Remove markdown json end
      .trim();
    
    // Fix trailing commas that break JSON parsing
    cleanedResponse = cleanedResponse
      .replace(/,\s*}/g, "}")
      .replace(/,\s*]/g, "]");
    console.log(cleanedResponse, "post clean");
    
    // JSON validation function
    function isValidJson(str) {
      try {
        JSON.parse(str);
        return true;
      } catch (e) {
        return false;
      }
    }
    console.log("Cleaning & parse time:", Date.now() - t3, "ms");
    
    function normalizeKey(key) {
      return key
        .toLowerCase()
        .replace(/\(.*?\)/g, "")
        .trim();
    }
    
    try {
      const t4 = Date.now();
      if (isValidJson(cleanedResponse)) {
        let jsonResponse = JSON.parse(cleanedResponse);
        
        // For metrics-based comparison, filter metrics if needed
        if (type !== "query" && metrics) {
          const selectedMetrics = JSON.parse(metrics);
          if (selectedMetrics && selectedMetrics.length > 0) {
            const normalizedMetrics = selectedMetrics.map(normalizeKey);
            
            ["table1", "table2"].forEach((tableKey) => {
              if (jsonResponse[tableKey]) {
                jsonResponse[tableKey] = Object.fromEntries(
                  Object.entries(jsonResponse[tableKey]).filter(
                    ([key, value]) => {
                      const normalizedKey = normalizeKey(key);
                      const shouldInclude =
                        normalizedMetrics.includes(normalizedKey);
                      if (!shouldInclude) {
                        console.warn(
                          `Metric "${key}" was removed because it wasn't in selectedMetrics`
                        );
                      }
                      return shouldInclude;
                    }
                  )
                );
              }
            });
          }
        }
        
        console.log("Total time:", Date.now() - t0, "ms");
        console.log(jsonResponse, "last");
        res.json(jsonResponse);
      } else {
        console.error("Invalid JSON format after cleaning:", cleanedResponse);
        console.log("Total handler time (error):", Date.now() - t0, "ms");
        res
          .status(500)
          .json({ error: "AI model returned invalid JSON format." });
      }
    } catch (error) {
      console.error("Error parsing JSON:", error, "Response:", cleanedResponse);
      res.status(500).json({ error: "Error processing JSON response." });
    }
  } catch (error) {
    console.error("Error processing the comparison:", error);
    res.status(500).json({ error: "Error processing the file." });
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

const mockCompanyData = {
  TCS: {
    ppts: [
      {
        title: "TCS Q3 2024 Earnings Report",
        link: "https://example.com/tcs-q3-2024.pdf",
        date: "Jan 12, 2024",
      },
      {
        title: "TCS Annual Report 2023",
        link: "https://example.com/tcs-annual-2023.pdf",
        date: "Apr 15, 2023",
      },
    ],
  },
  INFY: {
    ppts: [
      {
        title: "Infosys Q3 2024 Earnings Report",
        link: "https://example.com/infy-q3-2024.pdf",
        date: "Jan 14, 2024",
      },
    ],
  },
};

// Mock API endpoint for company reports search
app.get("/api/getFakeCompanyReports", (req, res) => {
  const { companyName } = req.query;

  // Simulate API delay
  setTimeout(() => {
    const reports = mockCompanyData[companyName.toUpperCase()] || { ppts: [] };
    res.json({ reports });
  }, 500);
});

// API endpoint to process a PDF from a URL
// In your backend process-pdf-url endpoint
app.post("/process-pdf-url", async (req, res) => {
  try {
    const { pdfUrl, queryType, metrics, query } = req.body;
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const tempFilePath = path.join(tempDir, `temp-${Date.now()}.pdf`);

    const response = await axios({
      url: pdfUrl,
      method: "GET",
      responseType: "arraybuffer",
    });
    console.log(response, "first");

    await writeFileAsync(tempFilePath, Buffer.from(response.data));

    const results = await model.generateContent(
      tempFilePath,
      queryType,
      metrics,
      query
    );
    console.log(results);

    // Clean up temporary file
    await unlinkAsync(tempFilePath);

    // Return results
    res.json(results);
  } catch (error) {
    console.error("Error processing PDF from URL:", error);
    res.status(500).json({ error: "Error processing the PDF" });
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
