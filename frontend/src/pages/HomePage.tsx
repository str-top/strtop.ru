import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

export default function HomePage() {
  const [code, setCode] = useState('')
  const navigate = useNavigate()

  return (
    <div className="container">
      <h1>Голосование за студенческие проекты</h1>
      <input
        type="text"
        placeholder="Введите код голосования"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
      <button onClick={() => navigate(`/vote/${code}`)}>Войти</button>
      <div>
        <Link to="/create">Создать новое голосование</Link>
      </div>
    </div>
  )
}
