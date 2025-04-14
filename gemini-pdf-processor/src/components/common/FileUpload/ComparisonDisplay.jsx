import React from "react";
import {
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  Card,
  CardContent
} from "@mui/material";

const ComparisonDisplay = ({ compareData }) => {
  // Handle case when no data is available
  if (!compareData || !compareData.data) {
    return (
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6">No comparison data available</Typography>
      </Box>
    );
  }

  const { comparison, table1, table2 } = compareData.data;
  
  // Function to determine if a value is a nested object with period data
  const isPeriodData = (value) => {
    return typeof value === 'object' && 
           value !== null && 
           !Array.isArray(value) && 
           Object.keys(value).some(key => 
             key.includes('FY') || key.includes('Q') || /\d{4}/.test(key)
           );
  };

  // Function to render period-specific tables
  const renderPeriodTable = (data) => {
    if (!data || Object.keys(data).length === 0) return <Typography>No data available</Typography>;
    
    // Get all unique periods across all metrics
    const allPeriods = new Set();
    Object.values(data).forEach(metric => {
      if (isPeriodData(metric)) {
        Object.keys(metric).forEach(period => allPeriods.add(period));
      }
    });
    const periods = Array.from(allPeriods).sort();
    
    if (periods.length === 0) return renderSimpleTable(data);
    
    return (
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Metric</TableCell>
              {periods.map(period => (
                <TableCell key={period}>{period}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.entries(data).map(([metric, values]) => (
              <TableRow key={metric}>
                <TableCell>{metric}</TableCell>
                {periods.map(period => (
                  <TableCell key={period}>
                    {isPeriodData(values) && values[period] !== undefined 
                      ? values[period].toLocaleString() 
                      : 'N/A'}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };
  
  // Function to render simple metric-value tables for non-period data
  const renderSimpleTable = (data) => {
    return (
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Metric</TableCell>
              <TableCell>Value</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.entries(data).map(([key, value]) => (
              <TableRow key={key}>
                <TableCell>{key}</TableCell>
                <TableCell>
                  {typeof value === 'object' && value !== null
                    ? JSON.stringify(value)
                    : String(value)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  // Function to determine if the data has period structure
  const hasPeriodStructure = (data) => {
    if (!data) return false;
    return Object.values(data).some(value => isPeriodData(value));
  };

  // Format the markdown-like content in the comparison text
  const formatComparisonText = (text) => {
    if (!text) return "";
    
    // Replace markdown-style bold with actual bold elements
    const boldReplaced = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Replace newlines with break elements
    const breakReplaced = boldReplaced.replace(/\n\n/g, '<br/><br/>');
    
    return (
      <div dangerouslySetInnerHTML={{ __html: breakReplaced }} />
    );
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" gutterBottom>
        Comparison Results
      </Typography>
      
      {/* Comparison Analysis */}
      {comparison && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Analysis:
            </Typography>
            <Typography variant="body2" component="div">
              {formatComparisonText(comparison)}
            </Typography>
          </CardContent>
        </Card>
      )}

      <Divider sx={{ my: 2 }} />
      
      {/* Data Tables */}
      <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 2 }}>
        {/* First Document Data */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" gutterBottom>
            Document 1 Data:
          </Typography>
          {table1 && hasPeriodStructure(table1) 
            ? renderPeriodTable(table1)
            : renderSimpleTable(table1)}
        </Box>

        {/* Second Document Data */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" gutterBottom>
            Document 2 Data:
          </Typography>
          {table2 && hasPeriodStructure(table2)
            ? renderPeriodTable(table2)
            : renderSimpleTable(table2)}
        </Box>
      </Box>
    </Box>
  );
};

export default ComparisonDisplay;