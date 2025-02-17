import React, { useState } from "react";
import axios from "axios";

const FileUpload = () => {
  const [files, setFiles] = useState([]);
  const [tableData, setTableData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => setFiles(Array.from(e.target.files));

  const handleUpload = async () => {
    if (!files.length) return alert("Please select a file");
    setLoading(true);

    const formData = new FormData();
    files.forEach((file) => formData.append("file", file));

    try {
      const response = await axios.post(
        "http://localhost:5000/upload",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setTableData(response.data.extractedData);
    } catch (error) {
      console.error("Upload Error:", error);
      alert("File upload failed");
    }
    setLoading(false);
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} multiple />
      <button onClick={handleUpload} disabled={loading}>
        {loading ? "Uploading..." : "Upload & Extract"}
      </button>
      {tableData && (
        <div>
          <h3>Extracted Data:</h3>
          <pre>{JSON.stringify(tableData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
