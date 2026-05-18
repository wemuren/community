import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../assets/styles/admin.css';
import VideoCard from '../components/VideoCard'; // Импорт карточки
import { useVideoActions } from '../hooks/useVideoActions'; // Импорт действий
import { useNavigate } from 'react-router-dom';

import { API_BASE_URL, AVATAR_URL } from '@/config/api';

const StudioDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const authUser = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();

  // Функция обновления данных (передаем в хук)
  const fetchStudioStats = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/studio/studio_get_stats.php?user_id=${authUser.id}`);
      if (res.data.status === 'success') {
        setStats(res.data.stats);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const va = useVideoActions(fetchStudioStats);

  const handleEditVideo = (e, videoId) => {
  e.stopPropagation(); // Чтобы при клике на карандаш не открылось само видео
  navigate(`/studio/edit/${videoId}`);
};

  useEffect(() => { fetchStudioStats(); }, [authUser.id]);

  if (loading) return <div className="admin-loader">Загружаем показатели...</div>;
  if (!stats) return <div className="white-card">Ошибка данных</div>;

  return (
    <div className="dashboard-content">
      <div className="admin-header-flex">
        <h2 className="page-title">АНАЛИТИКА КАНАЛА</h2>
      </div>

      {/* ГРИД С ПОКАЗАТЕЛЯМИ */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="stat-card">
          <span className="stat-label">Просмотры</span>
          <h2 className="stat-value">{stats.total_views.toLocaleString()}</h2>
        </div>

        <div className="stat-card">
          <span className="stat-label">Лайки</span>
          <h2 className="stat-value" style={{color: '#ff4d4d'}}>{stats.total_likes.toLocaleString()}</h2>
        </div>

        <div className="stat-card">
          <span className="stat-label">Сохранения</span>
          <h2 className="stat-value" style={{color: '#27ae60'}}>{stats.total_saves.toLocaleString()}</h2>
        </div>

        <div className="stat-card">
          <span className="stat-label">Комментарии</span>
          <h2 className="stat-value">{stats.total_comments.toLocaleString()}</h2>
        </div>

        <div className="stat-card">
          <span className="stat-label">Подписчики</span>
          <h2 className="stat-value" style={{color: '#3498db'}}>{stats.total_subscribers.toLocaleString()}</h2>
        </div>
      </div>

      <div className="admin-split-view" style={{ display: 'flex', gap: '30px', marginTop: '40px' }}>
      
      {/* ЛЕВО: ВАШ ГЛАВНЫЙ ХИТ */}
      <div style={{ flex: 1 }}>
          <h3 className="section-subtitle">Самое популярное видео</h3>
          <div>
            {stats.top_video ? (
              <VideoCard 
                video={stats.top_video}
                isMyProfile={true}    // Показывает кнопки управления (правка/удаление)
                hideAuthor={true}     // СКРЫВАЕТ аватарку и имя автора
                onVideoClick={va.handleVideoClick}
                onPlaylistOpen={va.openPlaylistModal}
                onToggleLiked={va.handleToggleSystem}
                onToggleLater={va.handleToggleSystem}
                onReport={va.handleReport}
                onEdit={handleEditVideo}
              />
            ) : (
              <p className="empty-txt">Видео еще не загружены</p>
            )}
          </div>
        </div>

      {/* ПРАВО: ПОСЛЕДНИЕ КОММЕНТАРИИ */}
      <div style={{ flex: 1.5 }}>
        <h3 className="section-subtitle">Новые комментарии</h3>
        <div className="summary-container" style={{ padding: '15px' }}>
          {stats.recent_comments && stats.recent_comments.length > 0 ? (
            stats.recent_comments.map((c, idx) => (
              <div key={idx} className="dashboard-comment-item" style={{
                padding: '12px 0',
                borderBottom: idx !== stats.recent_comments.length - 1 ? '1px solid #eee' : 'none',
                display: 'flex',
                gap: '12px'
              }}>
                <img 
                  src={c.avatar ? `${AVATAR_URL}${c.avatar}` : '/default-avatar.png'} 
                  style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                  alt=""
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '13px' }}>{c.username}</strong>
                    <span style={{ fontSize: '11px', color: '#999' }}>{new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                  <p style={{ fontSize: '14px', margin: '0 0 6px 0', color: '#333' }}>{c.text}</p>
                  <span style={{ fontSize: '11px', background: '#f0f0f0', padding: '2px 6px', borderRadius: '4px', color: '#666' }}>
                    Видео: {c.video_title}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="empty-txt">Здесь пока тишина...</p>
          )}
        </div>
      </div>

      </div>
    </div>
  );
};

export default StudioDashboard;
