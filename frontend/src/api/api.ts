const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const api = {
  createVote: async (data: { projects: Array<{name: string, icon: string}> }) => {
    const response = await fetch(`${API_URL}/votes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return response.json()
  },
  
  getVoteProjects: async (code: string) => {
    const response = await fetch(`${API_URL}/votes/${code}`)
    return response.json().then(data => data.projects)
  },
  
  submitVote: async (code: string, userProject: string, ranking: string[]) => {
    await fetch(`${API_URL}/votes/${code}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userProject, ranking })
    })
  },
  
  getVoteResults: async (code: string) => {
    const response = await fetch(`${API_URL}/results/${code}`)
    return response.json()
  }
}
