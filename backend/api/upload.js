const multer = require("multer");
const pdfParse = require("pdf-parse");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();
const cors = require("cors");

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Define allowed origins
// const allowedOrigins = [
//   "https://pdf-data-xlwv-git-main-v2-iamatharvaks-projects.vercel.app",
//   "http://localhost:3000",
// ];

// const corsOptions = {
//   origin: function (origin, callback) {
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error("Not allowed by CORS"));
//     }
//   },
//   credentials: true,
//   methods: "GET, POST, OPTIONS",
//   allowedHeaders: "Content-Type, Authorization",
// };

// app.use(cors(corsOptions));

// app.options("*", cors(corsOptions));

const apikey = "AIzaSyA6UhfFNNaZm0QCKbMdm4V6-T8cHyU8wX4";
const upload = multer({ storage: multer.memoryStorage() });
const genAI = new GoogleGenerativeAI(apikey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

let extractedDataCache = null;
const allowedOrigins = [
  "https://pdf-data-xlwv-git-main-v2-iamatharvaks-projects.vercel.app",
  "http://localhost:3000",
];
module.exports = (req, res) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  // res.setHeader("Access-Control-Allow-Origin", origin);
  // res.setHeader("Access-Control-Allow-Credentials", "true");

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
      const files = req.files;
      const query = req.body.query;

      if (!query || files.length === 0) {
        return res
          .status(400)
          .send("Query and at least one file are required.");
      }

      const results = [];

      for (const file of files) {
        const pdfData = await pdfParse(file.buffer);

        const prompt = `
        PDF Content: ${pdfData.text}

        User Query: ${query}

        Instruction: Extract the financial data from the PDF content provided. Present the extracted data in a JSON format with two keys:
        1. "columns": An array of column names for the table.
        2. "rows": A 2D array where each sub-array represents a row of data.
        `;

        const result = await model.generateContent(prompt);
        const rawResponse = result.response.text();

        const cleanedResponse = rawResponse
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();

        const jsonResponse = JSON.parse(cleanedResponse);
        results.push(jsonResponse);
      }

      extractedDataCache = results;

      res.status(200).json({ query, data: results });
    } catch (error) {
      console.error("Error processing the request:", error);
      res.status(500).send("Error processing the files.");
    }
  });
};
