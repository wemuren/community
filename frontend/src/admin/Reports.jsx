import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../assets/styles/admin.css';
import UserAvatar from '../components/UserAvatar';

import { API_BASE_URL } from '@/config/api';
import { BANNER_URL } from '@/config/api';
import { THUMB_URL } from '@/config/api';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null); 
  const authUser = JSON.parse(localStorage.getItem('user'));
  const [userVideos, setUserVideos] = useState([]);
  const [userPlaylists, setUserPlaylists] = useState([]);

  const fetchReports = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/get_reports.php?admin_id=${authUser.id}`);
      setReports(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); }
  };

  const handleAction = async (targetId, type, action) => {
    if (action === 'delete') {
      if (!window.confirm("УДАЛИТЬ этот контент НАВСЕГДА? Это действие нельзя отменить.")) return;
    }

    try {
    await axios.post(`${API_BASE_URL}/admin/handle_report.php`, {
      admin_id: authUser.id,
      target_id: targetId,
      target_type: type,
      action: action
    });
    fetchReports(); // Обновляем список жалоб
  } catch (err) {
    console.error("Ошибка:", err);
  }
};

  useEffect(() => { fetchReports(); }, []);

  // КРИТИЧЕСКАЯ ПРАВКА: Загружаем ПОЛНЫЕ данные юзера для модалки
  useEffect(() => {
    if (selectedUser) {
      const userId = selectedUser.target_id || selectedUser.id;
      
      const fetchFullData = async () => {
        try {
          // 1. Получаем полные данные профиля (чтобы были баннер, дата и тд)
          const userRes = await axios.get(`${API_BASE_URL}/user/get_user.php?id=${userId}`);
          // Обновляем selectedUser данными из базы, сохраняя инфу о жалобе
          setSelectedUser(prev => ({ ...prev, ...userRes.data }));

          // 2. Видео
          const vidRes = await axios.get(`${API_BASE_URL}/video/get_user_videos.php?user_id=${userId}`);
          setUserVideos(Array.isArray(vidRes.data) ? vidRes.data : []);

          // 3. Плейлисты
          const plRes = await axios.get(`${API_BASE_URL}/playlist/get_user_playlists.php?user_id=${userId}&viewer_id=0`);
          const publicOnly = Array.isArray(plRes.data) 
            ? plRes.data.filter(p => p.type === 'custom' && p.is_private == 0) 
            : [];
          setUserPlaylists(publicOnly);
        } catch (err) { console.error("Ошибка загрузки данных модалки:", err); }
      };
      fetchFullData();
    } else {
      setUserVideos([]);
      setUserPlaylists([]);
    }
  }, [selectedUser?.target_id]); // Следим за ID цели жалобы

  const handleResetName = async (userId) => {
    if (!window.confirm("Сбросить имя пользователя?")) return;
    await axios.post(`${API_BASE_URL}/admin/reset_nickname.php`, { admin_id: authUser.id, user_id: userId });
    fetchReports();
    if (selectedUser) setSelectedUser({ ...selectedUser, full_name: `Пользователь #${userId}`, name_reset: 1 });
  };

  const toggleStatus = async (userId, type, currentVal) => {
    const url = type === 'premium' ? '/admin/update_premium_status.php' : '/admin/update_user_status.php';
    const field = type === 'premium' ? 'is_paid' : 'is_active';
    const newVal = currentVal == 1 ? 0 : 1;

    await axios.post(`${API_BASE_URL}${url}`, {
      admin_id: authUser.id, user_id: userId, [field]: newVal
    });
    fetchReports();
    if (selectedUser) setSelectedUser({ ...selectedUser, [field]: newVal });
  };

  const getStatus = (count) => {
    if (count >= 10) return { label: 'КРИТИЧНО', class: 'crit-red' };
    if (count >= 3) return { label: 'ВНИМАНИЕ', class: 'crit-yellow' };
    return { label: 'ОК', class: 'crit-green' };
  };

  const userReports = reports.filter(r => r.target_type === 'user');
  const videoReports = reports.filter(r => r.target_type === 'video');

  const ReportTable = ({ data, title, isVideo = false }) => (
    <div className="report-section">
      <h3 className="section-subtitle">{title} <span className="count-tag">{data.length}</span></h3>
      <div className="table reports-table">
        <div className="table-header report-grid">
          <div>Объект</div>
          <div style={{textAlign: 'center'}}>Жалобы</div>
          <div>Причины</div>
          <div style={{textAlign: 'right'}}>Действия</div>
        </div>
        {data.map((r, idx) => {
          const status = getStatus(r.report_count);
          return (
            <div 
              key={idx} 
              className={`table-row report-grid ${status.class} ${!isVideo ? 'clickable-row' : ''}`}
              onClick={() => !isVideo && setSelectedUser(r)}
            >
              <div className="user-info-cell">
                {isVideo ? (
                  <div className="video-report-item">
                    <div className="admin-mini-thumb">
                       {r.target_thumbnail ? (
                         <img src={`${THUMB_URL}${r.target_thumbnail}`} alt="" />
                       ) : (
                         <div className="no-thumb-placeholder"></div>
                       )}
                    </div>
                    <div className="video-report-text">
                       <strong>{r.target_name}</strong>
                       <div className="sub-text">ID: {r.target_id}</div>
                    </div>
                  </div>
                ) : (
                  <>
                    <UserAvatar 
                      user={{ avatar: r.user_avatar, full_name: r.target_name, username: r.user_handle }} 
                      sizeClass="avatar-mini" 
                    />
                    <div className="user-text-meta">
                      <strong>{r.target_name || r.user_handle}</strong>
                      <div className="sub-text">@{r.user_handle}</div>
                    </div>
                  </>
                )}
              </div>
              
              <div style={{textAlign: 'center'}}>
                <div className={`status-pill ${status.class}`}>{status.label} ({r.report_count})</div>
              </div>

              <div className="col-desc-text">{r.all_reasons}</div>

              <div className="col-actions" onClick={e => e.stopPropagation()}>
                {isVideo && (
                  <button className="btn-icon" onClick={() => window.open(`/video/${r.target_id}`, '_blank')} title="Смотреть">👁️</button>
                )}
                <button className="btn-icon" onClick={() => handleAction(r.target_id, r.target_type, 'ignore')} title="Пропустить">✅</button>
                <button className="btn-icon danger" onClick={() => handleAction(r.target_id, r.target_type, 'delete')} title="Забанить">🚫</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div>
      <h2 className="page-title">Модерация контента</h2>
      
      <ReportTable data={userReports} title="Жалобы на каналы" />
      <div style={{marginTop: '40px'}}></div>
      <ReportTable data={videoReports} title="Жалобы на видео" isVideo={true} />

       {selectedUser && selectedUser.username && (
        <div className="admin-modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="admin-user-card preview-mode" onClick={e => e.stopPropagation()}>
            
            <div className="admin-preview-banner" 
                 style={{ 
                   backgroundImage: selectedUser.banner ? `url(${BANNER_URL}${selectedUser.banner})` : 'none',
                   backgroundColor: selectedUser.is_paid == 1 ? '#1a1a1a' : '#eee'
                 }}>
              <button className="close-preview" onClick={() => setSelectedUser(null)}>&times;</button>
            </div>

            <div className="admin-preview-content">
              <div className="admin-preview-header">
                <UserAvatar user={selectedUser} sizeClass={`avatar-large ${selectedUser.is_paid == 1 ? 'premium' : ''}`} />
                <div className="admin-preview-info">
                  <h3>{selectedUser.full_name} {selectedUser.is_paid == 1 && '💎'}</h3>
                  <p className="sub-text">@{selectedUser.username} • Регистрация: {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : '...'}</p>
                </div>
                
                <div className="admin-preview-actions">
                  <button className="btn-watch-live" onClick={() => window.open(`${window.location.origin}/user/${selectedUser.id}`, '_blank')}>
                    Смотреть ↗
                  </button>
                </div>
              </div>

              <div className="admin-mod-controls">
                <button className="mod-btn" onClick={() => handleResetName(selectedUser.id)}>
                  Сбросить ник {selectedUser.name_reset == 1 && '⚠️'}
                </button>
                <button className={`mod-btn ${selectedUser.is_active == 1 ? 'danger' : 'success'}`} 
                        onClick={() => toggleStatus(selectedUser.id, 'block', selectedUser.is_active)}>
                  {selectedUser.is_active == 1 ? 'Забанить доступ' : 'Разблокировать'}
                </button>
                <button className={`mod-btn ${selectedUser.is_paid == 1 ? 'active' : ''}`}
                        onClick={() => toggleStatus(selectedUser.id, 'premium', selectedUser.is_paid)}>
                  {selectedUser.is_paid == 1 ? 'Снять Premium' : 'Выдать Premium'}
                </button>
              </div>

              <h4 className="section-label">Видео автора ({userVideos.length})</h4>
              <div className="admin-video-scroll">
                {userVideos.length > 0 ? userVideos.map(vid => (
                  <div key={vid.id} className="admin-vid-item">
                    <div className="admin-vid-thumb">
                      {vid.thumbnail ? (
                        <img src={`${THUMB_URL}${vid.thumbnail}`} alt="" className="admin-thumb-img" />
                      ) : (
                        <div className="no-thumb-placeholder"></div>
                      )}
                      {vid.is_paid == 1 && <span className="p-tag">P</span>}
                      <div className="play-hint">▶</div>
                    </div>
                    <div className="admin-vid-title">{vid.title}</div>
                  </div>
                )) : <p className="empty-txt">Канал пуст</p>}
              </div>

              <h4 className="section-label">Публичные плейлисты ({userPlaylists.length})</h4>
              <div className="admin-playlist-tags">
                {userPlaylists.length > 0 ? userPlaylists.map(pl => (
                  <div key={pl.id} className="admin-pl-tag">
                    <span className="folder-icon">📁</span>
                    {pl.title}
                  </div>
                )) : <p className="empty-txt">Нет публичных плейлистов</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;