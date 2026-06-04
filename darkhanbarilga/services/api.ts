import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_URL =
  process.env.API_URL ||
  'https://darkhanbarilga-backend-production.up.railway.app/api';

const request = async (method: string, path: string, body?: any, auth = true) => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = await AsyncStorage.getItem('token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Алдаа гарлаа');
  return data;
};

export const normalizeProperty = (p: any) => ({
  ...p,
  id: p._id || p.id,
  _id: p._id || p.id,
  location: p.location
    ? typeof p.location === 'string'
      ? p.location
      : `${p.location.district}, ${p.location.city}`
    : '',
  district: p.district || p.location?.district || '',
  area: p.area || p.sizeSqm || 0,
  images: Array.isArray(p.images)
    ? p.images.map((img: any) => typeof img === 'string' ? img : img.url)
    : [],
  agent: p.agent || (p.assignedAgent ? {
    name: `${p.assignedAgent.firstName} ${p.assignedAgent.lastName}`,
    avatar: p.assignedAgent.avatar || '',
    phone: p.assignedAgent.phone || '',
  } : { name: 'Зуучлагч', avatar: '', phone: '' }),
  isFeatured: p.isFeatured ?? false,
  isNew: p.isNew ?? false,
});

export const authAPI = {
  signup: (body: any) => request('POST', '/auth/signup', body, false),
  login: (email: string, password: string) => request('POST', '/auth/login', { email, password }, false),
  logout: () => request('POST', '/auth/logout').catch(() => {}),
  getMe: () => request('GET', '/auth/me'),
};

export const propertyAPI = {
  getAll: async (params?: any) => {
    const q = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== Infinity) q.append(k, String(v));
    });
    const res = await request('GET', `/properties?${q}`, undefined, false);
    res.data.properties = res.data.properties.map(normalizeProperty);
    return res;
  },
  getById: async (id: string) => {
    const res = await request('GET', `/properties/${id}`, undefined, false);
    res.data.property = normalizeProperty(res.data.property);
    return res;
  },
  getMyListings: async () => {
    const res = await request('GET', '/properties/my/listings');
    res.data.properties = res.data.properties.map(normalizeProperty);
    return res;
  },
  create: (body: any) => request('POST', '/properties', body),
  update: (id: string, body: any) => request('PATCH', `/properties/${id}`, body),
  updateStatus: (id: string, status: string) => request('PATCH', `/properties/${id}/status`, { status }),
  delete: (id: string) => request('DELETE', `/properties/${id}`),
};

export const appointmentAPI = {
  book: (body: any) => request('POST', '/appointments', body),
  getMyAppointments: () => request('GET', '/appointments/my-appointments'),
  getAgentSchedule: () => request('GET', '/appointments/agent-schedule'),
  approve: (id: string, body?: any) => request('PATCH', `/appointments/${id}/approve`, body),
  cancel: (id: string, reason?: string) => request('PATCH', `/appointments/${id}/cancel`, { cancellationReason: reason }),
  complete: (id: string) => request('PATCH', `/appointments/${id}/complete`),
};

export const adminAPI = {
  getStats: () => request('GET', '/admin/stats'),
  getUsers: (params?: any) => {
    const q = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) q.append(k, String(v));
    });
    return request('GET', `/admin/users?${q}`);
  },
  approveAgent: (id: string) => request('PATCH', `/admin/agents/${id}/approve`),
  rejectAgent: (id: string) => request('PATCH', `/admin/agents/${id}/reject`),
  deactivateUser: (id: string) => request('PATCH', `/admin/users/${id}/deactivate`),
};
