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
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { FINANCIAL_METRICS } from "../../../constants/metrics";

const ComparisonMetricsSelector = ({
  selectedMetrics,
  onChange,
  onCompare,
  loading,
}) => {
  const [comparisonType, setComparisonType] = useState(null);

  const handleMetricChange = (event) => {
    const { value, checked } = event.target;
    onChange(
      checked
        ? [...selectedMetrics, value]
        : selectedMetrics.filter((metric) => metric !== value)
    );
  };

  // const handleComparisonTypeChange = (event, newValue) => {
  //   if (newValue !== null) {
  //     setComparisonType(newValue);
  //     if (newValue === "metrics") {
  //       setSelectedMetrics(onChange);
  //     }
  //   }
  // };

  const handleCompareClick = () => {
    const comparisonData = {
      type: "metrics",
      metrics: selectedMetrics,
    };

    onCompare(comparisonData);
  };

  return (
    <>
      <Typography variant="h6">Select Comparison Metrics:</Typography>
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
        <Button
          variant="contained"
          color="primary"
          onClick={handleCompareClick}
          fullWidth
          disabled={
            loading ||
            (comparisonType === "metrics" && selectedMetrics.length === 0)
          }
          sx={{ marginTop: 2 }}
        >
          {loading ? <CircularProgress size={24} /> : "Compare Files"}
        </Button>
      </Box>
    </>
  );
};

export default ComparisonMetricsSelector;
