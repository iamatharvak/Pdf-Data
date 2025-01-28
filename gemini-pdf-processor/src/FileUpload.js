import React, { useState } from "react";
import axios from "axios";

const FileUpload = () => {
  const [tableData, setTableData] = useState(null);
  const [file, setFile] = useState(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  const handleFileChange = (event) => setFile(event.target.files[0]);
  const handleQueryChange = (event) => setQuery(event.target.value);

  const handleUpload = async () => {
    if (!file || !query) {
      setError("Both file upload and query are required!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("query", query);

    try {
      const response = await axios.post(
        "https://pdf-data-mocha.vercel.app/upload",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      console.log("here", response);
      setTableData(response.data);
      setError("");
    } catch (error) {
      console.error("Error uploading file:", error);
      setError("Error processing the file. Please try again.");
    }
  };

  const handleDownload = async () => {
    if (!tableData) {
      setError(
        "No data available for download. Please upload and query a file first."
      );
      return;
    }

    try {
      const response = await axios.get(
        "https://pdf-data-mocha.vercel.app/download",
        {
          responseType: "blob",
        }
      );

      console.log("Response:", response);
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

  const renderTable = () => {
    if (!tableData || !tableData.columns || !tableData.rows) return null;

    return (
      <table border="1">
        <thead>
          <tr>
            {tableData.columns.map((col, index) => (
              <th key={index}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tableData.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div>
      <h2>Upload PDF and Query Financial Data</h2>

      <div>
        <label htmlFor="fileInput">Upload File:</label>
        <input
          id="fileInput"
          type="file"
          onChange={handleFileChange}
          accept=".pdf"
        />
      </div>

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

      {tableData ? (
        <>
          {renderTable()}
          <button onClick={handleDownload}>Download Excel</button>
        </>
      ) : (
        <p>No data to display</p>
      )}
    </div>
  );
};

export default FileUpload;
