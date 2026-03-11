const API_BASE = '/api';

async function request(url, options = {}) {
  const config = {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(`${API_BASE}${url}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
}

// Auth
export const auth = {
  register: (data) => request('/auth/register', { method: 'POST', body: data }),
  login: (data) => request('/auth/login', { method: 'POST', body: data }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),
  update: (data) => request('/auth/me', { method: 'PUT', body: data }),
  googleUrl: () => `${API_BASE}/auth/google`,
};

// Vehicles
export const vehicles = {
  list: () => request('/vehicles'),
  get: (id) => request(`/vehicles/${id}`),
  create: (data) => request('/vehicles', { method: 'POST', body: data }),
  update: (id, data) => request(`/vehicles/${id}`, { method: 'PUT', body: data }),
  delete: (id) => request(`/vehicles/${id}`, { method: 'DELETE' }),
  lookup: (plate) => request(`/vehicles/lookup/${plate}`),
};

// Services
export const services = {
  list: (vehicleId) => request(`/services?vehicleId=${vehicleId}`),
  create: (data) => request('/services', { method: 'POST', body: data }),
  update: (id, data) => request(`/services/${id}`, { method: 'PUT', body: data }),
  delete: (id) => request(`/services/${id}`, { method: 'DELETE' }),
};

// Expenses
export const expenses = {
  list: (vehicleId, params = {}) => {
    const qs = new URLSearchParams({ vehicleId, ...params }).toString();
    return request(`/expenses?${qs}`);
  },
  summary: (vehicleId, months = 12) => {
    const qs = new URLSearchParams({ ...(vehicleId ? { vehicleId } : {}), months }).toString();
    return request(`/expenses/summary?${qs}`);
  },
  create: (data) => request('/expenses', { method: 'POST', body: data }),
  update: (id, data) => request(`/expenses/${id}`, { method: 'PUT', body: data }),
  delete: (id) => request(`/expenses/${id}`, { method: 'DELETE' }),
};

// Reminders
export const reminders = {
  list: (vehicleId, activeOnly = false) => {
    const qs = new URLSearchParams({ ...(vehicleId ? { vehicleId } : {}), activeOnly }).toString();
    return request(`/reminders?${qs}`);
  },
  create: (data) => request('/reminders', { method: 'POST', body: data }),
  update: (id, data) => request(`/reminders/${id}`, { method: 'PUT', body: data }),
  delete: (id) => request(`/reminders/${id}`, { method: 'DELETE' }),
};

// Garages
export const garages = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/garages?${qs}`);
  },
  get: (id) => request(`/garages/${id}`),
  create: (data) => request('/garages', { method: 'POST', body: data }),
  addReview: (garageId, data) => request(`/garages/${garageId}/reviews`, { method: 'POST', body: data }),
  deleteReview: (garageId) => request(`/garages/${garageId}/reviews`, { method: 'DELETE' }),
};

// Dashboard
export const dashboard = {
  get: () => request('/dashboard'),
};

// Reports
export const reports = {
  vehiclePdfUrl: (vehicleId) => `${API_BASE}/reports/vehicles/${vehicleId}/pdf`,
};

