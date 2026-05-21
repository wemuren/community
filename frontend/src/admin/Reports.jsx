import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Eye, Check, X, ShieldAlert, Crown, UserMinus, Folder, Play } from 'lucide-react';
import '../assets/styles/admin.css'; // Наша основная админ-система
import '../assets/styles/auth.css'; // База инпутов и кнопок
import UserAvatar from '../components/UserAvatar';

import { API_BASE_URL, BANNER_URL, THUMB_URL } from '@/config/api';

const Reports = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null); 
  const authUser = JSON.parse(localStorage.getItem('user'));
  const [userVideos, setUserVideos] = useState([]);
  const [userPlaylists, setUserPlaylists] = useState([]);

  const fetchReports = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/get_reports.php?admin_id=${authUser.id}`);
      setReports(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error("Ошибка загрузки жалоб:", err); }
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
      fetchReports();
    } catch (err) {
      console.error("Ошибка обработки жалобы:", err);
    }
  };

  useEffect(() => { if (authUser?.id) fetchReports(); }, [authUser?.id]);

  // Сбор полных данных нарушителя для системной модалки
  useEffect(() => {
    if (selectedUser) {
      const userId = selectedUser.target_id || selectedUser.id;
      const fetchFullData = async () => {
        try {
          const userRes = await axios.get(`${API_BASE_URL}/user/get_user.php?id=${userId}`);
          setSelectedUser(prev => ({ ...prev, ...userRes.data }));

          const vidRes = await axios.get(`${API_BASE_URL}/video/get_user_videos.php?user_id=${userId}`);
          setUserVideos(Array.isArray(vidRes.data) ? vidRes.data : []);

          const plRes = await axios.get(`${API_BASE_URL}/playlist/get_user_playlists.php?user_id=${userId}&viewer_id=0`);
          const rawPlaylists = plRes.data && Array.isArray(plRes.data.playlists) ? plRes.data.playlists : [];
          const publicOnly = rawPlaylists.filter(p => p.type === 'custom' && Number(p.is_private) === 0);
          setUserPlaylists(publicOnly);
        } catch (err) { console.error("Ошибка загрузки данных модалки модерации:", err); }
      };
      fetchFullData();
    } else {
      setUserVideos([]);
      setUserPlaylists([]);
    }
  }, [selectedUser?.target_id]);

  const handleResetName = async (userId) => {
    if (!window.confirm("Сбросить имя пользователя?")) return;
    await axios.post(`${API_BASE_URL}/admin/reset_nickname.php`, { admin_id: authUser.id, user_id: userId });
    fetchReports();
    if (selectedUser) setSelectedUser({ ...selectedUser, full_name: `user${userId}`, name_reset: 1 });
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
    if (count >= 10) return { label: 'КРИТИЧНО', class: 'critical' };
    if (count >= 3) return { label: 'ВНИМАНИЕ', class: 'badge-clock is-active' }; // Оранжевый/желтый акцент
    return { label: 'ОК', class: 'money' }; // Спокойный зеленый
  };

  const userReports = reports.filter(r => r.target_type === 'user');
  const videoReports = reports.filter(r => r.target_type === 'video');

  const ReportTable = ({ data, title, isVideo = false }) => (
    <div style={{ marginTop: '32px' }}>
      <h3 className="admin-tags-group-title" style={{ color: 'var(--text-main)', fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>
        {title} <span className="tag-btn active" style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '4px', marginLeft: '6px', pointerEvents: 'none' }}>{data.length}</span>
      </h3>
      
      <div className="admin-table">
        <div className="admin-table-header">
          <div className="admin-col" style={{ flex: 2 }}><span className="admin-stat-label">Объект жалобы</span></div>
          <div className="admin-col" style={{ flex: 1, justifyContent: 'center' }}><span className="admin-stat-label">Статус</span></div>
          <div className="admin-col" style={{ flex: 2 }}><span className="admin-stat-label">Причины</span></div>
          <div className="admin-col admin-col-actions"><span className="admin-stat-label">Действия</span></div>
        </div>

        {data.map((r, idx) => {
          const status = getStatus(r.report_count);
          return (
            <div 
              key={idx} 
              className={`admin-table-row ${!isVideo ? 'clickable' : ''}`}
              onClick={() => !isVideo && setSelectedUser(r)}
            >
              {/* КОЛОНКА 1: ДАННЫЕ СТРУКТУРЫ ОБЪЕКТА */}
              <div className="admin-col" style={{ flex: 2 }}>
                {isVideo ? (
                  <div className="admin-user-cell">
                    <div className="admin-modal-video-thumbnail-box" style={{ width: '80px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.08)' }}>
                       {r.target_thumbnail ? (
                         <img src={`${THUMB_URL}${r.target_thumbnail}`} alt="" />
                       ) : (
                         <div className="no-thumb-placeholder"></div>
                       )}
                    </div>
                    <div className="admin-user-text">
                       <strong className="admin-user-fullname">{r.target_name}</strong>
                       <span className="studio-field-subtext">ID контента: {r.target_id}</span>
                    </div>
                  </div>
                ) : (
                  <div className="admin-user-cell">
                    <UserAvatar 
                      user={{ avatar: r.user_avatar, full_name: r.target_name, username: r.user_handle }} 
                      sizeClass="avatar-mini" 
                    />
                    <div className="admin-user-text">
                      <strong className="admin-user-fullname">{r.target_name || r.user_handle}</strong>
                      <span className="studio-field-subtext">@{r.user_handle}</span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* КОЛОНКА 2: БЭДЖ УРОВНЯ КРИТИЧНОСТИ */}
              <div className="admin-col" style={{ flex: 1, justifyContent: 'center' }}>
                <span className={`admin-stat-value ${status.class}`} style={{ fontSize: '13px', fontWeight: 700 }}>
                  {status.label} ({r.report_count})
                </span>
              </div>

              {/* КОЛОНКА 3: ТЕКСТ ПРИЧИНЫ ЖАЛОБЫ */}
              <div className="admin-col studio-field-subtext" style={{ flex: 2, paddingRight: '16px', fontSize: '14px', color: 'rgba(0,0,0,0.6)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {r.all_reasons}
              </div>

              {/* КОЛОНКА 4: УПРАВЛЕНИЕ И МОДЕРАЦИЯ */}
              <div className="admin-col admin-col-actions" onClick={e => e.stopPropagation()}>
                {isVideo && (
                  <button 
                    className="admin-action-btn-circle" 
                    onClick={() => window.open(`/video/${r.target_id}`, '_blank')} 
                    title="Смотреть видеоролик"
                  >
                    <Eye size={15} />
                  </button>
                )}
                <button 
                  className="admin-action-btn-circle premium-toggle active" 
                  onClick={() => handleAction(r.target_id, r.target_type, 'ignore')} 
                  title="Отклонить жалобу (Пропустить)"
                >
                  <Check size={15} strokeWidth={2.5} />
                </button>
                <button 
                  className="admin-action-btn-circle ban-toggle banned" 
                  onClick={() => handleAction(r.target_id, r.target_type, 'delete')} 
                  title="Удалить контент / забанить цель"
                >
                  <X size={15} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          );
        })}
        {data.length === 0 && (
          <div style={{ padding: '24px', textAlign: 'center' }} className="studio-field-subtext">
            Активных жалоб в этой категории не зафиксировано.
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="settings-white-wrapper">
      <div className="pl-top-bar">
        <h2>Модерация контента</h2>
      </div>
      
      <ReportTable data={userReports} title="Жалобы на каналы" />
      <ReportTable data={videoReports} title="Жалобы на видеоролики" isVideo={true} />

      {/* СИСТЕМНОЕ МОДАЛЬНОЕ ОКНО ПРЕДПРОСМОТРА КАНАЛА НАРУШИТЕЛЯ (YOUTUBE SPEC) */}
      {selectedUser && selectedUser.username && (
        <div className="admin-modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="admin-modal-container" onClick={e => e.stopPropagation()}>
            
            {/* Твоя широкоформатная обложка шапки плейлиста/канала из CSS */}
            <div 
              className={`admin-modal-banner-wrapper ${selectedUser.is_paid == 1 ? 'premium-bg' : 'default-bg'}`}
              style={{ 
                backgroundImage: selectedUser.banner ? `url(${BANNER_URL}${selectedUser.banner})` : 'none'
              }}
            >
              <button type="button" className="admin-modal-close-btn-top" onClick={() => setSelectedUser(null)}>
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>

            <div className="admin-modal-scroll-content">
              
              {/* Шапка автора по Фигме */}
              <div className="admin-modal-profile-header">
                <div className="admin-modal-profile-left">
                  <UserAvatar user={selectedUser} sizeClass="avatar-large" />
                  <div className="admin-modal-profile-text">
                    <h3 className="admin-modal-profile-title">
                      {selectedUser.full_name}
                      {selectedUser.is_paid == 1 && <Crown size={18} style={{ color: 'var(--primary-red)' }} />}
                    </h3>
                    <p className="studio-field-subtext">@{selectedUser.username}</p>
                    <p className="studio-field-subtext" style={{ color: 'var(--text-muted)' }}>
                      Регистрация: {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString('ru-RU') : '...'}
                    </p>
                  </div>
                </div>
                
                <button 
                  type="button" 
                  className="tag-btn active" 
                  onClick={() => window.open(`/profile/${selectedUser.id}`, '_blank')}
                >
                  Открыть канал
                </button>
              </div>

              {/* УПРАВЛЕНИЕ ДЕЙСТВИЯМИ МОДЕРАТОРА */}
              <div className="admin-modal-controls-row">
                <button type="button" className="admin-modal-control-btn" onClick={() => handleResetName(selectedUser.id)}>
                  <UserMinus size={15} /> Сбросить ник {selectedUser.name_reset == 1 && '⚠️'}
                </button>
                
                <button 
                  type="button" 
                  className={`admin-modal-control-btn ${selectedUser.is_active == 0 ? 'premium-active' : 'ban-active'}`}
                  onClick={() => toggleStatus(selectedUser.id, 'block', selectedUser.is_active)}
                >
                  <ShieldAlert size={15} />
                  {selectedUser.is_active == 1 ? 'Забанить доступ' : 'Разблокировать аккаунт'}
                </button>
                
                <button 
                  type="button" 
                  className={`admin-modal-control-btn ${selectedUser.is_paid == 1 ? 'ban-active' : 'premium-active'}`}
                  onClick={() => toggleStatus(selectedUser.id, 'premium', selectedUser.is_paid)}
                >
                  <Crown size={15} />
                  {selectedUser.is_paid == 1 ? 'Снять Premium статус' : 'Выдать Premium доступ'}
                </button>
              </div>

              {/* СПИСОК РОЛИКОВ НАРУШИТЕЛЯ (СКРОЛЛ) */}
              <div>
                <h4 className="admin-stat-label" style={{ color: 'var(--text-main)', marginBottom: '16px' }}>
                  Видеоролики автора ({userVideos.length})
                </h4>
                <div className="admin-modal-video-scroll-container">
                  {userVideos.map(vid => (
                    <div key={vid.id} className="admin-modal-video-card-item" onClick={() => window.open(`/video/${vid.id}`, '_blank')}>
                      <div className="admin-modal-video-thumbnail-box">
                        {vid.thumbnail ? (
                          <img src={`${THUMB_URL}${vid.thumbnail}`} alt="" />
                        ) : (
                          <div className="no-thumb-placeholder"></div>
                        )}
                        <div className="admin-modal-video-hint-play">
                          <Play size={16} fill="var(--white)" />
                        </div>
                      </div>
                      <span className="studio-field-subtext" style={{ fontWeight: 600, color: 'var(--text-main)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {vid.title}
                      </span>
                    </div>
                  ))}
                  {userVideos.length === 0 && <p className="studio-field-subtext">На канале пока пусто.</p>}
                </div>
              </div>

              {/* СПИСОК ПЛЕЙЛИСТОВ НАРУШИТЕЛЯ */}
              <div>
                <h4 className="admin-stat-label" style={{ color: 'var(--text-main)', marginBottom: '16px' }}>
                  Публичные плейлисты ({userPlaylists.length})
                </h4>
                <div className="admin-modal-playlists-tags-flex">
                  {userPlaylists.map(pl => (
                    <span 
                      key={pl.id} 
                      className="tag-btn" 
                      onClick={() => window.open(`/playlists/${pl.id}`, '_blank')}
                      style={{ boxShadow: 'none', border: '1px solid rgba(0,0,0,0.08)', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px' }}
                    >
                      <Folder size={13} style={{ opacity: 0.5 }} /> {pl.title}
                    </span>
                  ))}
                  {userPlaylists.length === 0 && <p className="studio-field-subtext">Нет публичных плейлистов.</p>}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;