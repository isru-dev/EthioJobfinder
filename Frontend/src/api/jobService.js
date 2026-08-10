import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api/v1/jobs";

export const fetchJobs = async ({ page = 1, limit = 9, search = "", category = "" }) => {
  const params = new URLSearchParams();
  
  params.append("page", page);
  params.append("limit", limit);
  if (search) params.append("search", search);
  if (category && category !== "All") params.append("category", category);

  const response = await axios.get(`${API_BASE_URL}?${params.toString()}`);
  return response.data;
};