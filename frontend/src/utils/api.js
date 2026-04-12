import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

// Global Axios Error Handling Interceptor
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      // Network error (backend unreachable)
      console.error('Network Error: Unable to connect to server.');
      alert('Unable to connect to server. Please try again later.');
    }
    return Promise.reject(error);
  }
);

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
  const response = await axios.post(`${API_URL}/api/auth/register`, data);
  return response.data;
};

export const loginUser = async (data) => {
  const response = await axios.post(`${API_URL}/api/auth/login`, data);
  // Ensure token is stored
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
  }
  return response.data;
};

// MetaMask Auth APIs
export const getNonce = async (walletAddress) => {
  const response = await axios.get(`${API_URL}/api/auth/nonce/${walletAddress}`);
  return response.data;
};

// Submit report with file uploads (multipart/form-data)
export const submitReport = async (data) => {
  const response = await axios.post(`${API_URL}/api/reports`, data, {
    headers: {
      ...getAuthHeaders(),
    },
  });
  return response.data;
};

// Get all reports (public summary-only fields)
export const getReports = async () => {
  const response = await axios.get(`${API_URL}/api/reports`);
  return response.data;
};

// Get personal reports
export const getMyReports = async () => {
  const response = await axios.get(`${API_URL}/api/reports/my-reports`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// Get all reports with full details (admin/investigator use)
export const getAllReports = async () => {
  const response = await axios.get(`${API_URL}/api/reports/all`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// Update report status (admin use)
export const updateReportStatus = async (reportId, status) => {
  const response = await axios.put(`${API_URL}/api/reports/${reportId}/status`, { status }, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// Get a single report by ID
export const getReportById = async (reportId) => {
  const response = await axios.get(`${API_URL}/api/reports/${reportId}`);
  return response.data;
};

// Verify a report on the blockchain
export const verifyReportOnChain = async (reportId) => {
  const response = await axios.get(`${API_URL}/api/reports/${reportId}/verify`);
  return response.data;
};

// Upvote a report
export const upvoteReport = async (reportId) => {
  const response = await axios.post(`${API_URL}/api/reports/${reportId}/upvote`, {}, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// Dispute/Flag a report
export const disputeReport = async (reportId) => {
  const response = await axios.post(`${API_URL}/api/reports/${reportId}/dispute`, {}, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// Get report messages
export const getReportMessages = async (reportId) => {
  const response = await axios.get(`${API_URL}/api/reports/${reportId}/messages`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// Send a report message
export const sendReportMessage = async (reportId, text) => {
  const response = await axios.post(`${API_URL}/api/reports/${reportId}/messages`, { text }, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// Investigator Code Generator (Admin only)
export const generateInvestigatorCode = async () => {
  const response = await axios.post(`${API_URL}/api/admin/generate-investigator-code`, {}, {
    headers: getAuthHeaders(),
  });
  return response.data;
};