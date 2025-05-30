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
  icon: File;
  previewUrl: string;
}

export default function CreateVotePage() {
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newProject, setNewProject] = useState<Project>({ name: '', icon: null, previewUrl: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const cleanupPreviewUrls = useCallback(() => {
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setPreviewUrls([]);
  }, [previewUrls]);

  React.useEffect(() => {
    return cleanupPreviewUrls;
  }, [cleanupPreviewUrls]);

  const publishVote = useCallback(async () => {
    if (projects.length < 2) {
      setError('Добавьте хотя бы 2 проекта для публикации');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // First upload all images
      const files = projects.map(p => p.icon as File);
      const uploadResponses = await api.uploadImages(files);
      
      // Create projects with uploaded URLs
      const projectsWithUrls = projects.map((project, index) => ({
        name: project.name,
        icon: uploadResponses[index].url,
        imageUrl: uploadResponses[index].url
      }));

      const { voteCode, resultsCode } = await api.createVote({ projects: projectsWithUrls });
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

  const addProject = useCallback(() => {
    if (!newProject.name.trim()) {
      setError('Пожалуйста, введите название проекта');
      return;
    }
    
    if (!newProject.icon) {
      setError('Пожалуйста, загрузите иконку для проекта');
      return;
    }

    setProjects(prev => [...prev, { ...newProject }]);
    setNewProject({ name: '', icon: null, previewUrl: '' });
    setShowModal(false);
    setError(null);
  }, [newProject]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Пожалуйста, загрузите изображение');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Размер файла не должен превышать 2МБ');
      return;
    }

    // Create a preview URL
    const previewUrl = URL.createObjectURL(file);
    setPreviewUrls(prev => [...prev, previewUrl]);
    setNewProject(prev => ({
      ...prev,
      icon: file,
      previewUrl
    }));
    setError(null);
  }, [setPreviewUrls]);

  return (
    <div className="create-vote-container">
      <div className="create-vote-header">
        <h1>Создание голосования</h1>
        <p className="subtitle">Добавьте проекты для голосования</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="projects-grid">
        {projects.map((project, index) => (
          <div key={`${project.name}-${index}`} className="project-card">
            <div className="project-image-container">
              <img 
                src={project.previewUrl || project.icon} 
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

            <div className="form-group">
              <label className="file-upload-label">
                {newProject.icon ? 'Изменить иконку' : 'Загрузить иконку'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                  id="fileInput"
                />
                <div 
                  className="upload-button"
                  onClick={() => document.getElementById('fileInput')?.click()}
                >
                  {newProject.previewUrl ? (
                    <img 
                      src={newProject.previewUrl} 
                      alt="Preview" 
                      className="preview-image"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-image.png';
                      }}
                    />
                  ) : (
                    <span className="upload-icon">+</span>
                  )}
                </div>
              </label>
            </div>

            <div className="modal-buttons">
              <button 
                className="secondary-button"
                onClick={() => setShowModal(false)}
              >
                Отмена
              </button>
              <button 
                className="primary-button"
                onClick={addProject}
                disabled={!newProject.name.trim() || !newProject.icon}
              >
                Добавить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
