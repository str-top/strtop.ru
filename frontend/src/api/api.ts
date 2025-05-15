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
const API_URL = import.meta.env.VITE_API_URL || '/api';

// Helper function to handle fetch with credentials
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  // Stringify the body if it's an object and Content-Type is application/json
  let body = options.body;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  };

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
  createVote: async (data: { projects: Array<{ name: string; icon: string }> }): Promise<{
    voteCode: string;
    resultsCode: string;
  }> => {
    return fetchWithAuth('/api/votes', {
      method: 'POST',
      body: JSON.stringify(data)
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
