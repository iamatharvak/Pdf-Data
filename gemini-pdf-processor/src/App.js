import React from "react";
import { Routes, Route } from "react-router-dom";
import FileUpload from "./components/common/FileUpload/index";
import CompanySearch from "./CompanySearch";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<FileUpload />} />
      <Route path="/company-search" element={<CompanySearch />} />
    </Routes>
  );
};

export default App;
