import React, { useState } from "react";
import {
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  Button,
  CircularProgress,
} from "@mui/material";
import MetricsSelector from "./MetricsSelector";
import QueryInput from "./QueryInput";

const QueryOptions = ({ loading, onUpload }) => {
  const [queryType, setQueryType] = useState(null);
  const [selectedMetrics, setSelectedMetrics] = useState([]);
  const [query, setQuery] = useState("");

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

  const handleUploadClick = () => {
    const data =
      queryType === "metrics"
        ? { type: "metrics", metrics: selectedMetrics }
        : { type: "query", query };

    onUpload(data);
  };

  return (
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
        <MetricsSelector
          selectedMetrics={selectedMetrics}
          onChange={setSelectedMetrics}
        />
      )}

      {queryType === "query" && (
        <QueryInput query={query} onChange={setQuery} />
      )}

      <Button
        variant="contained"
        color="primary"
        onClick={handleUploadClick}
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
  );
};

export default QueryOptions;
