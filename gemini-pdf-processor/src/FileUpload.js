import React, { useState } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Snackbar,
  List,
  ListItem,
  IconButton,
  Checkbox,
  FormControlLabel,
  Input,
  ToggleButtonGroup,
  ToggleButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

const handleFileRequest = async (
  url,
  formData,
  setLoading,
  setSnackbarMessage,
  setError,
  setResultData
) => {
  setLoading(true);
  try {
    const response = await axios.post(
      "https://pdf-data-git-main-v2-iamatharvaks-projects.vercel.app/api/upload",
      formData
    );
    setResultData(response.data);
    setSnackbarMessage("Operation successful!");
  } catch (error) {
    setError(error.response?.data || "Error processing file. Try again.");
    setSnackbarMessage("Error processing file. Try again.");
  } finally {
    setLoading(false);
  }
};

const FileUpload = () => {
  const [files, setFiles] = useState([]);
  const [selectedMetrics, setSelectedMetrics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [resultData, setResultData] = useState(null);
  const [query, setQuery] = useState("");
  const [queryType, setQueryType] = useState(null);
  const [selectedYear, setSelectedYear] = useState("");

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

  const handleQueryChange = (event) => {
    setQuery(event.target.value);
  };

  const handleQueryTypeChange = (event, newValue) => {
    if (newValue !== null) {
      setQueryType(newValue);
      if (newValue === "metrics") {
        setQuery("");
      } else if (newValue === "query") {
        setSelectedMetrics([]);
      }
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
    if (files.length === 0) {
      setError("Please upload a PDF.");
      return;
    }
    if (queryType === "metrics" && selectedMetrics.length === 0) {
      setError("Please select at least one metric.");
      return;
    }
    if (queryType === "query" && !query.trim()) {
      setError("Please enter a query.");
      return;
    }

    const formData = new FormData();
    formData.append("file", files[0]);
    if (queryType === "metrics") {
      formData.append("metrics", JSON.stringify(selectedMetrics));
    } else if (queryType === "query") {
      formData.append("query", query);
    }

    handleFileRequest(
      "https://pdf-data-git-main-v2-iamatharvaks-projects.vercel.app/api/upload",
      formData,
      setLoading,
      setSnackbarMessage,
      setError,
      setResultData
    );
  };

  const handleCompare = () => {
    if (files.length !== 2) {
      setError("Upload exactly two PDFs for comparison.");
      return;
    }

    const formData = new FormData();
    files.forEach((file) => formData.append("file", file));

    handleFileRequest(
      "https://pdf-data-git-main-v2-iamatharvaks-projects.vercel.app/compare",
      formData,
      setLoading,
      setSnackbarMessage,
      setError,
      setResultData
    );
  };

  const getUniqueYears = (data) => {
    if (!data || !data.query || !data.query.rows) return [];
    const yearIndex = data.query.columns.indexOf("Year");
    if (yearIndex === -1) return [];
    return [...new Set(data.query.rows.map((row) => row[yearIndex]))];
  };

  const renderTable = (data) => {
    if (!data || (!data.metrics && !data.query))
      return <p>No data available</p>;

    if (data.query) {
      if (data.query.columns && data.query.rows) {
        const yearIndex = data.query.columns.indexOf("Year");
        const filteredRows =
          selectedYear && yearIndex !== -1
            ? data.query.rows.filter((row) => row[yearIndex] === selectedYear)
            : data.query.rows;

        return (
          <div style={{ overflow: "auto" }}>
            <table
              border="1"
              style={{ width: "100%", borderCollapse: "collapse" }}
            >
              <thead>
                <tr>
                  {data.query.columns.map((col, index) => (
                    <th key={index}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      if (data.query.text) {
        return <p>{data.query.text}</p>;
      }
    }

    return <p>No data available</p>;
  };

  const CompareResult = ({ compareData }) => {
    const { differences, table1, table2 } = compareData;
    return (
      <div>
        <h3>Differences:</h3>
        <p>{differences}</p>
        <div style={{ display: "flex", gap: "20px", overflowX: "auto" }}>
          <div style={{ width: "45%" }}>
            <h4>Table 1 Data</h4>
            {table1 ? (
              renderTable({ metrics: table1 })
            ) : (
              <p>No data available for Table 1</p>
            )}
          </div>
          <div style={{ width: "45%" }}>
            <h4>Table 2 Data</h4>
            {table2 ? (
              renderTable({ metrics: table2 })
            ) : (
              <p>No data available for Table 2</p>
            )}
          </div>
        </div>
      </div>
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
          {files.length < 1 ? "Upload PDF" : "Upload More PDF"}
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
            Choose a method to extract data:
          </Typography>

          <ToggleButtonGroup
            value={queryType}
            exclusive
            onChange={handleQueryTypeChange}
            sx={{ marginBottom: 2, display: "flex", justifyContent: "center" }}
          >
            <ToggleButton value="metrics">Select Metrics</ToggleButton>
            <ToggleButton value="query">Enter Query</ToggleButton>
          </ToggleButtonGroup>

          {queryType === "metrics" && (
            <>
              <Typography variant="h6">Select Financial Metrics:</Typography>
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
            </>
          )}

          {queryType === "query" && (
            <>
              <Typography variant="h6">Enter Query:</Typography>
              <Input
                id="queryInput"
                type="text"
                placeholder="e.g., List all expenses"
                value={query}
                onChange={handleQueryChange}
                fullWidth
                sx={{ marginBottom: 2 }}
              />
            </>
          )}

          <Button
            variant="contained"
            color="primary"
            onClick={handleUpload}
            fullWidth
            disabled={
              loading ||
              (queryType === "metrics" && selectedMetrics.length === 0) ||
              (queryType === "query" && !query.trim())
            }
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

      {resultData && files.length === 1 && resultData.data && (
        <Box sx={{ marginTop: 2 }}>
          <Typography variant="h6">Results:</Typography>
          {resultData.data[0].query && resultData.data[0].query.columns && (
            <FormControl fullWidth sx={{ marginBottom: 2 }}>
              <InputLabel id="year-select-label">Select Year</InputLabel>
              <Select
                labelId="year-select-label"
                value={selectedYear}
                label="Select Year"
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                <MenuItem value="">All Years</MenuItem>
                {getUniqueYears(resultData.data[0]).map((year) => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          {renderTable(resultData.data[0])}
        </Box>
      )}
      {resultData && files.length === 2 && (
        <Box sx={{ marginTop: 2 }}>
          <Typography variant="h6">Comparison Results:</Typography>
          <CompareResult compareData={resultData} />
        </Box>
      )}
    </Box>
  );
};

export default FileUpload;
