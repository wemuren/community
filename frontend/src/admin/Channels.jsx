import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Video, Users, Crown, ShieldAlert, UserMinus } from 'lucide-react';
import '../assets/styles/studio.css';
import '../assets/styles/auth.css';
import '../assets/styles/admin.css';
import UserAvatar from '../components/UserAvatar';
import AdminUserModal from './components/AdminUserModal';

import { API_BASE_URL } from '@/config/api';

const Channels = () => {
  const [channels, setChannels] = useState([]);
  const [sortBy, setSortBy] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const authUser = JSON.parse(localStorage.getItem('user'));

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [userVideos, setUserVideos] = useState([]);

  const fetchChannels = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/admin/get_channels.php?admin_id=${authUser.id}&search=${searchTerm}&sort=${sortBy}&page=${page}`
      );
      setChannels(Array.isArray(res.data.channels) ? res.data.channels : []);
      setTotalPages(res.data.total_pages || 1);
    } catch (err) { 
      console.error(err); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    setPage(1);
  }, [searchTerm, sortBy]);

  useEffect(() => {
    fetchChannels();
  }, [page, sortBy]);

  useEffect(() => {
  if (selectedUser) {
    const fetchUserData = async () => {
      try {
        // 1. Грузим видео
        const vidRes = await axios.get(`${API_BASE_URL}/video/get_user_videos.php?user_id=${selectedUser.id}`);
        setUserVideos(Array.isArray(vidRes.data) ? vidRes.data : []);

        // 2. Стучимся к плейлистам
        const plRes = await axios.get(`${API_BASE_URL}/playlist/get_user_playlists.php?user_id=${selectedUser.id}&viewer_id=0`);
        
        // ИСПРАВЛЕНО: Достаем массив из ключа res.data.playlists
        const rawPlaylists = plRes.data && Array.isArray(plRes.data.playlists) ? plRes.data.playlists : [];
        
        // Оставляем только кастомные и публичные
        const publicOnly = rawPlaylists.filter(p => p.type === 'custom' && Number(p.is_private) === 0);
        
        setUserPlaylists(publicOnly);

      } catch (err) { 
        console.error("Ошибка загрузки данных юзера:", err); 
      }
    };
    fetchUserData();
  } else {
    setUserVideos([]);
    setUserPlaylists([]);
  }
}, [selectedUser]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => { fetchChannels(); }, 500);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const handleResetName = async (userId) => {
    if (!window.confirm("Сбросить имя пользователя?")) return;
    await axios.post(`${API_BASE_URL}/admin/reset_nickname.php`, { admin_id: authUser.id, user_id: userId });
    
    fetchChannels(); 
    if (selectedUser) {
      setSelectedUser({ ...selectedUser, full_name: `user${userId}`, name_reset: 1 });
    }
  };

  const toggleStatus = async (userId, type, currentVal) => {
    const url = type === 'premium' ? '/admin/update_premium_status.php' : '/admin/update_user_status.php';
    const field = type === 'premium' ? 'is_paid' : 'is_active';
    const newVal = currentVal == 1 ? 0 : 1;

    await axios.post(`${API_BASE_URL}${url}`, {
      admin_id: authUser.id, user_id: userId, [field]: newVal
    });

    fetchChannels();
    if (selectedUser) {
      setSelectedUser({ ...selectedUser, [field]: newVal });
    }
  };

  return (
    <div className="settings-white-wrapper">
      
      {/* ВЕРХНЯЯ СТРОКА: ТУЛБАР И ПОИСК */}
      <div className="admin-toolbar-row">
        <div className="pl-top-bar">
          <h2>Управление каналами</h2>
        </div>
        <div className="search-wrapper">
          <div className="search-icon"><Search size={16} color="var(--text-muted)" /></div>
          <input 
            type="text" 
            placeholder="Поиск по имени, нику или email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* ПАНЕЛЬ СОРТИРОВКИ */}
      <div className="admin-sort-toolbar">
        <span className="admin-stat-label">Сортировка:</span>
        <button className={`tag-btn ${sortBy === 'newest' ? 'active' : ''}`} onClick={() => setSortBy('newest')}>Новые</button>
        <button className={`tag-btn ${sortBy === 'name' ? 'active' : ''}`} onClick={() => setSortBy('name')}>А-Я</button>
        <button className={`tag-btn ${sortBy === 'popular' ? 'active' : ''}`} onClick={() => setSortBy('popular')}>По популярности</button>
        <button className={`tag-btn ${sortBy === 'videos' ? 'active' : ''}`} onClick={() => setSortBy('videos')}>По количеству видео</button>
      </div>

      {/* КАРКАСНАЯ ТАБЛИЦА КАНАЛОВ */}
      <div className="admin-table">
        <div className="admin-table-header">
          <div className="admin-col admin-col-id">ID</div>
          <div className="admin-col admin-col-user"><span className="admin-stat-label">Пользователь</span></div>
          <div className="admin-col admin-col-date"><span className="admin-stat-label">Дата регистрации</span></div>
          <div className="admin-col admin-col-stats"><span className="admin-stat-label">Активность</span></div>
          <div className="admin-col admin-col-actions"><span className="admin-stat-label">Действия</span></div>
        </div>

        {channels.map(u => (
          <div className="admin-table-row clickable" key={u.id} onClick={() => setSelectedUser(u)}>
            <div className="admin-col admin-col-id">{u.id}</div>
            
            <div className="admin-col admin-col-user">
              <div className="admin-user-cell">
                <UserAvatar user={u} sizeClass="avatar-mini" />
                <div className="admin-user-text">
                  <strong className="admin-user-fullname">{u.full_name || u.username}</strong>
                  <span className="studio-field-subtext">@{u.username}</span>
                </div>
              </div>
            </div>
            
            <div className="admin-col admin-col-date">
              <span>{new Date(u.created_at).toLocaleDateString('ru-RU')}</span>
            </div>
            
            <div className="admin-col admin-col-stats">
              <div className="admin-stat-badge-item" title="Видео">
                <Video size={16} />
                <span>{u.video_count}</span>
              </div>
              <div className="admin-stat-badge-item" title="Подписчики">
                <Users size={16} />
                <span>{u.sub_count}</span>
              </div>
            </div>
            
            <div className="admin-col admin-col-actions" onClick={e => e.stopPropagation()}>
               <button 
                 className={`admin-action-btn-circle premium-toggle ${u.is_paid == 1 ? 'active' : ''}`} 
                 onClick={() => toggleStatus(u.id, 'premium', u.is_paid)} 
                 title="Premium status"
               >
                 <Crown size={16} />
               </button>
               <button 
                 className={`admin-action-btn-circle ban-toggle ${u.is_active == 0 ? 'banned' : ''}`} 
                 onClick={() => toggleStatus(u.id, 'block', u.is_active)} 
                 title="Блокировка"
               >
                 <ShieldAlert size={16} />
               </button>
               <button 
                 className="admin-action-btn-circle" 
                 onClick={() => handleResetName(u.id)} 
                 title="Сбросить никнейм"
               >
                 <UserMinus size={16} />
               </button>
            </div>
          </div>
        ))}
      </div>

      {/* СЕКЦИЯ ПАГИНАЦИИ */}
      <div className="admin-pagination-container">
        <button 
          className={`tag-btn ${page === 1 ? 'admin-pagination-btn-disabled' : ''}`} 
          disabled={page === 1} 
          onClick={() => setPage(prev => prev - 1)}
        >
          ←
        </button>
        <div className="admin-pagination-info">Страница {page} из {totalPages}</div>
        <button 
          className={`tag-btn ${page === totalPages ? 'admin-pagination-btn-disabled' : ''}`} 
          disabled={page === totalPages} 
          onClick={() => setPage(prev => prev + 1)}
        >
           →
        </button>
      </div>

      {/* МОДАЛЬНОЕ ОКНО ДЕТАЛЕЙ ПОЛЬЗОВАТЕЛЯ */}
      <AdminUserModal 
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
        videos={userVideos}
        playlists={userPlaylists}
        onResetName={handleResetName}
        onToggleStatus={toggleStatus}
      />
    </div>
  );
};

export default Channels;