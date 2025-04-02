import React from "react";
import {
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { FINANCIAL_METRICS } from "../../../constants/metrics";

const ComparisonMetricsSelector = ({ selectedMetrics, onChange }) => {
  const handleMetricChange = (event) => {
    const { value, checked } = event.target;
    onChange(
      checked
        ? [...selectedMetrics, value]
        : selectedMetrics.filter((metric) => metric !== value)
    );
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
      </Box>
    </>
  );
};

export default ComparisonMetricsSelector;
