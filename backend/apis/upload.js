const multer = require("multer");
const pdfParse = require("pdf-parse");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const apikey = process.env.API_KEY;
const upload = multer({ storage: multer.memoryStorage() });
const genAI = new GoogleGenerativeAI(apikey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

let extractedDataCache = null;

module.exports = (req, res) => {
  
  upload.single("file")(req, res, async (err) => {
    if (err) {
      return res.status(500).send("Error uploading file.");
    }

    res.setHeader(
      "Access-Control-Allow-Origin",
      "https://pdf-data-xlwv.vercel.app"
    );
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );

    try {
      const fileBuffer = req.file.buffer;
      const query = req.body.query;

      const pdfData = await pdfParse(fileBuffer);

      const prompt = `
      PDF Content: ${pdfData.text}

      User Query: ${query}

      Instruction: Extract the financial data from the PDF content provided. Present the extracted data in a JSON format with two keys:
      1. "columns": An array of column names for the table.
      2. "rows": A 2D array where each sub-array represents a row of data.
      `;

      const result = await model.generateContent(prompt);

      
      const rawResponse = result.response.text();
      console.log("Raw Model Response:", rawResponse);

      const cleanedResponse = rawResponse
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      const jsonResponse = JSON.parse(cleanedResponse);
      console.log("Parsed JSON Response:", jsonResponse);

      extractedDataCache = jsonResponse;

      res.status(200).json(jsonResponse);
    } catch (error) {
      console.error("Error processing the request:", error);
      res.status(500).send("Error processing the file.");
    }
  });
};
