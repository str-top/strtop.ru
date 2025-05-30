// Types
export interface Project {
  id: string;
  name: string;
  icon: string;
  imageUrl?: string;
}

export interface UploadResponse {
  url: string;
  filename: string;
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
  // Only set Content-Type to application/json if body is not FormData
  let body = options.body;
  const headers: Record<string, string> = {
    ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
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
  // Upload image function
  uploadImage: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetchWithAuth('/upload', {
      method: 'POST',
      body: formData,
      // Remove Content-Type header to let browser set it automatically for multipart/form-data
      headers: {
        'Content-Type': undefined
      }
    });

    return response.json();
  },

  uploadImages: async (files: File[]): Promise<UploadResponse[]> => {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));

    const response = await fetchWithAuth('/api/upload/batch', {
      method: 'POST',
      body: formData,
      // Remove Content-Type header to let browser set it automatically for multipart/form-data
      headers: {
        'Content-Type': undefined
      }
    });

    return response.json();

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    return response.json();
  },
  createVote: async (data: { projects: Array<{ name: string; icon: File | string; imageUrl?: string }> }): Promise<{
    voteCode: string;
    resultsCode: string;
  }> => {
    // Separate files from URLs
    const files: File[] = [];
    const projectsWithUrls = data.projects.map(project => {
      if (project.icon instanceof File) {
        files.push(project.icon);
        return {
          name: project.name,
          icon: '', // Will be filled after upload
          imageUrl: '' // Will be filled after upload
        };
      }
      return project;
    });

    // Upload all files in one batch
    if (files.length > 0) {
      const uploadResponses = await api.uploadImages(files);
      
      // Match uploaded files back to their projects
      projectsWithUrls.forEach((project, index) => {
        if (project.icon === '') {
          project.icon = uploadResponses[index].url;
          project.imageUrl = uploadResponses[index].url;
        }
      });
    }

    // Create a new array of projects with only the required fields
    const voteProjects = projectsWithUrls.map(project => ({
      name: project.name,
      icon: project.imageUrl || project.icon, // Use imageUrl if available, otherwise use icon
      imageUrl: project.imageUrl
    }));

    const body = JSON.stringify({ projects: voteProjects });
    console.log('Request body size (bytes):', new TextEncoder().encode(body).length);
    return fetchWithAuth('/votes', {
      method: 'POST',
      body
    });
  },
  
  getVoteProjects: async (code: string): Promise<Project[]> => {
    const data = await fetchWithAuth(`/votes/${code}`);
    return data.projects;
  },
  
  submitVote: async (code: string, userProject: string, ranking: string[]): Promise<void> => {
    await fetchWithAuth(`/votes/${code}/vote`, {
      method: 'POST',
      body: JSON.stringify({ userProject, ranking })
    });
  },
  
  getVoteResults: async (code: string): Promise<Array<{
    project: Project;
    votes: number;
    averageRank: number;
  }>> => {
    return fetchWithAuth(`/results/${code}`);
  }
};
