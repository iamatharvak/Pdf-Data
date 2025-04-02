// PDFUrlProcessor.jsx - Example component demonstrating the URL-based PDF processing

import React, { useState } from "react";
import axios from "axios";

const PDFUrlProcessor = () => {
  // Search related state
  const [companyName, setCompanyName] = useState("");
  const [reports, setReports] = useState([
    {
      title: "Aavas Financiers Q4 FY24 Investor Presentation",
      link: "https://www.aavas.in/uploads/pdf/investorpptq4fy24-1574211333.pdf",
      date: "Apr 2024",
    },
  ]);
  const [searchError, setSearchError] = useState("");

  // Analysis related state
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [queryType, setQueryType] = useState("metrics");
  const [selectedMetrics, setSelectedMetrics] = useState([]);
  const [query, setQuery] = useState("");
  const [analysisResults, setAnalysisResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState("");

  // Available metrics (simplified from your actual list)
  const availableMetrics = [
    "ROA",
    "ROE",
    "PAT",
    "GNPA",
    "NNPA",
    "Yield",
    "Number of Branches",
  ];

  // Handle company search
  const handleSearch = async () => {
    setSearchError("");
    setReports([]);

    try {
      // This would call your web scraping API
      const response = await axios.get(
        `http://localhost:5000/api/getFakeCompanyReports?companyName=${companyName}`
      );

      // Simplified reports structure
      setReports(response.data.reports.ppts || []);
    } catch (err) {
      setSearchError("Error fetching reports. Please try again.");
    }
  };

  // Select a PDF for analysis
  const handleSelectPdf = (pdfUrl, pdfTitle) => {
    setSelectedPdf({
      url: pdfUrl,
      title: pdfTitle,
    });
    setAnalysisResults(null);
  };

  // Handle metric selection
  const handleMetricChange = (metric) => {
    if (selectedMetrics.includes(metric)) {
      setSelectedMetrics(selectedMetrics.filter((m) => m !== metric));
    } else {
      setSelectedMetrics([...selectedMetrics, metric]);
    }
  };

  // Process the selected PDF
  const handleProcessPdf = async () => {
    if (!selectedPdf) {
      setAnalysisError("Please select a PDF first");
      return;
    }

    if (queryType === "metrics" && selectedMetrics.length === 0) {
      setAnalysisError("Please select at least one metric");
      return;
    }

    if (queryType === "query" && !query.trim()) {
      setAnalysisError("Please enter a query");
      return;
    }

    setLoading(true);
    setAnalysisError("");

    try {
      // This would be your endpoint that processes PDFs by URL
      const response = await axios.post(
        "http://localhost:5000/process-pdf-url",
        {
          pdfUrl: selectedPdf.url,
          queryType,
          metrics: queryType === "metrics" ? selectedMetrics : null,
          query: queryType === "query" ? query : null,
        }
      );
      console.log(response);
      setAnalysisResults(response.data);
    } catch (err) {
      setAnalysisError("Error processing the PDF. Please try again.", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "auto",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1 style={{ textAlign: "center", marginBottom: "30px" }}>
        PDF Analysis from Web
      </h1>

      {/* Search Section */}
      <div
        style={{
          marginBottom: "30px",
          padding: "20px",
          backgroundColor: "#f5f5f5",
          borderRadius: "8px",
        }}
      >
        <h2>1. Find Company Reports</h2>
        <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
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

        {searchError && (
          <div style={{ color: "red", marginBottom: "15px" }}>
            {searchError}
          </div>
        )}

        {reports.length > 0 && (
          <div>
            <h3>Available Reports:</h3>
            <div
              style={{
                backgroundColor: "#fff",
                border: "1px solid #ddd",
                borderRadius: "5px",
                padding: "10px",
              }}
            >
              {reports.map((report, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px",
                    borderBottom:
                      index < reports.length - 1 ? "1px solid #eee" : "none",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: "bold" }}>
                      {report.title || `Report ${index + 1}`}
                    </div>
                    <div style={{ fontSize: "14px", color: "#777" }}>
                      {report.date || "No date information"}
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      handleSelectPdf(
                        report.link,
                        report.title || `Report ${index + 1}`
                      )
                    }
                    style={{
                      padding: "8px 15px",
                      backgroundColor:
                        selectedPdf?.url === report.link
                          ? "#28a745"
                          : "#6c757d",
                      color: "#fff",
                      border: "none",
                      borderRadius: "5px",
                      cursor: "pointer",
                    }}
                  >
                    {selectedPdf?.url === report.link
                      ? "Selected ✓"
                      : "Select for Analysis"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Analysis Section */}
      {selectedPdf && (
        <div
          style={{
            marginBottom: "30px",
            padding: "20px",
            backgroundColor: "#f0f7ff",
            borderRadius: "8px",
          }}
        >
          <h2>2. Analyze Selected PDF</h2>
          <div style={{ marginBottom: "15px" }}>
            <div>
              <strong>Selected Report:</strong> {selectedPdf.title}
            </div>
            <div style={{ fontSize: "14px", wordBreak: "break-all" }}>
              <strong>URL:</strong> {selectedPdf.url}
            </div>
          </div>

          {/* Query Type Selection */}
          <div style={{ marginBottom: "15px" }}>
            <div style={{ marginBottom: "10px" }}>
              <strong>Analysis Method:</strong>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => setQueryType("metrics")}
                style={{
                  padding: "8px 15px",
                  backgroundColor:
                    queryType === "metrics" ? "#007bff" : "#e9ecef",
                  color: queryType === "metrics" ? "#fff" : "#000",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
              >
                Select Metrics
              </button>
              <button
                onClick={() => setQueryType("query")}
                style={{
                  padding: "8px 15px",
                  backgroundColor:
                    queryType === "query" ? "#007bff" : "#e9ecef",
                  color: queryType === "query" ? "#fff" : "#000",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
              >
                Enter Query
              </button>
            </div>
          </div>

          {/* Metrics Selection */}
          {queryType === "metrics" && (
            <div style={{ marginBottom: "15px" }}>
              <div style={{ marginBottom: "10px" }}>
                <strong>Select Metrics:</strong>
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "10px",
                  backgroundColor: "#fff",
                  padding: "15px",
                  borderRadius: "5px",
                  border: "1px solid #ddd",
                }}
              >
                {availableMetrics.map((metric, index) => (
                  <label
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedMetrics.includes(metric)}
                      onChange={() => handleMetricChange(metric)}
                      style={{ marginRight: "5px" }}
                    />
                    {metric}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Query Input */}
          {queryType === "query" && (
            <div style={{ marginBottom: "15px" }}>
              <div style={{ marginBottom: "10px" }}>
                <strong>Enter Query:</strong>
              </div>
              <input
                type="text"
                placeholder="e.g., What are the company's expenses in 2023?"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  fontSize: "16px",
                  borderRadius: "5px",
                  border: "1px solid #ccc",
                }}
              />
            </div>
          )}

          {/* Process Button */}
          <button
            onClick={handleProcessPdf}
            disabled={loading}
            style={{
              padding: "10px 15px",
              fontSize: "16px",
              backgroundColor: "#28a745",
              color: "#fff",
              border: "none",
              borderRadius: "5px",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {loading ? "Processing..." : "Process PDF"}
          </button>

          {analysisError && (
            <div style={{ color: "red", marginTop: "15px" }}>
              {analysisError}
            </div>
          )}
        </div>
      )}

      {/* Results Section */}
      {analysisResults && (
        <div
          style={{
            padding: "20px",
            backgroundColor: "#f5fff5",
            borderRadius: "8px",
          }}
        >
          <h2>3. Analysis Results</h2>

          {/* Sample table for demonstration */}
          <div
            style={{
              backgroundColor: "#fff",
              border: "1px solid #ddd",
              borderRadius: "5px",
              padding: "15px",
              overflowX: "auto",
            }}
          >
            {analysisResults.data && analysisResults.data.length > 0 ? (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {analysisResults.data[0].query.columns.map(
                      (column, index) => (
                        <th
                          key={index}
                          style={{
                            border: "1px solid #ddd",
                            padding: "8px",
                            backgroundColor: "#f2f2f2",
                          }}
                        >
                          {column}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {analysisResults.data[0].query.rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <td
                          key={cellIndex}
                          style={{ border: "1px solid #ddd", padding: "8px" }}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div>
                {analysisResults.data ? (
                  <p>{analysisResults.data.response}</p>
                ) : (
                  <p>No data available in the results</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFUrlProcessor;
