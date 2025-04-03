const axios = require("axios");
const cheerio = require("cheerio");

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
};
