import axios from "axios";
const FILE_API_URL = "http://localhost:5001";

export const uploadAndQueryFile = async (file, queryData) => {
  const formData = new FormData();
  formData.append("file", file);

  if (queryData.type === "metrics") {
    formData.append("metrics", JSON.stringify(queryData.metrics));
  } else if (queryData.type === "query") {
    formData.append("query", queryData.query);
  }

  const response = await axios.post(`${FILE_API_URL}/upload`, formData);
  try {
    console.log(response.status);
  } catch (error) {
    console.log(error);
  }
  return response.data;
};

export const compareFiles = async (files, comparisonData) => {
  const formData = new FormData();
  formData.append("file", files[0]);
  formData.append("file", files[1]);
  // formData.append("metrics", JSON.stringify(selectedMetrics));
  // console.log(formData.values, "data first");

  if (comparisonData.type === "metrics") {
    formData.append("metrics", JSON.stringify(comparisonData.metrics));
  } else if (comparisonData.type === "query") {
    formData.append("query", comparisonData.query);
    formData.append("type", "query"); // Indicate to backend this is a query comparison
  }

  try {
    const response = await axios.post(`${FILE_API_URL}/compare`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    console.log(response, "abc first");
    return response;
  } catch (error) {
    console.error("Error comparing files:", error);
    throw error;
  }
};
