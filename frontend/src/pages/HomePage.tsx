import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api/api';

export default function HomePage() {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleVoteCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Пожалуйста, введите код голосования');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Verify the code is valid by trying to fetch the projects
      await api.getVoteProjects(code);
      navigate(`/vote/${code}`);
    } catch (err) {
      setError('Неверный код голосования. Пожалуйста, проверьте и попробуйте снова.');
      console.error('Error fetching vote session:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Голосование за студенческие проекты</h1>
      
      <form onSubmit={handleVoteCodeSubmit} className="vote-form">
        <div className="form-group">
          <input
            type="text"
            placeholder="Введите код голосования"
            value={code}
            onChange={(e) => setCode(e.target.value.trim())}
            disabled={isLoading}
            className={error ? 'error' : ''}
          />
          {error && <div className="error-message">{error}</div>}
        </div>
        
        <button 
          type="submit" 
          disabled={isLoading || !code.trim()}
          className="primary-button"
        >
          {isLoading ? 'Проверка...' : 'Войти'}
        </button>
      </form>
      
      <div className="divider">или</div>
      
      <Link to="/create" className="create-link">
        Создать новое голосование
      </Link>
    </div>
  );
}
