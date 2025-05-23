// @ts-nocheck
// @ts-ignore
import React, { useState, useCallback } from 'react';
// @ts-ignore
import { useNavigate } from 'react-router-dom';
// @ts-ignore
import { api } from '../api/api';
import './CreateVotePage.css';

interface Project {
  name: string;
}

export default function CreateVotePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newProject, setNewProject] = useState<Project>({ name: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const publishVote = useCallback(async () => {
    if (projects.length < 2) {
      setError('Добавьте хотя бы 2 проекта для публикации');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { voteCode, resultsCode } = await api.createVote({ projects });
      navigate('/publish', { 
        state: { 
          voteCode, 
          resultsCode,
          projectCount: projects.length
        } 
      });
    } catch (err) {
      console.error('Failed to create vote:', err);
      setError('Не удалось создать голосование. Пожалуйста, попробуйте снова.');
    } finally {
      setIsSubmitting(false);
    }
  }, [projects, navigate]);

  const handleImageUpload = useCallback(() => {
    setError('Функция загрузки изображений временно недоступна');
  }, []);

  const handleAddProject = useCallback(() => {
    if (!newProject.name.trim()) {
      setError('Пожалуйста, введите название проекта');
      return;
    }

    setProjects(prev => [...prev, { ...newProject, icon: '/placeholder-image.png' }]);
    setNewProject({ name: '' });
    setShowModal(false);
    setError(null);
  }, [newProject]);

  const addProject = useCallback(() => {
    if (!newProject.name.trim()) {
      setError('Пожалуйста, введите название проекта');
      return;
    }

    setProjects(prev => [...prev, { ...newProject }]);
    setNewProject({ name: '' });
    setShowModal(false);
    setError(null);
  }, [newProject]);

  return (
    <div className="create-vote-container">
      <div className="create-vote-header">
        <h1>Создание голосования</h1>
        <p className="subtitle">Добавьте проекты для голосования</p>
      </div>

      <div className="projects-list">
        {projects.map((project, index) => (
          <div key={index} className="project-item">
            <span className="project-name">{project.name}</span>
          </div>
        ))}
      </div>

      <button 
        className="primary-button"
        onClick={() => setShowModal(true)}
        disabled={isSubmitting}
      >
        Добавить проект
      </button>

      {projects.length >= 2 && (
        <button 
          className="primary-button"
          onClick={publishVote}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Публикация...' : 'Опубликовать голосование'}
        </button>
      )}

      {error && <div className="error-message">{error}</div>}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Добавить проект</h2>
            <div className="modal-content">
              <div className="form-group">
                <label htmlFor="project-name">Название проекта</label>
                <input
                  type="text"
                  id="project-name"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ name: e.target.value })}
                  placeholder="Введите название проекта"
                />
              </div>

              <div className="modal-actions">
                <button 
                  className="secondary-button"
                  onClick={() => {
                    setShowModal(false);
                    setError(null);
                  }}
                >
                  Отмена
                </button>
                <button 
                  className="primary-button"
                  onClick={handleAddProject}
                  disabled={isSubmitting}
                >
                  Добавить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

      {error && <div className="error-message">{error}</div>}

      <div className="projects-grid">
        {projects.map((project, index) => (
          <div key={`${project.name}-${index}`} className="project-card">
            <div className="project-image-container">
              <img 
                src={project.icon} 
                alt={project.name} 
                className="project-image"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder-image.png';
                }}
              />
            </div>
            <h3 className="project-title">{project.name}</h3>
            <button 
              className="remove-button"
              onClick={() => {
                setProjects(prev => prev.filter((_, i) => i !== index));
              }}
              aria-label="Удалить проект"
            >
              ×
            </button>
          </div>
        ))}

        <button 
          className="add-project-button"
          onClick={() => setShowModal(true)}
          aria-label="Добавить проект"
        >
          <span className="plus-icon">+</span>
          <span>Добавить проект</span>
        </button>
      </div>

      <div className="action-buttons">
        <button 
          className="publish-button" 
          onClick={publishVote}
          disabled={isSubmitting || projects.length < 2}
        >
          {isSubmitting ? 'Публикация...' : 'Опубликовать голосование'}
          {projects.length > 0 && ` (${projects.length})`}
        </button>
        
        {projects.length > 0 && projects.length < 2 && (
          <p className="min-projects-warning">
            Необходимо добавить минимум 2 проекта
          </p>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Добавить проект</h3>
            
            <div className="form-group">
              <label htmlFor="projectName">Название проекта</label>
              <input
                id="projectName"
                type="text"
                placeholder="Введите название"
                value={newProject.name}
                onChange={(e) => setNewProject(prev => ({
                  ...prev,
                  name: e.target.value
                }))}
                className="form-input"
              />
            </div>

            <div className="modal-actions">
              <button 
                className="secondary-button"
                onClick={() => {
                  setNewProject({ name: '', icon: '' });
                  setShowModal(false);
                }}
              >
                Отмена
              </button>
              <button 
                className="primary-button"
                onClick={addProject}
                disabled={!newProject.name.trim() || !newProject.icon}
              >
                Добавить проект
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
