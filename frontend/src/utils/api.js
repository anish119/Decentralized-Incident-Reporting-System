import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || ''; // Backend Base URL

// Add token to headers if available
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
};

// Auth APIs
export const registerUser = async (data) => {
  const response = await axios.post(`${API_URL}/auth/register`, data);
  return response.data;
};

export const loginUser = async (data) => {
  const response = await axios.post(`${API_URL}/auth/login`, data);
  return response.data;
};

// MetaMask Auth APIs
export const getNonce = async (walletAddress) => {
  const response = await axios.get(`${API_URL}/auth/nonce/${walletAddress}`);
  return response.data;
};

// Submit report with file uploads (multipart/form-data)
// IMPORTANT: Do NOT manually set Content-Type here.
// When body is FormData, axios automatically sets Content-Type: multipart/form-data; boundary=...
// Manually setting it would erase the boundary, breaking multer's ability to parse files.
export const submitReport = async (data) => {
  const response = await axios.post(`${API_URL}/reports`, data, {
    headers: {
      ...getAuthHeaders(),
      // Content-Type intentionally omitted — let axios auto-detect for FormData
    },
  });
  return response.data;
};

// Get all reports (public summary-only fields)
export const getReports = async () => {
  const response = await axios.get(`${API_URL}/reports`);
  return response.data;
};

// Get personal reports
export const getMyReports = async () => {
  const response = await axios.get(`${API_URL}/reports/my-reports`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// Get all reports with full details (admin/investigator use)
export const getAllReports = async () => {
  const response = await axios.get(`${API_URL}/reports/all`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// Update report status (admin use)
export const updateReportStatus = async (reportId, status) => {
  const response = await axios.put(`${API_URL}/reports/${reportId}/status`, { status }, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// Get a single report by ID
export const getReportById = async (reportId) => {
  const response = await axios.get(`${API_URL}/reports/${reportId}`);
  return response.data;
};

// Verify a report on the blockchain
export const verifyReportOnChain = async (reportId) => {
  const response = await axios.get(`${API_URL}/reports/${reportId}/verify`);
  return response.data;
};

// Upvote a report
export const upvoteReport = async (reportId) => {
  const response = await axios.post(`${API_URL}/reports/${reportId}/upvote`, {}, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// Dispute/Flag a report
export const disputeReport = async (reportId) => {
  const response = await axios.post(`${API_URL}/reports/${reportId}/dispute`, {}, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// Get report messages
export const getReportMessages = async (reportId) => {
  const response = await axios.get(`${API_URL}/reports/${reportId}/messages`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// Send a report message
export const sendReportMessage = async (reportId, text) => {
  const response = await axios.post(`${API_URL}/reports/${reportId}/messages`, { text }, {
    headers: getAuthHeaders(),
  });
  return response.data;
};