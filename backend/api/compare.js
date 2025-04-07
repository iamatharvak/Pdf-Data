const multer = require("multer");
const pdfParse = require("pdf-parse");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();
const cors = require("cors");

const apikey = "AIzaSyA6UhfFNNaZm0QCKbMdm4V6-T8cHyU8wX4";
const upload = multer({ storage: multer.memoryStorage() });
const genAI = new GoogleGenerativeAI(apikey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const allowedOrigins = [
  "https://pdf-data-xlwv.vercel.app",
  "http://localhost:3000",
];

module.exports = async (req, res) => {
  console.log("Incoming request from:", req.headers.origin);
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

  upload.array("file", 2)(req, res, async (err) => {
    if (err) {
      console.error("Multer error:", err);
      return res.status(500).send("Error uploading files.");
    }

    try {
      if (!req.files || req.files.length !== 2) {
        const t1 = Date.now();
        console.log("PDF parse time:", Date.now() - t1, "ms");
        return res
          .status(400)
          .json({ error: "Please upload exactly two PDFs." });
      }
      const { metrics } = req.body;
      const selectedMetrics = metrics ? JSON.parse(metrics) : null;
      const file1Path = req.files[0].path;
      const file2Path = req.files[1].path;

      const pdfBuffer1 = fs.readFileSync(file1Path);
      const pdfBuffer2 = fs.readFileSync(file2Path);

      const pdfData1 = await pdfParse(pdfBuffer1);
      const pdfData2 = await pdfParse(pdfBuffer2);

      let metricInstruction = "";
      if (selectedMetrics && selectedMetrics.length > 0) {
        metricInstruction = `Only extract and compare the following metrics: ${selectedMetrics.join(
          ", "
        )}.`;
      } else {
        metricInstruction = "Extract and compare all available financial data.";
      }

      const prompt = `
          PDF 1 Content: ${pdfData1.text}
          
          PDF 2 Content: ${pdfData2.text}
          
          Instruction: Extract the financial data from both PDFs and compare them.${metricInstruction} Return a JSON object with:
          1. "differences": A description of the differences.
          2. "table1": Extracted data from PDF 1 in JSON format.
          3. "table2": Extracted data from PDF 2 in JSON format.
        `;
      const t2 = Date.now();
      const result = await model.generateContent(prompt);
      console.log("AI generateContent time:", Date.now() - t2, "ms");
      console.log("AI Response:", result.response);

      const rawResponse = result.response.text();
      console.log("Raw AI Response:", rawResponse);

      const t3 = Date.now();

      let cleanedResponse = rawResponse
        .replace(/```json/g, "") // Remove markdown json start
        .replace(/```/g, "") // Remove markdown json end
        .trim();

      cleanedResponse = cleanedResponse
        .replace(/,\s*}/g, "}")
        .replace(/,\s*]/g, "]");
      console.log(cleanedResponse, "post clean");

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
        console.error(
          "Error parsing JSON:",
          error,
          "Response:",
          cleanedResponse
        );
        res.status(500).json({ error: "Error processing JSON response." });
      }
    } catch (error) {
      console.error("Error processing the comparison:", error);
      res.status(500).json({ error: "Error processing the file." });
    }
  });
};
