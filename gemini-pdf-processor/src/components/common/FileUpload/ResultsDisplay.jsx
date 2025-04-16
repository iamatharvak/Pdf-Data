import React, { useState } from "react";
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";

const ResultsDisplay = ({ data }) => {
  const [selectedYear, setSelectedYear] = useState("");

  const getUniqueYears = (data) => {
    console.log(data)
    if (!data || !data.query || !data.query.rows) return [];
    const yearIndex = data.query.columns.indexOf("Year");
    if (yearIndex === -1) return [];
    return [...new Set(data.query.rows.map((row) => row[yearIndex]))];
  };

  const renderTable = (data) => {
    console.log(data);
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

  return (
    <Box sx={{ marginTop: 2 }}>
      <Typography variant="h6">Results:</Typography>
      {data && data.query && data.query.columns && (
        <FormControl fullWidth sx={{ marginBottom: 2 }}>
          <InputLabel id="year-select-label">Select Year</InputLabel>
          <Select
            labelId="year-select-label"
            value={selectedYear}
            label="Select Year"
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <MenuItem value="">All Years</MenuItem>
            {getUniqueYears(data).map((year) => (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
      {renderTable(data)}
    </Box>
  );
};

export default ResultsDisplay;
