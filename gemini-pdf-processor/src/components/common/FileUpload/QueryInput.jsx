// src/components/FileUpload/QueryInput.jsx
import React from "react";
import { Typography, Input } from "@mui/material";

const QueryInput = ({ query, onChange }) => {
  const handleQueryChange = (event) => {
    onChange(event.target.value);
  };

  return (
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
  );
};

export default QueryInput;
