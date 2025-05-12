import { useLocation } from 'react-router-dom'

export default function PublishPage() {
  const location = useLocation()
  const { voteCode, resultsCode } = location.state

  return (
    <div>
      <h2>Голосование создано!</h2>
      <p>Код для голосования: <strong>{voteCode}</strong></p>
      <p>Ссылка на результаты: 
        <a href={`/results/${resultsCode}`}>
          {window.location.origin}/results/{resultsCode}
        </a>
      </p>
      <p>Результаты будут доступны только по этой ссылке.</p>
    </div>
  )
}
