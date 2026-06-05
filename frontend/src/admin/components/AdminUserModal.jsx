import React from 'react';
import { X, Crown, ShieldAlert, UserMinus, ExternalLink } from 'lucide-react';
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
      <div className="admin-modal-container" onClick={(e) => e.stopPropagation()}>
        
        {/* ШАПКА КАНАЛА (Кастомный баннер или заглушка) */}
        <div 
          className={`admin-modal-banner-wrapper ${user.is_paid == 1 ? 'premium-bg' : 'default-bg'}`}
          style={user.banner ? { backgroundImage: `url(${BANNER_URL}${user.banner})` } : null}
        >
          <button className="admin-modal-close-btn-top" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* ОСНОВНОЙ СКРОЛЛ-КОНТЕНТ */}
        <div className="admin-modal-scroll-content">
          
          {/* ИНФО О ЮЗЕРЕ */}
          <div className="admin-modal-profile-header">
            <div className="admin-modal-profile-left">
              <UserAvatar user={user} sizeClass={`avatar-large ${user.is_paid == 1 ? 'premium' : ''}`} />
              <div className="admin-modal-profile-text">
                <strong className="admin-modal-profile-title">
                  {user.full_name || user.username}
                  {user.is_paid == 1 && <Crown size={18} className="admin-stat-icon-likes" />}
                </strong>
                <span className="studio-field-subtext">
                  @{user.username} · Регистрация: {new Date(user.created_at).toLocaleDateString()}
                </span>
                <span className="studio-field-subtext">Email: {user.email}</span>
              </div>
            </div>
            
            <button 
              className="tag-btn active" 
              onClick={() => window.open(`/profile/${user.id}`, '_blank')}
            >
              Смотреть канал <ExternalLink size={14} style={{ marginLeft: '4px' }} />
            </button>
          </div>

          {/* КНОПКИ УПРАВЛЕНИЯ МОДЕРАЦИЕЙ */}
          <div className="admin-modal-controls-row">
            <button className="admin-modal-control-btn" onClick={() => onResetName(user.id)}>
              <UserMinus size={16} />
              Сбросить ник {user.name_reset == 1}
            </button>

            <button 
              className={`admin-modal-btn admin-modal-control-btn ${user.is_active == 0 ? 'ban-active' : ''}`} 
              onClick={() => onToggleStatus(user.id, 'block', user.is_active)}
            >
              <ShieldAlert size={16} />
              {user.is_active == 1 ? 'Заблокировать' : 'Разблокировать'}
            </button>

            <button 
              className={`admin-modal-btn admin-modal-control-btn ${user.is_paid == 1 ? 'premium-active' : ''}`}
              onClick={() => onToggleStatus(user.id, 'premium', user.is_paid)}
            >
              <Crown size={16} />
              {user.is_paid == 1 ? 'Снять премиум' : 'Выдать премиум'}
            </button>
          </div>

          {/* ГОРИЗОНТАЛЬНЫЙ СПИСОК ВИДЕО АВТОРА */}
          <div className="input-group">
            <div className="admin-tags-group-title">Видео автора ({videos.length})</div>
            <div className="admin-modal-video-scroll-container">
              {videos.length > 0 ? (
                videos.map(vid => (
                  <div 
                    key={vid.id} 
                    className="admin-modal-video-card-item" 
                    onClick={() => window.open(`/video/${vid.id}`, '_blank')}
                  >
                    <div className="admin-modal-video-thumbnail-box">
                      {vid.thumbnail ? (
                        <img src={`${THUMB_URL}${vid.thumbnail}`} alt="" />
                      ) : (
                        <div className="playlist-empty-placeholder"></div>
                      )}
                      <div className="admin-modal-video-hint-play">▶</div>
                    </div>
                    <span className="admin-wire-tag" style={{ fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {vid.title}
                    </span>
                  </div>
                ))
              ) : (
                <p className="studio-field-subtext">Канал пуст</p>
              )}
            </div>
          </div>

          {/* РАЗДЕЛ ПЛЕЙЛИСТОВ В КАРКАСНОМ СТИЛЕ */}
          <div className="input-group">
            <div className="admin-tags-group-title">Публичные плейлисты ({playlists.length})</div>
            <div className="admin-modal-playlists-tags-flex">
              {playlists.length > 0 ? (
                playlists.map(pl => (
                  <div key={pl.id} className="mini-tag-chip" style={{ background: 'transparent', border: '1px solid rgba(0,0,0,0.1)', color: 'var(--text-main)' }}>
                    <span>📁 {pl.title}</span>
                  </div>
                ))
              ) : (
                <p className="studio-field-subtext">Нет публичных плейлистов</p>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default AdminUserModal;