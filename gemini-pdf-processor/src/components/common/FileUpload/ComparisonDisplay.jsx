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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";

const ComparisonDisplay = ({ compareData }) => {
  if (!compareData) return null;

  const { differences, table1 = {}, table2 = {} } = compareData?.data || {};

  // Get all unique metric keys from both tables

  const allMetrics = Array.from(
    new Set([...Object.keys(table1 || {}), ...Object.keys(table2 || {})])
  );
  console.log(allMetrics, "metrics");
  console.log("compareData", compareData);
  console.log("table1 keys", Object.keys(table1 || {}));
  console.log("table2 keys", Object.keys(table2 || {}));

  return (
    <Box mt={4}>
      <Typography variant="h5" align="center" gutterBottom>
        Comparison Results
      </Typography>

      {/* Differences Section */}
      <Box mt={2}>
        <Typography variant="h6">Differences:</Typography>
        {differences ? (
          <List dense>
            {differences
              .split(/\*\s+/) // split by bullet point marker "* "
              .map((point, index) => point.trim())
              .filter(Boolean)
              .map((point, index) => (
                <ListItem key={index} disableGutters>
                  <ListItemIcon sx={{ minWidth: 24 }}>
                    <FiberManualRecordIcon sx={{ fontSize: 8 }} />
                  </ListItemIcon>
                  <ListItemText primary={point} />
                </ListItem>
              ))}
          </List>
        ) : (
          <Typography>No significant differences found.</Typography>
        )}
      </Box>

      {/* Side‑by‑Side Table */}
      <Box mt={3}>
        <TableContainer component={Paper} sx={{ mt: 1 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <strong>Metric</strong>
                </TableCell>
                <TableCell align="right">
                  <strong>PDF 1</strong>
                </TableCell>
                <TableCell align="right">
                  <strong>PDF 2</strong>
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {allMetrics.map((metric) => (
                <TableRow key={metric}>
                  <TableCell>{metric}</TableCell>
                  <TableCell align="right">{table1[metric] ?? "—"}</TableCell>
                  <TableCell align="right">{table2[metric] ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};

export default ComparisonDisplay;
