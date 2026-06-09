import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import UserAvatar from '../components/UserAvatar';
import '../assets/styles/studio.css';
import '../assets/styles/auth.css';
import '../assets/styles/admin.css'; // Импорт нового чистого CSS

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

  if (loading) return <div className="admin-loader-container"><div className="error-label">Загрузка данных...</div></div>;

  return (
    <div className="settings-white-wrapper">
      <div className="pl-top-bar">
        <h2>Обзор community</h2>
      </div>
      
      {/* ВЕРХНЯЯ СЕТКА КАРТОЧЕК СТАТИСТИКИ */}
      <div className="admin-stats-grid">
        
        {/* БЛОК ДЕНЕГ */}
        <div className="admin-stat-card clickable" onClick={() => navigate('/admin/monetization')}>
          <span className="admin-stat-label">Текущий оборот</span>
          <h2 className="admin-stat-value money">{stats.monthly_earnings}<span className="currency-icon"></span></h2>
          <span className="studio-field-subtext">Доход с премиум</span>
        </div>

        <div className="admin-stat-card clickable" onClick={() => navigate('/admin/monetization')}>
          <span className="admin-stat-label">Премиум аккаунты</span>
          <h2 className="admin-stat-value critical">{stats.premium_users}</h2>
          <span className="studio-field-subtext">Перейти к монетизации →</span>
        </div>

        {/* БЛОК КОНТЕНТА И ЮЗЕРОВ */}
        <div className="admin-stat-card clickable" onClick={() => navigate('/admin/channels')}>
          <span className="admin-stat-label">Всего пользователей</span>
          <h2 className="admin-stat-value">{stats.total_users}</h2>
          <span className="studio-field-subtext">Все каналы платформы →</span>
        </div>

        <div className="admin-stat-card clickable" onClick={() => navigate('/admin/tags')}>
          <span className="admin-stat-label">Всего тегов</span>
          <h2 className="admin-stat-value">{stats.total_tags}</h2>
          <span className="studio-field-subtext">Управление тегами →</span>
        </div>

        {/* БЛОК МОДЕРАЦИИ */}
        <div className="admin-stat-card clickable" onClick={() => navigate('/admin/reports')}>
          <span className="admin-stat-label">Жалоб на проверку</span>
          <h2 className="admin-stat-value">{stats.total_reports}</h2>
          <span className="studio-field-subtext">Посмотреть жалобы →</span>
        </div>

        <div className="admin-stat-card clickable" onClick={() => navigate('/admin/reports')}>
          <span className="admin-stat-label">Критические жалобы</span>
          <h2 className={`admin-stat-value ${stats.urgent_reports > 0 ? 'critical' : 'muted'}`}>
            {stats.urgent_reports}
          </h2>
          <span className="studio-field-subtext">Модерация контента →</span>
        </div>

        {/* ИНФО-БЛОК АКТИВНОСТИ */}
        <div className="admin-stat-card info-mode">
          <span className="admin-stat-label">Активность за 24ч</span>
          <h2 className="admin-stat-value">
            +{stats.new_videos_today} <small>видео</small>
          </h2>
          <span className="studio-field-subtext">+{stats.new_users_today} регистраций сегодня</span>
        </div>
      </div>

      {/* ДВУХКОЛОНОЧНЫЙ БЛОК АНАЛИТИКИ */}
      <div className="settings-columns-grid">
        
        {/* ЛЕВАЯ КОЛОНКА: АНАЛИТИКА ТЕГОВ */}
        <section className="settings-col-section">
          <h3>Аналитика тегов</h3>
          <div className="admin-tags-split">
            
            <div className="input-group">
              <div className="admin-tags-group-title">Топ по просмотрам</div>
              <div className="auth-body">
                {stats.top_tags_views.map((tag, i) => (
                  <div key={i} className="admin-summary-row">
                    <span className="admin-wire-tag">#{tag.name}</span>
                    <span className="studio-field-subtext">{tag.total_views.toLocaleString()} просмотров</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="input-group">
              <div className="admin-tags-group-title">Часто публикуемые</div>
              <div className="auth-body">
                {stats.top_tags_count.map((tag, i) => (
                  <div key={i} className="admin-summary-row">
                    <span className="admin-wire-tag">#{tag.name}</span>
                    <span className="studio-field-subtext">{tag.video_count} видео</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ПРАВАЯ КОЛОНКА: ТОП ЮЗЕР */}
        <section className="settings-col-section">
          <h3>Автор дня</h3>
          <div className="auth-body">
            {stats.top_user_today ? (
              <div className="admin-author-day-card">
                <UserAvatar 
                  user={stats.top_user_today} 
                  sizeClass={`avatar-large ${stats.top_user_today.is_paid == 1 ? 'premium' : ''}`} 
                />
                <div className="admin-author-meta">
                  <strong className="search-author-name">{stats.top_user_today.full_name}</strong>
                  <span className="search-author-handle">@{stats.top_user_today.username}</span>
                </div>
                
                <div className="admin-author-badge-views">
                  <h2>+{stats.top_user_today.today_views.toLocaleString()}</h2>
                  <p className="studio-field-subtext">Просмотров сегодня</p>
                </div>
              </div>
            ) : (
              <p className="studio-field-subtext">Сегодня пока нет активности</p>
            )}
          </div>
        </section>

      </div>
    </div>
  );
};

export default AdminDashboard;