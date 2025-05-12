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
// Get API URL from environment or use default
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

// Helper function to handle fetch with credentials
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    credentials: 'include', // Include credentials (cookies, HTTP authentication)
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
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

// Helper function to handle responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error: ApiError = new Error(response.statusText);
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
