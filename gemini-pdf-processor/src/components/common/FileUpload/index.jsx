import React, { useState } from "react";
import { Box, Typography } from "@mui/material";
import FileList from "./FileList";
import QueryOptions from "./QueryOptions";
import ResultsDisplay from "./ResultsDisplay";
// import ComparisonDisplay from "./ComparisonDisplay";
import { useFinancialData } from "../../../hooks/useFinancialData";
import Notification from "../Notification";

const FileUpload = () => {
  const [files, setFiles] = useState([]);
  const {
    loading,
    error,
    snackbarMessage,
    openSnackbar,
    setOpenSnackbar,
    resultData,
    handleUpload,
    // handleCompare,
  } = useFinancialData(files);

  const handleFileChange = (event) => {
    if (files.length < 2) {
      setFiles([...files, event.target.files[0]]);
    }
  };

  const handleRemoveFiles = (index) => {
    setFiles(files.filter((_, i) => i !== index));
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

      <FileList
        files={files}
        onFileChange={handleFileChange}
        onRemoveFile={handleRemoveFiles}
      />

      {files.length === 1 && (
        <QueryOptions loading={loading} onUpload={handleUpload} />
      )}

      {/* {files.length === 2 && (
        <ComparisonOptions loading={loading} onCompare={handleCompare} />
      )} */}

      <Notification
        open={openSnackbar}
        message={snackbarMessage}
        severity={error ? "error" : "success"}
        onClose={() => setOpenSnackbar(false)}
      />

      {resultData && files.length === 1 && (
        <ResultsDisplay data={resultData.data[0]} />
      )}

      {/* {resultData && files.length === 2 && (
        <ComparisonDisplay compareData={resultData} />
      )} */}
    </Box>
  );
};

export default FileUpload;
