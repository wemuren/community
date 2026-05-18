import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import UserAvatar from '../components/UserAvatar';

import { API_BASE_URL } from '@/config/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const authUser = JSON.parse(localStorage.getItem('user'));

  const [selectedUser, setSelectedUser] = useState(null);
  const [userVideos, setUserVideos] = useState([]);
  const [userPlaylists, setUserPlaylists] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/admin/get_stats.php?admin_id=${authUser.id}`);
        setStats(res.data);
      } catch (err) {
        console.error("Ошибка загрузки статистики:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [authUser.id]);

  useEffect(() => {
    if (selectedUser) {
      const fetchUserData = async () => {
        try {
          const vidRes = await axios.get(`${API_BASE_URL}/video/get_user_videos.php?user_id=${selectedUser.id}`);
          setUserVideos(Array.isArray(vidRes.data) ? vidRes.data : []);

          const plRes = await axios.get(`${API_BASE_URL}/playlist/get_user_playlists.php?user_id=${selectedUser.id}&viewer_id=0`);
          const publicOnly = Array.isArray(plRes.data) 
            ? plRes.data.filter(p => p.type === 'custom' && p.is_private == 0) 
            : [];
          setUserPlaylists(publicOnly);
        } catch (err) { console.error(err); }
      };
      fetchUserData();
    }
  }, [selectedUser]);

  if (loading) return <div className="admin-loader">Загрузка данных...</div>;

  return (
    <div className="dashboard-content">
      <h2 className="page-title">ОБЗОР COMMUNITY</h2>
      
      {/* ВЕРХНЯЯ СЕТКА */}
      <div className="stats-grid">
  {/* БЛОК ДЕНЕГ */}
  <div className="stat-card clickable" onClick={() => navigate('/admin/monetization')}>
    <span className="stat-label">Текущий оборот</span>
    <h2 className="stat-value" style={{color: '#2ecc71'}}>{stats.monthly_earnings} Т</h2>
    <span className="sub-text">Прямой доход с Premium</span>
  </div>

  <div className="stat-card clickable" onClick={() => navigate('/admin/monetization')}>
    <span className="stat-label">Premium аккаунты</span>
    <h2 className="stat-value" style={{color: 'var(--brand-red)'}}>{stats.premium_users}</h2>
    <span className="card-link">Перейти →</span>
  </div>

  {/* БЛОК КОНТЕНТА И ЮЗЕРОВ */}
  <div className="stat-card clickable" onClick={() => navigate('/admin/channels')}>
    <span className="stat-label">Всего пользователей</span>
    <h2 className="stat-value">{stats.total_users}</h2>
    <span className="card-link">Все каналы →</span>
  </div>

  <div className="stat-card clickable" onClick={() => navigate('/admin/tags')}>
    <span className="stat-label">Всего тегов</span>
    <h2 className="stat-value">{stats.total_tags}</h2>
    <span className="card-link">Управление →</span>
  </div>

  {/* БЛОК МОДЕРАЦИИ */}
  <div className="stat-card clickable" onClick={() => navigate('/admin/reports')}>
    <span className="stat-label">Жалоб на проверку</span>
    <h2 className="stat-value">{stats.total_reports}</h2>
    <span className="card-link">Посмотреть все →</span>
  </div>

  <div className="stat-card clickable" onClick={() => navigate('/admin/reports')}>
    <span className="stat-label">Критические жалобы</span>
    <h2 className="stat-value" style={{color: stats.urgent_reports > 0 ? '#C20000' : '#888'}}>
      {stats.urgent_reports}
    </h2>
    <span className="card-link" style={{color: stats.urgent_reports > 0 ? '#C20000' : ''}}>Модерация →</span>
  </div>

  {/* ИНФО-БЛОК АКТИВНОСТИ (не кликабельный, просто инфа) */}
  <div className="stat-card info-mode" style={{background: '#f8f8f8', border: 'none'}}>
    <span className="stat-label">Активность за 24ч</span>
    <h2 className="stat-value">+{stats.new_videos_today} <small style={{fontSize: '14px', color: '#888'}}>видео</small></h2>
    <span className="sub-text">+{stats.new_users_today} регистраций сегодня</span>
  </div>
</div>

      <div className="admin-split-view" style={{display: 'flex', gap: '40px', marginTop: '40px'}}>
        
        {/* ЛЕВАЯ КОЛОНКА: ТЕГИ */}
        <div style={{flex: 1.5}}>
          <h3 className="section-subtitle">Аналитика тегов</h3>
          <div className="tags-analysis-grid" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
            
            <div className="summary-container">
              <p className="section-label" style={{marginBottom: '15px'}}>Топ по просмотрам</p>
              {stats.top_tags_views.map((tag, i) => (
                <div key={i} className="summary-item">
                  <span className="summary-tag">#{tag.name}</span>
                  <span className="summary-count">{tag.total_views} просмотров</span>
                </div>
              ))}
            </div>

            <div className="summary-container">
              <p className="section-label" style={{marginBottom: '15px'}}>Часто публикуемые</p>
              {stats.top_tags_count.map((tag, i) => (
                <div key={i} className="summary-item">
                  <span className="summary-tag">#{tag.name}</span>
                  <span className="summary-count">{tag.video_count} видео</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ПРАВАЯ КОЛОНКА: ТОП ЮЗЕР */}
        <div style={{flex: 1}}>
          <h3 className="section-subtitle">Автор дня</h3>
          <div className="summary-container" style={{height: 'calc(100% - 40px)'}}>
            {stats.top_user_today ? (
              <div className="top-user-card" style={{textAlign: 'center', padding: '20px'}}>
                <UserAvatar 
          user={stats.top_user_today} 
          sizeClass={`avatar-large ${stats.top_user_today.is_paid == 1 ? 'premium' : ''}`} 
        />
                <strong>{stats.top_user_today.full_name}</strong>
                <div className="sub-text">@{stats.top_user_today.username}</div>
                <div className="highlight-box" style={{marginTop: '15px', background: 'var(--brand-red-light)', padding: '10px', borderRadius: '10px'}}>
                  <span style={{color: 'var(--brand-red)', fontWeight: '800'}}>+{stats.top_user_today.today_views.toLocaleString()}</span>
                  <p style={{fontSize: '11px', textTransform: 'uppercase', margin: 0}}>Просмотров сегодня</p>
                </div>
              </div>
            ) : (
              <p className="empty-txt">Сегодня пока нет активности</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;