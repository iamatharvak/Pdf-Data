import React, { useState } from "react";
import axios from "axios";
import "./App.css";

const App = () => {
  const [file, setFile] = useState(null);
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleQueryChange = (event) => {
    setQuery(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      alert("Please upload a file!");
      return;
    }
    if (!query) {
      alert("Please enter a query!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("query", query);

    try {
      const { data } = await axios.post(
        "http://localhost:5000/upload",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setResponse(data.response);
    } catch (error) {
      console.error("Error processing request:", error);
      setResponse("Error processing the file.");
    }
  };

  return (
    <div className="App">
      <h1>PDF Processor with Gemini AI</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Upload PDF:
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
          />
        </label>
        <label>
          Enter your query:
          <input type="text" value={query} onChange={handleQueryChange} />
        </label>
        <button type="submit">Submit</button>
      </form>
      {response && (
        <div className="response">
          <h2>Response:</h2>
          <p>{response}</p>
        </div>
      )}
    </div>
  );
};

export default App;
