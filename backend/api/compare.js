const multer = require("multer");
const pdfParse = require("pdf-parse");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const upload = multer({ storage: multer.memoryStorage() });
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash " });

const allowedOrigins = [
  "https://pdf-data-xlwv.vercel.app",
  "http://localhost:3000",
];

module.exports = async (req, res) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  upload.array("file", 2)(req, res, async (err) => {
    if (err) {
      console.error("Multer error:", err);
      return res.status(500).send("Error uploading files.");
    }

    try {
      if (!req.files || req.files.length !== 2) {
        return res.status(400).send("Please upload exactly two PDFs.");
      }

      const pdfData1 = await pdfParse(req.files[0].buffer);
      const pdfData2 = await pdfParse(req.files[1].buffer);

      const prompt = `
        PDF 1 Content: ${pdfData1.text}
        PDF 2 Content: ${pdfData2.text}
        
        Instruction: Extract the financial data from both PDFs and compare them. Return a JSON object with:
        1. "differences": A description of the differences.
        2. "table1": Extracted data from PDF 1 in JSON format.
        3. "table2": Extracted data from PDF 2 in JSON format.
      `;

      const result = await model.generateContent(prompt);
      const rawResponse = result.response
        .text()
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      try {
        const jsonResponse = JSON.parse(rawResponse);
        res.json(jsonResponse);
      } catch (error) {
        console.error("Error parsing JSON:", error);
        res.status(500).send("Error processing the file.");
      }
    } catch (error) {
      console.error("Error processing comparison:", error);
      res.status(500).send("Error processing the file.");
    }
  });
};
