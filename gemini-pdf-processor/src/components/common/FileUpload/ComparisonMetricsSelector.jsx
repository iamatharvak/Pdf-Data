import React, { useState } from "react";
import {
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Checkbox,
  Button,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
  TextField
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { FINANCIAL_METRICS } from "../../../constants/metrics";

const ComparisonMetricsSelector = ({
  selectedMetrics,
  onChange,
  onCompare,
  loading,
}) => {
  const [comparisonType, setComparisonType] = useState("metrics");
  const [comparisonQuery, setComparisonQuery] = useState("");

  const handleMetricChange = (event) => {
    const { value, checked } = event.target;
    onChange(
      checked
        ? [...selectedMetrics, value]
        : selectedMetrics.filter((metric) => metric !== value)
    );
  };

  const handleComparisonTypeChange = (event, newValue) => {
    if (newValue !== null) {
      setComparisonType(newValue);
    }
  };

  const handleCompareClick = () => {
    if (comparisonType === "metrics") {
      onCompare({ 
        type: "metrics", 
        metrics: selectedMetrics 
      });
    } else {
      onCompare({ 
        type: "query", 
        query: comparisonQuery 
      });
    }
  };

  return (
    <>
      <Typography variant="h6">Compare Files:</Typography>
      
      <ToggleButtonGroup
        value={comparisonType}
        exclusive
        onChange={handleComparisonTypeChange}
        sx={{ marginBottom: 2, display: "flex", justifyContent: "center" }}
      >
        <ToggleButton value="metrics">Select Metrics</ToggleButton>
        <ToggleButton value="query">Enter Query</ToggleButton>
      </ToggleButtonGroup>

      {comparisonType === "metrics" && (
        <Box sx={{ marginBottom: 2 }}>
          {Object.entries(FINANCIAL_METRICS).map(([category, metrics], index) => (
            <Accordion key={index}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>{category}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {metrics.map((metric, i) => (
                  <FormControlLabel
                    key={i}
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
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}

      {comparisonType === "query" && (
        <TextField
          fullWidth
          multiline
          rows={4}
          label="Enter a comparison query"
          variant="outlined"
          value={comparisonQuery}
          onChange={(e) => setComparisonQuery(e.target.value)}
          placeholder="Example: Compare revenue growth and profit margins between both decks"
          sx={{ marginBottom: 2 }}
        />
      )}

      <Button
        variant="contained"
        color="primary"
        onClick={handleCompareClick}
        fullWidth
        disabled={
          loading ||
          (comparisonType === "metrics" && selectedMetrics.length === 0) ||
          (comparisonType === "query" && !comparisonQuery.trim())
        }
        sx={{ marginTop: 2 }}
      >
        {loading ? <CircularProgress size={24} /> : "Compare Files"}
      </Button>
    </>
  );
};

export default ComparisonMetricsSelector;