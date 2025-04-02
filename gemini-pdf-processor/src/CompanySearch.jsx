import React, { useState } from "react";
import axios from "axios";

const CompanyReports = () => {
  const [companyName, setCompanyName] = useState("");
  const [reports, setReports] = useState({
    transcripts: [],
    notes: [],
    ppts: [],
    recordings: [],
  });
  const [error, setError] = useState("");

  const handleSearch = async () => {
    setError("");
    try {
      const response = await axios.get(
        `http://localhost:5000/api/getCompanyReports?companyName=${companyName}`
      );
      setReports(response.data.reports);
      console.log(response);
    } catch (err) {
      setError("Error fetching reports. Please try again.");
    }
  };

  return (
    <div
      style={{
        maxWidth: "800px",
        margin: "auto",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1 style={{ textAlign: "center", color: "#333" }}>
        Search Company Reports
      </h1>

      {/* Search Box */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Enter Company Ticker (e.g., TCS)"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          style={{
            flex: 1,
            padding: "10px",
            fontSize: "16px",
            borderRadius: "5px",
            border: "1px solid #ccc",
          }}
        />
        <button
          onClick={handleSearch}
          style={{
            padding: "10px 15px",
            fontSize: "16px",
            backgroundColor: "#007bff",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Search
        </button>
      </div>

      {error && (
        <div
          style={{ color: "red", textAlign: "center", marginBottom: "15px" }}
        >
          {error}
        </div>
      )}

      {["ppts"].map((category) =>
        reports[category].length > 0 ? (
          <div key={category} style={{ marginBottom: "20px" }}>
            <h2
              style={{
                textAlign: "left",
                color: "#007bff",
                textTransform: "capitalize",
                borderBottom: "2px solid #007bff",
                paddingBottom: "5px",
                marginBottom: "10px",
              }}
            >
              {category}
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: "10px",
                backgroundColor: "#f9f9f9",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #ddd",
              }}
            >
              {reports[category].map((report, index) => {
                // Highlight the first report (newest)
                const isMainPDF = index === 0;

                return (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px",
                      borderRadius: "5px",
                      backgroundColor: isMainPDF ? "#ffeb3b" : "#fff",
                      border: isMainPDF
                        ? "2px solid #fbc02d"
                        : "1px solid #ddd",
                    }}
                  >
                    <span style={{ fontSize: "16px", color: "#555" }}>
                      📅 Reports
                    </span>
                    <a
                      href={report.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: "5px 10px",
                        backgroundColor: "#28a745",
                        color: "#fff",
                        textDecoration: "none",
                        borderRadius: "5px",
                        textAlign: "center",
                        fontSize: "14px",
                        fontWeight: isMainPDF ? "bold" : "normal",
                      }}
                    >
                      🔗 {isMainPDF ? "🔹 Mostly Latest 🔹" : "Open Report"}
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null
      )}
    </div>
  );
};

export default CompanyReports;
