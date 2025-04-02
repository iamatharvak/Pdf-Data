import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
// import reportWebVitals from "./reportWebVitals";
// import FileUpload from "./FileUpload";
// import CompanyReports from "./CompanyReports";
// import CompanySearch from "./CompanySearch";
// import FileUpload from "./components/common/FileUpload";
import { BrowserRouter } from "react-router-dom";
// import PDFUrlProcessor from "./components/common/PdfProcessor";
import App from "./App";
// PDFUrlProcessor

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
