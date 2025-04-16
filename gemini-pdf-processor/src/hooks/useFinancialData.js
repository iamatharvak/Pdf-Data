// src/hooks/useFinancialData.js
import { useState, useEffect } from "react";
import {
  // fetchBalanceSheet,
  uploadAndQueryFile,
  compareFiles,
} from "../services/api";

export const useFinancialData = (files, selectedMetrics) => {
  const [symbol, setSymbol] = useState("AAPL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [resultData, setResultData] = useState(null);
  // const [balanceSheet, setBalanceSheet] = useState(null);

  // useEffect(() => {

  //   const loadBalanceSheet = async () => {
  //     try {
  //       const data = await fetchBalanceSheet(symbol);
  //       setBalanceSheet(data);
  //     } catch (err) {
  //       console.error("Error loading balance sheet:", err);
  //     }
  //   };

  //   loadBalanceSheet();
  // }, [symbol]);

  const handleUpload = async (queryData) => {
    if (files.length === 0) {
      setError("Please upload a PDF.");
      return;
    }

    setLoading(true);
    try {
      const result = await uploadAndQueryFile(files[0], queryData);
      console.log(result.data);
      setResultData(result.data[0]);
      setSnackbarMessage("Operation successful!");
      setOpenSnackbar(true);
    } catch (err) {
      setError(err.response?.data || "Error processing file. Try again.");
      setSnackbarMessage("Error processing file. Try again.");
      setOpenSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = async (comparisonData) => {
    if (files.length !== 2) {
      setError("Upload exactly two PDFs for comparison.");
      return;
    }

    setLoading(true);
    try {
      
      console.log(selectedMetrics, "metrics");
      const result = await compareFiles(files, comparisonData);
      console.log(files, "file");
      console.log(selectedMetrics, "metrics");
      console.log(result, "rsults");
      console.log(result.data, "rsults data");
      setResultData(result);
      setSnackbarMessage("Comparison successful!");
      setOpenSnackbar(true);
    } catch (err) {
      setError(err.response?.data || "Error comparing files. Try again.");
      setSnackbarMessage("Error comparing files. Try again.");
      setOpenSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  const resetResultData = () => {
    setResultData(null);
  };

  return {
    symbol,
    setSymbol,
    loading,
    error,
    openSnackbar,
    setOpenSnackbar,
    snackbarMessage,
    resultData,
    // balanceSheet,
    handleUpload,
    handleCompare,
    resetResultData
  };
};
