import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { DragDropList } from '../components/DragDropList'
import { api } from '../api/api'

export default function VotePage() {
  const { code } = useParams()
  const [step, setStep] = useState(1)
  const [projects, setProjects] = useState<Array<{id: string, name: string, icon: string}>>([])
  const [selectedProject, setSelectedProject] = useState('')
  const [rankedProjects, setRankedProjects] = useState<string[]>([])
  const [voted, setVoted] = useState(false)

  useEffect(() => {
    api.getVoteProjects(code!).then(data => setProjects(data))
  }, [code])

  const submitVote = async () => {
    await api.submitVote(code!, selectedProject, rankedProjects)
    setVoted(true)
  }

  if (voted) return <div>Благодарим за участие!</div>

  return (
    <div>
      {step === 1 && (
        <div>
          <h2>Выберите свой проект</h2>
          {projects.map(project => (
            <div key={project.id}>
              <input
                type="radio"
                id={project.id}
                name="project"
                checked={selectedProject === project.id}
                onChange={() => setSelectedProject(project.id)}
              />
              <label htmlFor={project.id}>
                <img src={project.icon} alt={project.name} />
                {project.name}
              </label>
            </div>
          ))}
          <button 
            onClick={() => setStep(2)} 
            disabled={!selectedProject}
          >
            Продолжить
          </button>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2>Расставьте проекты по местам</h2>
          <DragDropList 
            items={projects.filter(p => p.id !== selectedProject)}
            onReorder={setRankedProjects}
          />
          <button 
            onClick={submitVote}
            disabled={rankedProjects.length !== projects.length - 1}
          >
            Утвердить голосование
          </button>
        </div>
      )}
    </div>
  )
}
