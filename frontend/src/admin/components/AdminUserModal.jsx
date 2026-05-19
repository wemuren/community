import React from 'react';
import UserAvatar from '../../components/UserAvatar';

import { BANNER_URL } from '@/config/api';
import { THUMB_URL } from '@/config/api';

const AdminUserModal = ({ 
  user, 
  onClose, 
  videos, 
  playlists, 
  onResetName, 
  onToggleStatus 
}) => {
  if (!user) return null;

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-user-card preview-mode" onClick={e => e.stopPropagation()}>
        
        {/* ШАПКА КАНАЛА (Баннер) */}
        <div className="admin-preview-banner" 
             style={{ 
               backgroundImage: user.banner ? `url(${BANNER_URL}${user.banner})` : 'none',
               backgroundColor: user.is_paid == 1 ? '#1a1a1a' : '#eee'
             }}>
          <button className="close-preview" onClick={onClose}>&times;</button>
        </div>

        <div className="admin-preview-content">
          {/* ИНФО О ЮЗЕРЕ */}
          <div className="admin-preview-header">
            <UserAvatar user={user} sizeClass={`avatar-large ${user.is_paid == 1 ? 'premium' : ''}`} />
            <div className="admin-preview-info">
              <h3>{user.full_name} {user.is_paid == 1 }</h3>
              <p className="sub-text">@{user.username} • Регистрация: {new Date(user.created_at).toLocaleDateString()}</p>
            </div>
            
            <div className="admin-preview-actions">
                <button 
                className="btn-watch-live" 
                onClick={() => window.open(`/profile/${user.id}`, '_blank')}
                >
                Смотреть канал ↗
                </button>
            </div>
          </div>

          {/* КНОПКИ УПРАВЛЕНИЯ */}
          <div className="admin-mod-controls">
            <button className="mod-btn" onClick={() => onResetName(user.id)}>
              Сбросить ник {user.name_reset == 1 && '⚠️'}
            </button>
            <button className={`mod-btn ${user.is_active == 1 ? 'danger' : 'success'}`} 
                    onClick={() => onToggleStatus(user.id, 'block', user.is_active)}>
              {user.is_active == 1 ? 'Заблокировать' : 'Разблокировать'}
            </button>
            <button className={`mod-btn ${user.is_paid == 1 ? 'active' : ''}`}
                    onClick={() => onToggleStatus(user.id, 'premium', user.is_paid)}>
              {user.is_paid == 1 ? 'Снять Premium' : 'Выдать Premium'}
            </button>
          </div>

          {/* СПИСОК ВИДЕО */}
          <h4 className="section-label">Видео автора ({videos.length})</h4>
          <div className="admin-video-scroll">
            {videos.length > 0 ? videos.map(vid => (
              <div 
                key={vid.id} 
                className="admin-vid-item" 
                onClick={() => window.open(`/video/${vid.id}`, '_blank')}
                style={{ cursor: 'pointer' }}
              >
                <div className="admin-vid-thumb">
                  {vid.thumbnail ? (
                      <img src={`${THUMB_URL}${vid.thumbnail}`} alt="" className="admin-thumb-img" />
                  ) : (
                      <div className="no-thumb-placeholder"></div>
                  )}
                  <div className="play-hint">▶</div>
                </div>
                <div className="admin-vid-title">{vid.title}</div>
              </div>
            )) : <p className="empty-txt">Канал пуст</p>}
          </div>

          {/* РАЗДЕЛ ПЛЕЙЛИСТОВ */}
          <h4 className="section-label">Публичные плейлисты ({playlists.length})</h4>
          <div className="admin-playlist-tags">
            {playlists.length > 0 ? playlists.map(pl => (
              <div key={pl.id} className="admin-pl-tag">
                <span className="folder-icon">📁</span>
                {pl.title}
              </div>
            )) : <p className="empty-txt">Нет публичных плейлистов</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUserModal;