import React from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";

const ComparisonDisplay = ({ compareData }) => {
  if (!compareData) return null;

  const { differences, table1, table2 } = compareData;
  console.log("Comparison Data:", compareData);

  // ✅ Fix: Properly handle nested objects inside tables
  const renderTable = (table, title) => {
    if (!table) return null;

    return (
      <Box mt={3}>
        <Typography variant="h6">{title}</Typography>
        {Object.entries(table).map(
          ([sectionName, sectionData], sectionIndex) => (
            <Box key={sectionIndex} mt={2}>
              <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                {sectionName}
              </Typography>
              <TableContainer component={Paper} sx={{ mt: 1 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <strong>Metric</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Value</strong>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(sectionData).map(
                      ([key, value], rowIndex) => (
                        <TableRow key={rowIndex}>
                          <TableCell>{key}</TableCell>
                          <TableCell>
                            {typeof value === "object"
                              ? JSON.stringify(value)
                              : value}
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )
        )}
      </Box>
    );
  };

  return (
    <Box mt={4}>
      <Typography variant="h5" align="center" gutterBottom>
        Comparison Results
      </Typography>

      {/* Differences Section */}
      <Box mt={2}>
        <Typography variant="h6">Differences:</Typography>
        <Typography>
          {differences || "No significant differences found."}
        </Typography>
      </Box>

      {/* Render Tables */}
      {renderTable(table1, "Extracted Data from PDF 1")}
      {renderTable(table2, "Extracted Data from PDF 2")}
    </Box>
  );
};

export default ComparisonDisplay;
