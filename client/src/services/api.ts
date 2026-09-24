import type { User, Category, Transaction, Budget, Insight, SavedTip, Announcement, AdminStats, ActivityLog } from '../types';

const API_BASE = '/api';

const getHeaders = (isJson = true) => {
  const headers: Record<string, string> = {};
  if (isJson) headers['Content-Type'] = 'application/json';

  const token = localStorage.getItem('campuscoin_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  // Auth
  register: async (data: any) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Registration failed');
    return json;
  },

  login: async (credentials: any) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(credentials)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Login failed');
    return json;
  },

  adminLogin: async (credentials: any) => {
    const res = await fetch(`${API_BASE}/auth/admin-login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(credentials)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Admin login failed');
    return json;
  },

  forgotPassword: async (email: string) => {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Forgot password failed');
    return json;
  },

  resetPassword: async (data: any) => {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Reset password failed');
    return json;
  },

  getProfile: async (): Promise<User> => {
    const res = await fetch(`${API_BASE}/auth/profile`, { headers: getHeaders() });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to fetch profile');
    return json;
  },

  updateProfile: async (data: any): Promise<User> => {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update profile');
    return json;
  },

  // Categories
  getCategories: async (): Promise<Category[]> => {
    const res = await fetch(`${API_BASE}/categories`, { headers: getHeaders() });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to fetch categories');
    return json;
  },

  createCategory: async (data: any): Promise<Category> => {
    const res = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to create category');
    return json;
  },

  updateCategory: async (id: number, data: any): Promise<Category> => {
    const res = await fetch(`${API_BASE}/categories/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update category');
    return json;
  },

  deleteCategory: async (id: number) => {
    const res = await fetch(`${API_BASE}/categories/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to delete category');
    return json;
  },

  // Transactions
  getTransactions: async (params?: any): Promise<Transaction[]> => {
    const query = new URLSearchParams(params || {}).toString();
    const res = await fetch(`${API_BASE}/transactions?${query}`, { headers: getHeaders() });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to fetch transactions');
    return json;
  },

  createTransaction: async (data: any): Promise<Transaction> => {
    const res = await fetch(`${API_BASE}/transactions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to create transaction');
    return json;
  },

  updateTransaction: async (id: number, data: any): Promise<Transaction> => {
    const res = await fetch(`${API_BASE}/transactions/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update transaction');
    return json;
  },

  deleteTransaction: async (id: number) => {
    const res = await fetch(`${API_BASE}/transactions/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to delete transaction');
    return json;
  },

  importCsv: async (file: File, previewOnly = false) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('previewOnly', previewOnly ? 'true' : 'false');

    const headers = getHeaders(false);

    const res = await fetch(`${API_BASE}/transactions/csv-import`, {
      method: 'POST',
      headers,
      body: formData
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'CSV import failed');
    return json;
  },

  getActivityLogs: async (): Promise<ActivityLog[]> => {
    const res = await fetch(`${API_BASE}/transactions/activity`, { headers: getHeaders() });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to fetch activity logs');
    return json;
  },

  // AI Predictor
  predictCategory: async (description: string, type: string) => {
    const res = await fetch(`${API_BASE}/ai/predict-category`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ description, type })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'AI prediction failed');
    return json;
  },

  // Budgets
  getBudgets: async (month?: string): Promise<Budget[]> => {
    const query = month ? `?month=${month}` : '';
    const res = await fetch(`${API_BASE}/budgets${query}`, { headers: getHeaders() });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to fetch budgets');
    return json;
  },

  saveBudget: async (data: any) => {
    const res = await fetch(`${API_BASE}/budgets`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to save budget');
    return json;
  },

  deleteBudget: async (id: number) => {
    const res = await fetch(`${API_BASE}/budgets/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to delete budget');
    return json;
  },

  // Insights & Tips
  getCurrentInsight: async (month?: string, forceRegenerate = false): Promise<Insight> => {
    let query = month ? `?month=${month}` : '';
    if (forceRegenerate) query += (query ? '&' : '?') + 'forceRegenerate=true';

    const res = await fetch(`${API_BASE}/insights/current${query}`, { headers: getHeaders() });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to fetch insight');
    return json;
  },

  getInsightHistory: async (): Promise<Insight[]> => {
    const res = await fetch(`${API_BASE}/insights/history`, { headers: getHeaders() });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to fetch insight history');
    return json;
  },

  toggleBookmarkInsight: async (id: number) => {
    const res = await fetch(`${API_BASE}/insights/${id}/bookmark`, {
      method: 'PUT',
      headers: getHeaders()
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to bookmark insight');
    return json;
  },

  getSavingTips: async (): Promise<SavedTip[]> => {
    const res = await fetch(`${API_BASE}/tips`, { headers: getHeaders() });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to fetch saving tips');
    return json;
  },

  updateTipStatus: async (id: number, status: string) => {
    const res = await fetch(`${API_BASE}/tips/${id}/status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update tip status');
    return json;
  },

  // Reports
  getMonthlySummaryReport: async (month?: string) => {
    const query = month ? `?month=${month}` : '';
    const res = await fetch(`${API_BASE}/reports/monthly-summary${query}`, { headers: getHeaders() });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to fetch monthly summary');
    return json;
  },

  getSixMonthTrendReport: async () => {
    const res = await fetch(`${API_BASE}/reports/six-month-trend`, { headers: getHeaders() });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to fetch six month trend');
    return json;
  },

  getDailyWeeklyReport: async (month?: string) => {
    const query = month ? `?month=${month}` : '';
    const res = await fetch(`${API_BASE}/reports/daily-weekly${query}`, { headers: getHeaders() });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to fetch daily/weekly report');
    return json;
  },

  getForecastReport: async () => {
    const res = await fetch(`${API_BASE}/reports/forecast`, { headers: getHeaders() });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to fetch forecast');
    return json;
  },

  getAnomaliesReport: async () => {
    const res = await fetch(`${API_BASE}/reports/anomalies`, { headers: getHeaders() });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to fetch anomalies report');
    return json;
  },

  // Admin
  getAdminStats: async (): Promise<AdminStats> => {
    const res = await fetch(`${API_BASE}/admin/stats`, { headers: getHeaders() });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to fetch admin stats');
    return json;
  },

  getAdminUsers: async () => {
    const res = await fetch(`${API_BASE}/admin/users`, { headers: getHeaders() });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to fetch admin users');
    return json;
  },

  toggleUserStatus: async (userId: number) => {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/toggle`, {
      method: 'PUT',
      headers: getHeaders()
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to toggle user status');
    return json;
  },

  adminResetPassword: async (userId: number) => {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/reset-password`, {
      method: 'POST',
      headers: getHeaders()
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to reset user password');
    return json;
  },

  getAdminDefaultCategories: async () => {
    const res = await fetch(`${API_BASE}/admin/default-categories`, { headers: getHeaders() });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to fetch default categories');
    return json;
  },

  createAdminDefaultCategory: async (data: any) => {
    const res = await fetch(`${API_BASE}/admin/default-categories`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to add default category');
    return json;
  },

  deleteAdminDefaultCategory: async (id: number) => {
    const res = await fetch(`${API_BASE}/admin/default-categories/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to delete default category');
    return json;
  },

  getAnnouncements: async (): Promise<Announcement[]> => {
    const res = await fetch(`${API_BASE}/admin/announcements`, { headers: getHeaders() });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to fetch announcements');
    return json;
  },

  createAnnouncement: async (data: any) => {
    const res = await fetch(`${API_BASE}/admin/announcements`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to create announcement');
    return json;
  },

  deleteAnnouncement: async (id: number) => {
    const res = await fetch(`${API_BASE}/admin/announcements/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to delete announcement');
    return json;
  }
};
