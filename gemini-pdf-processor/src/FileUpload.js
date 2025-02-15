import React, { useState } from "react";
import axios from "axios";

const FileUpload = () => {
  const [tableData, setTableData] = useState([]);
  const [files, setFiles] = useState([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");

  const handleFileChange = (event) => {
    const newFiles = Array.from(event.target.files); // Convert FileList to array
    setFiles((prevFiles) => [...prevFiles, ...newFiles]); // Keep existing files and add new ones
  };

  const handleQueryChange = (event) => setQuery(event.target.value);

  const removeFile = (index) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0 || !query) {
      setError("Please upload at least one file and enter a query!");
      return;
    }

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    formData.append("query", query);

    try {
      const response = await axios.post(
        "https://pdf-data-mocha.vercel.app/api/upload",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setTableData(response.data);
      setSubmittedQuery(query); // Save submitted query
      setError("");
    } catch (error) {
      console.error("Error uploading file:", error);
      setError("Error processing the files. Please try again.");
    }
  };

  const handleDownload = async () => {
    if (!tableData.length) {
      setError(
        "No data available for download. Please upload and query files first."
      );
      return;
    }

    try {
      const response = await axios.get(
        "https://pdf-data-mocha.vercel.app/api/download",
        { responseType: "blob" }
      );

      if (response.status === 200 && response.data) {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "data.xlsx");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        throw new Error("No data available for download");
      }
    } catch (error) {
      console.error("Error downloading the file:", error);
      setError("Error downloading the Excel file.");
    }
  };

  const renderTables = () => {
    if (!tableData.length) return null;

    return tableData.map((data, index) => (
      <div key={index} style={{ marginBottom: "20px" }}>
        <h3>Extracted Data from PDF {index + 1}</h3>
        <table border="1">
          <thead>
            <tr>
              {data.columns.map((col, i) => (
                <th key={i}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ));
  };

  return (
    <div>
      <h2>Upload PDFs and Query Financial Data</h2>

      {/* File Upload Section */}
      <div>
        <label htmlFor="fileInput">Upload Files:</label>
        <input
          id="fileInput"
          type="file"
          multiple
          onChange={handleFileChange}
          accept=".pdf"
          style={{ display: "none" }}
        />
        <button onClick={() => document.getElementById("fileInput").click()}>
          Add File
        </button>
      </div>

      {/* Show Uploaded Files */}
      {files.length > 0 && (
        <div>
          <h4>Uploaded Files:</h4>
          <ul>
            {files.map((file, index) => (
              <li key={index}>
                {file.name}{" "}
                <button onClick={() => removeFile(index)}>Remove</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Query Input */}
      <div>
        <label htmlFor="queryInput">Enter Query:</label>
        <input
          id="queryInput"
          type="text"
          placeholder="Enter your query"
          value={query}
          onChange={handleQueryChange}
        />
      </div>

      <button onClick={handleUpload}>Upload and Query</button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Display Query Information Box */}
      {submittedQuery && (
        <div style={{ border: "1px solid #ccc", padding: "10px", margin: "20px 0" }}>
          <h3>Query Information</h3>
          <p><strong>Your Query:</strong> {submittedQuery}</p>
        </div>
      )}

      {/* Render Extracted Data Tables */}
      {tableData.length ? (
        <>
          {renderTables()}
          <button onClick={handleDownload}>Download Excel</button>
        </>
      ) : (
        <p>No data to display</p>
      )}
    </div>
  );
};

export default FileUpload;
