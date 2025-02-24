const multer = require("multer");
const pdfParse = require("pdf-parse");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();
const cors = require("cors");

const apikey = "AIzaSyA6UhfFNNaZm0QCKbMdm4V6-T8cHyU8wX4";
const upload = multer({ storage: multer.memoryStorage() });
const genAI = new GoogleGenerativeAI(apikey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

let extractedDataCache = null;
const allowedOrigins = [
  "https://pdf-data-xlwv.vercel.app",
  "http://localhost:3000",
];
// const corsOptions = {
//   origin: allowedOrigins,
//   methods: ["GET", "POST", "OPTIONS"],
//   allowedHeaders: ["Content-Type"],
// };
module.exports = async (req, res) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  upload.array("file")(req, res, async (err) => {
    if (err) {
      console.error("Multer error:", err);
      return res.status(500).send("Error uploading files.");
    }

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

      const pdfBuffer = req.file.buffer;
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
      console.error("Error processing request:", error);
      res.status(500).send("Error processing the file.");
    }
  });
};
