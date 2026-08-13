import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const buildApiUrl = (path) => `${API_BASE_URL}${path}`;

export const fetchJobs = async ({ page = 1, limit = 9, search = "", category = "" }) => {
  const params = new URLSearchParams();

  params.append("page", page);
  params.append("limit", limit);
  if (search) params.append("search", search);
  if (category && category !== "All") params.append("category", category);

  const response = await axios.get(buildApiUrl(`/api/v1/jobs?${params.toString()}`));
  return response.data;
};