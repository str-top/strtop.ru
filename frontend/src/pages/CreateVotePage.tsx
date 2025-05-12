import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/api'

export default function CreateVotePage() {
  const [projects, setProjects] = useState<Array<{name: string, icon: string}>>([])
  const [showModal, setShowModal] = useState(false)
  const [newProject, setNewProject] = useState({name: '', icon: ''})
  const navigate = useNavigate()

  const publishVote = async () => {
    const { voteCode, resultsCode } = await api.createVote({ projects })
    navigate('/publish', { state: { voteCode, resultsCode } })
  }

  return (
    <div>
      <h2>Добавьте проекты для голосования</h2>
      <button onClick={() => setShowModal(true)}>+ Добавить проект</button>
      
      <div className="projects-list">
        {projects.map((project, index) => (
          <div key={index} className="project-item">
            <img src={project.icon} alt={project.name} />
            <span>{project.name}</span>
          </div>
        ))}
      </div>

      {projects.length >= 2 && (
        <button onClick={publishVote}>Опубликовать голосование</button>
      )}

      {showModal && (
        <div className="modal">
          <input
            placeholder="Название проекта"
            value={newProject.name}
            onChange={(e) => setNewProject({...newProject, name: e.target.value})}
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                const reader = new FileReader()
                reader.onload = (event) => {
                  setNewProject({...newProject, icon: event.target?.result as string})
                }
                reader.readAsDataURL(file)
              }
            }}
          />
          <button onClick={() => {
            setProjects([...projects, newProject])
            setNewProject({name: '', icon: ''})
            setShowModal(false)
          }}>Подтвердить</button>
          <button onClick={() => setShowModal(false)}>Отмена</button>
        </div>
      )}
    </div>
  )
}
