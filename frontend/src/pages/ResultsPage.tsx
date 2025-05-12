import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api/api'

export default function ResultsPage() {
  const { code } = useParams()
  const [results, setResults] = useState<Array<{
    project: {id: string, name: string, icon: string},
    votes: number,
    averageRank: number
  }>>([])

  useEffect(() => {
    api.getVoteResults(code!).then(data => setResults(data))
  }, [code])

  return (
    <div>
      <h2>Результаты голосования</h2>
      <div className="results-list">
        {results
          .sort((a, b) => a.averageRank - b.averageRank)
          .map((result, index) => (
            <div key={result.project.id} className="result-item">
              <div className="position">{index + 1}</div>
              <img src={result.project.icon} alt={result.project.name} />
              <div className="name">{result.project.name}</div>
              <div className="votes">({result.votes} голосов)</div>
            </div>
          ))}
      </div>
    </div>
  )
}
