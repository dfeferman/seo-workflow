// Zentrales API-Abstraktionslayer. Alle Datenzugriffe laufen ueber dieses Modul.

const BASE_URL = ''

let _token: string | null = null
let _isRefreshing = false

export function getToken(): string | null {
  return _token
}

export function setToken(token: string): void {
  _token = token
}

export function clearToken(): void {
  _token = null
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  skipRetry = false
): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401 && !skipRetry && !_isRefreshing) {
    _isRefreshing = true
    try {
      const data = await request<{ token: string; user?: unknown }>('POST', '/api/auth/refresh', undefined, true)
      setToken(data.token)
      if (data.user != null && typeof data.user === 'object') {
        window.dispatchEvent(new CustomEvent('auth:session-refreshed', { detail: { user: data.user } }))
      }
      _isRefreshing = false
      return request<T>(method, path, body, true)
    } catch {
      _isRefreshing = false
      clearToken()
      window.dispatchEvent(new Event('auth:signout'))
      throw new Error('Session abgelaufen. Bitte erneut anmelden.')
    }
  }

  if (!res.ok) {
    const text = await res.text()
    let message = text?.trim() || `Request failed: ${res.status}`
    try {
      const j = JSON.parse(text) as { error?: string }
      if (typeof j?.error === 'string' && j.error) message = j.error
    } catch {
      /* Body ist kein JSON */
    }
    throw new Error(message)
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

export const apiClient = {
  auth: {
    register: (email: string, password: string) =>
      request<{ message: string }>('POST', '/api/auth/register', { email, password }, true),
    login: (email: string, password: string) =>
      request<{ user: any; token: string }>('POST', '/api/auth/login', { email, password }, true),
    me: () => request<any>('GET', '/api/auth/me'),
    refresh: () =>
      request<{ token: string; user: any }>('POST', '/api/auth/refresh', undefined, true),
    logout: () => request<void>('POST', '/api/auth/logout', undefined, true),
    forgotPassword: (email: string) =>
      request<{ message: string }>('POST', '/api/auth/forgot-password', { email }, true),
    resetPassword: (token: string, password: string) =>
      request<{ message: string }>('POST', '/api/auth/reset-password', { token, password }, true),
  },

  admin: {
    getUsers: () => request<any[]>('GET', '/api/admin/users'),
    approveUser: (id: string) => request<any>('POST', `/api/admin/users/${id}/approve`),
    revokeUser: (id: string) => request<any>('POST', `/api/admin/users/${id}/revoke`),
    setUserPassword: (id: string, password: string) =>
      request<any>('POST', `/api/admin/users/${id}/set-password`, { password }),
    deleteUser: (id: string) => request<void>('DELETE', `/api/admin/users/${id}`),
  },

  projects: {
    getAll: () => request<any[]>('GET', '/api/projects'),
    getById: (id: string) => request<any>('GET', `/api/projects/${id}`),
    create: (data: { name: string }) => request<any>('POST', '/api/projects', data),
    update: (id: string, data: Partial<{ name: string }>) =>
      request<any>('PUT', `/api/projects/${id}`, data),
    delete: (id: string) => request<void>('DELETE', `/api/projects/${id}`),
  },

  categories: {
    getByProject: (projectId: string) =>
      request<any[]>('GET', `/api/categories/by-project/${projectId}`),
    getById: (id: string) => request<any>('GET', `/api/categories/${id}`),
    create: (data: any) => request<any>('POST', '/api/categories', data),
    update: (id: string, data: any) => request<any>('PUT', `/api/categories/${id}`, data),
    delete: (id: string) => request<void>('DELETE', `/api/categories/${id}`),
  },

  artifacts: {
    getByCategory: (categoryId: string) =>
      request<any[]>('GET', `/api/artifacts/by-category/${categoryId}`),
    getByTemplate: (templateId: string) =>
      request<any[]>('GET', `/api/artifacts/by-template/${templateId}`),
    getByPhaseCode: (phase: string, artifactCode: string) =>
      request<any[]>(
        'GET',
        `/api/artifacts/by-phase-code?phase=${encodeURIComponent(phase)}&code=${encodeURIComponent(artifactCode)}`
      ),
    getById: (id: string) => request<any>('GET', `/api/artifacts/${id}`),
    create: (data: any) => request<any>('POST', '/api/artifacts', data),
    update: (id: string, data: any) => request<any>('PUT', `/api/artifacts/${id}`, data),
    delete: (id: string) => request<void>('DELETE', `/api/artifacts/${id}`),
  },

  artifactResults: {
    getByArtifact: (artifactId: string) =>
      request<any[]>('GET', `/api/artifact-results/by-artifact/${artifactId}`),
    create: (data: { artifact_id: string; result_text: string; source?: string }) =>
      request<any>('POST', '/api/artifact-results', data),
    update: (id: string, data: { status?: string; result_text?: string }) =>
      request<any>('PUT', `/api/artifact-results/${id}`, data),
  },

  templates: {
    getAll: () => request<any[]>('GET', '/api/templates'),
    getById: (id: string) => request<any>('GET', `/api/templates/${id}`),
    create: (data: any) => request<any>('POST', '/api/templates', data),
    update: (id: string, data: any) => request<any>('PUT', `/api/templates/${id}`, data),
    delete: (id: string) => request<void>('DELETE', `/api/templates/${id}`),
  },

  phaseOutputTemplates: {
    getAll: () => request<any[]>('GET', '/api/phase-output-templates'),
    upsert: (phase: string, data: { template_text: string; description?: string }) =>
      request<any>('PUT', `/api/phase-output-templates/${phase}`, data),
  },

  categoryPhaseOutputs: {
    getByCategory: (categoryId: string) =>
      request<any[]>('GET', `/api/category-phase-outputs/by-category/${categoryId}`),
    create: (data: any) => request<any>('POST', '/api/category-phase-outputs', data),
    delete: (id: string) => request<void>('DELETE', `/api/category-phase-outputs/${id}`),
  },

  categoryReferenceDocs: {
    getByCategory: (categoryId: string) =>
      request<any[]>('GET', `/api/category-reference-docs/by-category/${categoryId}`),
    create: (data: any) => request<any>('POST', '/api/category-reference-docs', data),
    update: (id: string, data: any) =>
      request<any>('PUT', `/api/category-reference-docs/${id}`, data),
    delete: (id: string) => request<void>('DELETE', `/api/category-reference-docs/${id}`),
  },
}
