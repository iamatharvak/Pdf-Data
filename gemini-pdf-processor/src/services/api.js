import axios from "axios";
const FILE_API_URL = "https://pdf-data-mocha.vercel.app/api";

export const uploadAndQueryFile = async (file, queryData) => {
  const formData = new FormData();
  formData.append("file", file);

  if (queryData.type === "metrics") {
    formData.append("metrics", JSON.stringify(queryData.metrics));
  } else if (queryData.type === "query") {
    formData.append("query", queryData.query);
  }

  const response = await axios.post(`${FILE_API_URL}/upload`, formData);
  return response.data;
};

export const compareFiles = async (files, selectedMetrics) => {
  const formData = new FormData();
  formData.append("file", files[0]);
  formData.append("file", files[1]);
  formData.append("metrics", JSON.stringify(selectedMetrics));

  try {
    const response = await axios.post(`${FILE_API_URL}/compare`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    console.error("Error comparing files:", error);
    throw error;
  }
};
