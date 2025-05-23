// Types
export interface Project {
  id: string;
  name: string;
  icon: string;
}

export interface VoteSession {
  voteCode: string;
  resultsCode: string;
  projects: Project[];
  votes: Array<{
    userId: string;
    userProject: string;
    ranking: string[];
  }>;
  createdAt: string;
}

export interface ApiError extends Error {
  status?: number;
  message: string;
}

// Environment
// In development, requests will be proxied to the backend
const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, ''); // Remove trailing slashes

// Helper function to handle fetch with credentials
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  // Don't set Content-Type if it's FormData, let browser handle it
  const headers: Record<string, string> = {
    ...options.headers as Record<string, string>,
  };

  let body = options.body;
  
  // Only set Content-Type for non-FormData bodies
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    
    // Stringify the body if it's an object
    if (typeof options.body === 'object') {
      body = JSON.stringify(options.body);
    }
  }

  if (body && typeof body === 'object' && !(body instanceof FormData)) {
    body = JSON.stringify(body);
  }
  
  // Set Content-Length for string bodies
  if (typeof body === 'string') {
    headers['Content-Length'] = new TextEncoder().encode(body).length.toString();
  }

  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    body,
    credentials: 'include', // Include credentials (cookies, HTTP authentication)
    headers,
  });

  if (!response.ok) {
    const error = new Error(response.statusText) as ApiError;
    error.status = response.status;
    try {
      const data = await response.json();
      error.message = data.message || response.statusText;
    } catch (e) {
      error.message = response.statusText;
    }
    throw error;
  }

  return response.json();
};

export const api = {
  uploadImages: async (files: File[]): Promise<string[]> => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file, file.name);
    });

    const response = await fetchWithAuth('/upload', {
      method: 'POST',
      body: formData,
    });

    return response;
  },
  createVote: async (data: { projects: Array<{ name: string; icon: string }> }): Promise<{
    voteCode: string;
    resultsCode: string;
  }> => {
    const body = JSON.stringify(data);
    console.log('Request body size (bytes):', new TextEncoder().encode(body).length);
    return fetchWithAuth('/votes', {
      method: 'POST',
      body
    });
  },
  
  getVoteProjects: async (code: string): Promise<Project[]> => {
    const data = await fetchWithAuth(`/api/votes/${code}`);
    return data.projects;
  },
  
  submitVote: async (code: string, userProject: string, ranking: string[]): Promise<void> => {
    await fetchWithAuth(`/api/votes/${code}/vote`, {
      method: 'POST',
      body: JSON.stringify({ userProject, ranking })
    });
  },
  
  getVoteResults: async (code: string): Promise<Array<{
    project: Project;
    votes: number;
    averageRank: number;
  }>> => {
    return fetchWithAuth(`/api/results/${code}`);
  }
};
