// import React, { useState } from "react";
// import {
//   Typography,
//   ToggleButtonGroup,
//   ToggleButton,
//   Button,
//   CircularProgress,
// } from "@mui/material";
// import MetricsSelector from "./MetricsSelector";
// import ComparisonMetricsSelector from "./ComparisonMetricsSelector";

// const ComparisonOptions = ({
//   loading,
//   onCompare,
//   selectedMetrics,
//   onChange,
// }) => {
//   const [comparisonType, setComparisonType] = useState(null);
//   // const [selectedMetrics, setSelectedMetrics] = useState([]);

//   const handleComparisonTypeChange = (event, newValue) => {
//     if (newValue !== null) {
//       setComparisonType(newValue);
//       if (newValue === "metrics") {
//         setSelectedMetrics(onChange);
//       }
//     }
//   };

//   const handleCompareClick = () => {
//     const comparisonData = {
//       type: "metrics",
//       metrics: selectedMetrics,
//     };

//     onCompare(comparisonData);
//   };

//   return (
//     <>
//       <Typography variant="h6" sx={{ marginTop: 2 }}>
//         Choose a method to compare PDFs:
//       </Typography>

//       <ToggleButtonGroup
//         value={comparisonType}
//         exclusive
//         onChange={handleComparisonTypeChange}
//         sx={{ marginBottom: 2, display: "flex", justifyContent: "center" }}
//       >
//         <ToggleButton value="metrics">Compare Metrics</ToggleButton>
//       </ToggleButtonGroup>

//       {comparisonType === "metrics" && (
//         <ComparisonMetricsSelector
//           selectedMetrics={selectedMetrics}
//           onChange={onChange}
//         />
//       )}

//       <Button
//         variant="contained"
//         color="primary"
//         onClick={handleCompareClick}
//         fullWidth
//         disabled={
//           loading ||
//           (comparisonType === "metrics" && selectedMetrics.length === 0)
//         }
//         sx={{ marginTop: 2 }}
//       >
//         {loading ? <CircularProgress size={24} /> : "Compare Files"}
//       </Button>
//     </>
//   );
// };

// export default ComparisonOptions;
