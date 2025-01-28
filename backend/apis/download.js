const XLSX = require("xlsx");

let extractedDataCache = null;

module.exports = (req, res) => {
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

    res.send(excelBuffer);
  } catch (error) {
    console.error("Error during download:", error);
    res.status(500).send("Error generating Excel file.");
  }
};
