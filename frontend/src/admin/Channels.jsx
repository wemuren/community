import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../assets/styles/admin.css';
import UserAvatar from '../components/UserAvatar';
import AdminUserModal from './components/AdminUserModal';


import { API_BASE_URL } from '@/config/api';
import { VIDEO_URL as UPLOADS_URL } from '@/config/api';
import { BANNER_URL } from '@/config/api';
import { THUMB_URL } from '@/config/api';

const Channels = () => {
  const [channels, setChannels] = useState([]);
  const [sortBy, setSortBy] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null); // Для карточки юзера
  const authUser = JSON.parse(localStorage.getItem('user'));

  const [page, setPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);

const fetchChannels = async () => {
  setLoading(true);
  try {
    const res = await axios.get(
      `${API_BASE_URL}/admin/get_channels.php?admin_id=${authUser.id}&search=${searchTerm}&sort=${sortBy}&page=${page}`
    );
    // Важно: берем данные из ключа .channels
    setChannels(Array.isArray(res.data.channels) ? res.data.channels : []);
    setTotalPages(res.data.total_pages || 1);
  } catch (err) { 
    console.error(err); 
  } finally { 
    setLoading(false); 
  }
};

// Сбрасываем страницу на 1, если изменился поиск или сортировка
useEffect(() => {
  setPage(1);
}, [searchTerm, sortBy]);

// Загружаем данные при смене любой настройки
useEffect(() => {
  fetchChannels();
}, [page, sortBy]); // searchTerm отработает через дебаунс

  const [userPlaylists, setUserPlaylists] = useState([]); // Стейт для плейлистов юзера

useEffect(() => {
  if (selectedUser) {
    const fetchUserData = async () => {
      try {
        // 1. Грузим видео
        const vidRes = await axios.get(`${API_BASE_URL}/video/get_user_videos.php?user_id=${selectedUser.id}`);
        setUserVideos(Array.isArray(vidRes.data) ? vidRes.data : []);

        // 2. Грузим плейлисты (передаем viewer_id = 0, чтобы видеть только публичные)
        const plRes = await axios.get(`${API_BASE_URL}/playlist/get_user_playlists.php?user_id=${selectedUser.id}&viewer_id=0`);
        // Оставляем только созданные юзером (custom) и публичные
        const publicOnly = Array.isArray(plRes.data) 
          ? plRes.data.filter(p => p.type === 'custom' && p.is_private == 0) 
          : [];
        setUserPlaylists(publicOnly);

      } catch (err) { console.error("Ошибка загрузки данных юзера:", err); }
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

  const [userVideos, setUserVideos] = useState([]); // Видео конкретного юзера для модалки

// Загрузка видео для выбранного пользователя
useEffect(() => {
  if (selectedUser) {
    const fetchUserVideos = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/video/get_user_videos.php?user_id=${selectedUser.id}`);
        setUserVideos(Array.isArray(res.data) ? res.data : []);
      } catch (err) { console.error(err); }
    };
    fetchUserVideos();
  } else {
    setUserVideos([]); // Чистим при закрытии
  }
}, [selectedUser]);

// Обновленная функция сброса имени (с обновлением модалки)
const handleResetName = async (userId) => {
  if (!window.confirm("Сбросить имя пользователя?")) return;
  await axios.post(`${API_BASE_URL}/admin/reset_nickname.php`, { admin_id: authUser.id, user_id: userId });
  
  // Обновляем список в таблице
  fetchChannels(); 
  // И обновляем данные в открытой модалке
  if (selectedUser) {
    setSelectedUser({ ...selectedUser, full_name: `user${userId}`, name_reset: 1 });
  }
};

// Обновленная функция бана (с обновлением модалки)
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
    <>
      <div className="admin-header-flex">
        <h2 className="page-title">УПРАВЛЕНИЕ КАНАЛАМИ</h2>
        <div className="search-box">
          <input 
            type="text" 
            placeholder="Поиск по имени, нику или email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="admin-search-input"
          />
        </div>
      </div>

      <div className="sort-toolbar" style={{ marginBottom: '24px', display: 'flex', gap: '10px' }}>
        <span style={{ fontSize: '11px', fontWeight: 800, color: '#888', alignSelf: 'center' }}>СОРТИРОВКА:</span>
        <button className={`tag-btn ${sortBy === 'newest' ? 'active' : ''}`} onClick={() => setSortBy('newest')}>Новые</button>
        <button className={`tag-btn ${sortBy === 'name' ? 'active' : ''}`} onClick={() => setSortBy('name')}>А-Я</button>
        <button className={`tag-btn ${sortBy === 'popular' ? 'active' : ''}`} onClick={() => setSortBy('popular')}>По популярности</button>
        <button className={`tag-btn ${sortBy === 'videos' ? 'active' : ''}`} onClick={() => setSortBy('videos')}>По количеству видео</button>
      </div>

      <div className="table channels-table">
        <div className="table-header">
          <div className="table-col col-id">ID</div>
          <div className="table-col col-name">Пользователь</div>
          <div className="table-col col-date">Дата регистрации</div>
          <div className="table-col col-stats">Активность</div>
          <div className="table-col col-actions">Действия</div>
        </div>

        {channels.map(u => (
          <div className="table-row clickable" key={u.id} onClick={() => setSelectedUser(u)}>
            <div className="table-col col-id">{u.id}</div>
            <div className="table-col col-name">
              <div className="user-info-cell">
                <UserAvatar user={u} sizeClass="avatar-mini" />
                <div className="user-text-data">
                  <strong className="full-name-text">{u.full_name}</strong>
                  <div className="sub-text">@{u.username}</div>
                </div>
              </div>
            </div>
            <div className="table-col col-date">
              <span className="date-display">{new Date(u.created_at).toLocaleDateString('ru-RU')}</span>
            </div>
            <div className="table-col col-stats">
              <div className="mini-stats">
                <span>📹 {u.video_count}</span>
                <span>👥 {u.sub_count}</span>
              </div>
            </div>
            <div className="table-col col-actions" onClick={e => e.stopPropagation()}>
               <button className={`btn-icon ${u.is_paid == 1 ? 'active' : ''}`} onClick={() => toggleStatus(u.id, 'premium', u.is_paid)} title="Premium"></button>
               <button className={`btn-icon ${u.is_active == 0 ? 'danger' : ''}`} onClick={() => toggleStatus(u.id, 'block', u.is_active)} title="Бан"></button>
               <button className="btn-icon" onClick={() => handleResetName(u.id)} title="Сбросить имя">✍️</button>
            </div>
          </div>
        ))}
      </div>

      <div className="pagination-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginTop: '30px'}}>
        <button className="tag-btn" disabled={page === 1} onClick={() => setPage(prev => prev - 1)} style={{ opacity: page === 1 ? 0.5 : 1 }}>← Назад</button>
        <div style={{ fontWeight: 800, fontSize: '13px', color: '#888' }}>СТРАНИЦА {page} ИЗ {totalPages}</div>
        <button className="tag-btn" disabled={page === totalPages} onClick={() => setPage(prev => prev + 1)} style={{ opacity: page === totalPages ? 0.5 : 1 }}>Вперед →</button>
      </div>

      {/* ВОТ ТАК ТЕПЕРЬ ВЫГЛЯДИТ ТВОЯ МОДАЛКА */}
      <AdminUserModal 
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
        videos={userVideos}
        playlists={userPlaylists}
        onResetName={handleResetName}
        onToggleStatus={toggleStatus}
      />
    </>
  );
};

export default Channels;