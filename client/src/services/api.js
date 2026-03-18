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

  const contentType = response.headers.get('content-type');
  const data = contentType && contentType.includes('application/json')
    ? await response.json()
    : {};

  if (!response.ok) {
    throw new Error(data.error || 'אירעה שגיאה, נסה שוב');
  }

  return data;
}

// Auth
export const auth = {
  register: (data) => request('/auth/register', { method: 'POST', body: data }),
  login: (data) => request('/auth/login', { method: 'POST', body: data }),
  changePassword: (data) => request('/auth/password', { method: 'PUT', body: data }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),
  update: (data) => request('/auth/me', { method: 'PUT', body: data }),
};

// Vehicles
export const vehicles = {
  list: () => request('/vehicles'),
  get: (id) => request(`/vehicles/${id}`),
  create: (data) => request('/vehicles', { method: 'POST', body: data }),
  update: (id, data) => request(`/vehicles/${id}`, { method: 'PUT', body: data }),
  delete: (id) => request(`/vehicles/${id}`, { method: 'DELETE' }),
  lookup: (plate) => request(`/vehicles/lookup/${plate}`),
  refresh: (id) => request(`/vehicles/${id}/refresh`, { method: 'POST' }),
  uploadImage: (id, file) => {
    const formData = new FormData();
    formData.append('image', file);
    return fetch(`${API_BASE}/vehicles/${id}/image`, { method: 'POST', credentials: 'include', body: formData })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'שגיאה בהעלאת תמונה');
        return data;
      });
  },
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

// Insurances
export const insurances = {
  list:   (vehicleId) => request(`/insurances?vehicleId=${vehicleId}`),
  create: (data)      => request('/insurances', { method: 'POST', body: data }),
  update: (id, data)  => request(`/insurances/${id}`, { method: 'PUT', body: data }),
  delete: (id)        => request(`/insurances/${id}`, { method: 'DELETE' }),
};


