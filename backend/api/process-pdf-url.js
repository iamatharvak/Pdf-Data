const axios = require("axios");
const pdfParse = require("pdf-parse");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const apikey = "AIzaSyA6UhfFNNaZm0QCKbMdm4V6-T8cHyU8wX4";
const genAI = new GoogleGenerativeAI(apikey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const { pdfUrl, queryType, metrics, query } = req.body;

    if (!pdfUrl) {
      return res.status(400).json({ error: "PDF URL is required." });
    }

    // 1️⃣ Download PDF from the URL
    const response = await axios({
      url: pdfUrl,
      method: "GET",
      responseType: "arraybuffer",
    });

    // 2️⃣ Extract text from the PDF
    const pdfData = await pdfParse(Buffer.from(response.data));

    // 3️⃣ Send extracted text to Gemini API
    const prompt = `
      PDF Content: ${pdfData.text}
      
      Instruction:
      - Query Type: ${queryType}
      - Metrics: ${metrics}
      - Query: ${query}
      
      Extract relevant financial insights based on the provided query.
      Return a JSON object with structured data.
    `;

    const result = await model.generateContent(prompt);
    const rawResponse = result.response
      .text()
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    try {
      const jsonResponse = JSON.parse(rawResponse);
      return res.json(jsonResponse);
    } catch (error) {
      console.error("Error parsing JSON:", error);
      return res.status(500).json({ error: "Error processing the response." });
    }
  } catch (error) {
    console.error("Error processing PDF from URL:", error);
    return res.status(500).json({ error: "Error processing the PDF" });
  }
};
