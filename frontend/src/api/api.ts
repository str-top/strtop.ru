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
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
    const response = await fetch(`${API_URL}/votes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },
  
  getVoteProjects: async (code: string): Promise<Project[]> => {
    const response = await fetch(`${API_URL}/votes/${code}`);
    const data = await handleResponse(response);
    return data.projects;
  },
  
  submitVote: async (code: string, userProject: string, ranking: string[]): Promise<void> => {
    const response = await fetch(`${API_URL}/votes/${code}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userProject, ranking })
    });
    await handleResponse(response);
  },
  
  getVoteResults: async (code: string): Promise<Array<{
    project: Project;
    votes: number;
    averageRank: number;
  }>> => {
    const response = await fetch(`${API_URL}/results/${code}`);
    return handleResponse(response);
  }
};
