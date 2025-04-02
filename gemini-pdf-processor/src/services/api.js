import axios from "axios";
const FILE_API_URL = "http://localhost:5000";
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
