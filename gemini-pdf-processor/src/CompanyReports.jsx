import React, { useState } from "react";
import axios from "axios";
import {
  Box,
  Button,
  TextField,
  Typography,
  List,
  ListItem,
} from "@mui/material";

const API_KEY = "fSzEtrKoxZhhdBJKEzsOa2E0EZMIhx10"; 
const SYMBOL = "AAPL"; // Example company symbol

const CompanyReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [symbol, setSymbol] = useState(SYMBOL);

  const fetchReports = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(
        "https://financialmodelingprep.com/stable/income-statement?symbol=AAPL",
        {
          params: {
            apikey: API_KEY,
          },
        }
      );
      // Assuming the API returns an array of reports with fields like reportDate and pdfUrl:
      setReports(response.data);
      console.log(response);
    } catch (err) {
      console.error("Error fetching reports:", err);
      setError("Failed to fetch reports.");
    } finally {
      setLoading(false);
    }
  };

  //   https://financialmodelingprep.com/stable/income-statement?symbol=AAPL
  return (
    <Box sx={{ padding: 2 }}>
      <Typography variant="h5" sx={{ marginBottom: 2 }}>
        Company Reports for {symbol}
      </Typography>
      <TextField
        label="Company Symbol"
        value={symbol}
        onChange={(e) => setSymbol(e.target.value)}
        sx={{ marginBottom: 2, marginRight: 1 }}
      />
      <Button variant="contained" onClick={fetchReports} disabled={loading}>
        {loading ? "Loading..." : "Fetch Reports"}
      </Button>

      {error && <Typography color="error">{error}</Typography>}

      {reports.length > 0 && (
        <List>
          {reports.map((report, index) => (
            <ListItem key={index}>
              <Typography>
                {report.type} Report ({report.reportDate})
              </Typography>
              <Button
                variant="outlined"
                href={report.pdfUrl}
                target="_blank"
                sx={{ marginLeft: 2 }}
              >
                View PDF
              </Button>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

export default CompanyReports;
