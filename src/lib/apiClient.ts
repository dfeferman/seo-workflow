// Zentrales API-Abstraktionslayer. Alle Hooks importieren nur noch apiClient.
// Niemals supabase direkt in Hooks verwenden.

const BASE_URL = '' // Vite-Proxy leitet /api/* weiter; in Prod: gleicher Origin

function getToken(): string | null {
  return localStorage.getItem('auth_token')
}

export function setToken(token: string): void {
  localStorage.setItem('auth_token', token)
}

export function clearToken(): void {
  localStorage.removeItem('auth_token')
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Request failed: ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export const apiClient = {
  auth: {
    register: (email: string, password: string) =>
      request<{ user: any; token: string }>('POST', '/api/auth/register', { email, password }),
    login: (email: string, password: string) =>
      request<{ user: any; token: string }>('POST', '/api/auth/login', { email, password }),
    me: () => request<any>('GET', '/api/auth/me'),
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
