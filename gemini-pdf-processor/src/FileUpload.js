import React, { useState } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Typography,
  TextField,
  CircularProgress,
  Alert,
  Snackbar,
  List,
  ListItem,
  IconButton,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

const FileUpload = () => {
  const [files, setFiles] = useState([]);
  const [selectedMetrics, setSelectedMetrics] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [tableData, setTableData] = useState(null);
  const [metricsdata, setMetricsdata] = useState(null);
  const [comparedata, setCompareData] = useState(null);

  const metrics = [
    "AUM",
    "Disbursement Value",
    "Total Income",
    "NIM (Net Interest Margin)",
    "Profit After Tax (PAT)",
    "ROA (Return on Assets)",
    "ROE (Return on Equity)",
    "Operating Expenses",
    "GNPA & NNPA (%)",
    "DPD Buckets (30, 60, 90+)",
    "Provision Coverage Ratio (PCR)",
    "Write-offs (%)",
  ];

  const handleFileChange = (event) => {
    if (files.length < 2) {
      setFiles([...files, event.target.files[0]]);
    }
  };

  const handleRemoveFiles = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleMetricChange = (event) => {
    const { value, checked } = event.target;
    setSelectedMetrics((prev) =>
      checked ? [...prev, value] : prev.filter((metric) => metric !== value)
    );
  };

  const handleUpload = async () => {
    if (files.length === 0 || selectedMetrics.length === 0) {
      setError("Please upload a PDF and select metrics.");
      return;
    }

    const formData = new FormData();
    formData.append("file", files[0]);
    formData.append("metrics", JSON.stringify(selectedMetrics));

    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:5000/upload",
        formData
      );
      console.log("here", response);
      setTableData(response.data.table);
      setMetricsdata(response.data.metrics);
      setSnackbarMessage("File uploaded successfully!");
    } catch (error) {
      setSnackbarMessage("Error processing file. Try again.");
    } finally {
      setOpenSnackbar(true);
      setLoading(false);
    }
  };

  const handleCompare = async () => {
    if (files.length !== 2) {
      setError("Upload exactly two PDFs for comparison.");
      return;
    }

    const formData = new FormData();
    files.forEach((file) => formData.append("file", file));

    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:5000/compare",
        formData
      );
      const { differences, table1, table2 } = response.data;
      setCompareData({ differences, table1, table2 });
      setSnackbarMessage("Comparison successful!");
    } catch (error) {
      setSnackbarMessage("Error comparing PDFs. Try again.");
    } finally {
      setOpenSnackbar(true);
      setLoading(false);
    }
  };

  const renderParagraph = () => {
    if (tableData && tableData.paragraph) {
      return <pre>{tableData.paragraph}</pre>;
    }
    return null;
  };

  const renderTable = () => {
    if (!tableData || !tableData.columns || !tableData.rows) return null;

    const { columns, rows } = tableData;

    return (
      <table border="1">
        <thead>
          <tr>
            {columns.map((col, index) => (
              <th key={index}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
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
    <Box
      sx={{
        maxWidth: 600,
        margin: "0 auto",
        padding: "20px",
        backgroundColor: "#fff",
        borderRadius: "8px",
        boxShadow: 2,
      }}
    >
      <Typography variant="h4" align="center" sx={{ marginBottom: 3 }}>
        Upload & Query PDFs
      </Typography>

      <input
        type="file"
        onChange={handleFileChange}
        accept=".pdf"
        style={{ display: "none" }}
        id="fileInput"
      />
      <label htmlFor="fileInput">
        <Button variant="contained" component="span" fullWidth>
          Upload PDF
        </Button>
      </label>

      {files.length > 0 && (
        <List>
          {files.map((file, index) => (
            <ListItem
              key={index}
              secondaryAction={
                <IconButton edge="end" onClick={() => handleRemoveFiles(index)}>
                  <DeleteIcon />
                </IconButton>
              }
            >
              {file.name}
            </ListItem>
          ))}
        </List>
      )}

      {files.length === 1 && (
        <>
          <Typography variant="h6" sx={{ marginTop: 2 }}>
            Select Financial Metrics:
          </Typography>
          <Box sx={{ marginBottom: 2 }}>
            {metrics.map((metric, index) => (
              <FormControlLabel
                key={index}
                control={
                  <Checkbox
                    value={metric}
                    checked={selectedMetrics.includes(metric)}
                    onChange={handleMetricChange}
                  />
                }
                label={metric}
              />
            ))}
          </Box>

          <Button
            variant="contained"
            color="primary"
            onClick={handleUpload}
            fullWidth
            disabled={loading || selectedMetrics.length === 0}
            sx={{ marginTop: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : "Upload & Query"}
          </Button>
        </>
      )}

      {files.length === 2 && (
        <Button
          variant="contained"
          color="secondary"
          onClick={handleCompare}
          fullWidth
          disabled={loading}
          sx={{ marginTop: 2 }}
        >
          {loading ? <CircularProgress size={24} /> : "Compare PDFs"}
        </Button>
      )}

      {error && (
        <Alert severity="error" sx={{ marginTop: 2 }}>
          {error}
        </Alert>
      )}

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
      >
        <Alert
          onClose={() => setOpenSnackbar(false)}
          severity={error ? "error" : "success"}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {tableData ? (
        <>
          {renderTable()}
          {renderParagraph()}
          <button onClick={""}>Download Excel</button>
        </>
      ) : (
        <p>No data to display</p>
      )}

      {comparedata && (
        <>
          <div>
            <h3>Differences:</h3>
            <pre>{comparedata.differences}</pre>
            <h3>Table 1 Data:</h3>
            <pre>{JSON.stringify(comparedata.table1, null, 2)}</pre>
            <h3>Table 2 Data:</h3>
            <pre>{JSON.stringify(comparedata.table2, null, 2)}</pre>
          </div>
        </>
      )}

      {metricsdata && selectedMetrics.length > 0 && (
        <>
          <div>
            <h4>Selected Metrics Data:</h4>
            <ul>
              {selectedMetrics.map((metric) => {
                if (metricsdata[metric]) {
                  return (
                    <li key={metric}>
                      <strong>{metric}: </strong>
                      {metricsdata[metric]}
                    </li>
                  );
                }
                return null;
              })}
            </ul>
          </div>
        </>
      )}
    </Box>
  );
};

export default FileUpload;
