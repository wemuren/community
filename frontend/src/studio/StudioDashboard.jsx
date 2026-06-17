import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import VideoCard from '../components/VideoCard';
import UserAvatar from '../components/UserAvatar';
import { useVideoActions } from '../hooks/useVideoActions';
import { Eye, Heart, Folder, MessageSquare, Users } from 'lucide-react';

// Переиспользуем монолитные стили платформы и админки
import '../assets/styles/studio.css';
import '../assets/styles/auth.css';
import '../assets/styles/admin.css';

import { API_BASE_URL } from '@/config/api';

const StudioDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const authUser = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();

  const fetchStudioStats = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/studio/studio_get_stats.php?user_id=${authUser.id}`);
      if (res.data.status === 'success') {
        setStats(res.data.stats);
      }
    } catch (err) { 
      console.error("Ошибка загрузки аналитики дашборда:", err); 
    } finally { 
      setLoading(false); 
    }
  };

  const va = useVideoActions(fetchStudioStats);

  const handleEditVideo = (e, videoId) => {
    e.stopPropagation();
    navigate(`/studio/edit/${videoId}`);
  };

  useEffect(() => { 
    if (authUser?.id) fetchStudioStats(); 
  }, [authUser?.id]);

  if (loading) return <div className="admin-loader-container"><div className="error-label">Загружаем показатели...</div></div>;
  if (!stats) return <div className="settings-white-wrapper"><p className="error-label">Ошибка получения данных аналитики</p></div>;

  return (
    <div className="settings-white-wrapper">
      
      {/* КНОПКА НАЗАД */}
      <div className="settings-back-action" onClick={() => navigate(-1)}>
        <ChevronLeft size={16} strokeWidth={2} /> Назад
      </div>

      <div className="pl-top-bar">
        <h2>Аналитика канала</h2>
      </div>

      {/* ГРИД С ПОКАЗАТЕЛЯМИ (ПОВТОРЯЕТ АДМИНКУ) */}
      {/* ВЕРХНЯЯ СЕТКА КАРТОЧЕК СТАТИСТИКИ */}
      <div className="admin-stats-grid">
        
        <div className="admin-stat-card">
          <div className="admin-stat-card-header">
            <span className="admin-stat-label">Просмотры</span>
            <Eye size={18} className="admin-stat-icon-views" />
          </div>
          <h2 className="admin-stat-value">{stats.total_views.toLocaleString()}</h2>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card-header">
            <span className="admin-stat-label">Лайки</span>
            <Heart size={18} className="admin-stat-icon-likes" />
          </div>
          <h2 className="admin-stat-value critical">{stats.total_likes.toLocaleString()}</h2>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card-header">
            <span className="admin-stat-label">Сохранения</span>
            <Folder size={18} className="admin-stat-icon-saves" />
          </div>
          <h2 className="admin-stat-value money">{stats.total_saves.toLocaleString()}</h2>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card-header">
            <span className="admin-stat-label">Комментарии</span>
            <MessageSquare size={18} className="admin-stat-icon-comments" />
          </div>
          <h2 className="admin-stat-value">{stats.total_comments.toLocaleString()}</h2>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card-header">
            <span className="admin-stat-label">Подписчики</span>
            <Users size={18} className="admin-stat-icon-subs" />
          </div>
          <h2 className="admin-stat-value">{stats.total_subscribers.toLocaleString()}</h2>
        </div>

      </div>

      {/* СЕТКА ИЗ STUDIO.CSS (БЕЗ ИНЛАЙН СЕТОК) */}
      <div className="settings-columns-grid">
      
        {/* ЛЕВАЯ КОЛОНКА: ВАШ ГЛАВНЫЙ ХИТ */}
        <section className="settings-col-section">
          <h3>Самое популярное видео</h3>
          <div className="auth-body top-video-body">
            {stats.top_video ? (
              <VideoCard 
                video={stats.top_video}
                isMyProfile={true}
                hideAuthor={true}
                onVideoClick={va.handleVideoClick}
                onPlaylistOpen={va.openPlaylistModal}
                onToggleLiked={va.handleToggleSystem}
                onToggleLater={va.handleToggleSystem}
                onReport={va.handleReport}
                onEdit={handleEditVideo}
              />
            ) : (
              <p className="studio-field-subtext">Видеоролики еще не загружены</p>
            )}
          </div>
        </section>

       {/* ПРАВАЯ КОЛОНКА: СВЕЖИЕ КОММЕНТАРИИ */}
        <section className="settings-col-section">
          <h3>Новые комментарии</h3>
          <div className="auth-body">
            <div className="comments-list">
              {stats.recent_comments && stats.recent_comments.length > 0 ? (
                stats.recent_comments.map((c, idx) => (
                  <div key={idx} className="comment-item">
                    
                    {/* Аватарка автора (ссылка на профиль) */}
                    
                      <img
                        src={c.avatar ? `${API_BASE_URL}/uploads/avatars/${c.avatar}` : '/default-avatar.png'}
                        alt=""
                        className="comment-avatar"
                      />

                    {/* Тело комментария */}
                    <div className="comment-body">
                      <div className="comment-meta">
                       <span className="comment-author">
                          {c.full_name || `@${c.username}`}
                        </span>
                        <span className="comment-date">
                          {new Date(c.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {/* Текст комментария */}
                      <p className="comment-text">{c.text}</p>
                      
                      {/* Метка с названием видео (в том же стиле мета-данных) */}
                      <span className="comment-date" style={{ display: 'block', marginTop: '4px' }}>
                        Видео: <strong style={{ color: 'var(--text-main)', fontWeight: 500 }}>{c.video_title}</strong>
                      </span>
                    </div>

                  </div>
                ))
              ) : (
                <p className="studio-field-subtext">Здесь пока ничего нет...</p>
              )}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default StudioDashboard;