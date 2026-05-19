import React from 'react';
import UserAvatar from './UserAvatar';

import { VIDEO_URL as UPLOADS_URL } from '@/config/api';
import { Bookmark, Heart, Clock, TriangleAlert, Lock, Folder } from 'lucide-react';

const VideoModals = ({ 
  // Состояние плейлистов
  showPlaylistModal, 
  setShowPlaylistModal,
  playlists,
  handleSaveToAny,
  newPlaylistTitle,
  setNewPlaylistTitle,
  handleQuickCreate,
  
  // Состояние плеера
  activeVideo,
  setActiveVideo
}) => {

  const formatViews = (count) => {
    const num = parseInt(count) || 0;
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num;
  };

  const getPluralForm = (number, forms) => {
    const n = Math.abs(number) % 100;
    const n1 = n % 10;
    if (n > 10 && n < 20) return forms[2];
    if (n1 > 1 && n1 < 5) return forms[1];
    if (n1 === 1) return forms[0];
    return forms[2];
  };

  // Функция-хелпер для рендера системных иконок вместо эмодзи
  const renderPlaylistIcon = (type, isPrivate) => {
    if (type === 'liked') return <Heart size={18} className="pl-icon-heart" style={{ color: 'var(--primary-red)' }} />;
    if (type === 'watch_later') return <Clock size={18} style={{ color: 'var(--text-muted)' }} />;
    if (isPrivate == 1) return <Lock size={18} style={{ color: 'var(--text-muted)' }} />;
    return <Folder size={18} style={{ color: 'var(--text-muted)' }} />;
  };

  return (
    <>
      {showPlaylistModal && (
        <div className="admin-modal-overlay" onClick={() => setShowPlaylistModal(false)}>
          <div className="playlist-modal-content" onClick={e => e.stopPropagation()}>
            <div className="admin-header-flex" style={{ marginBottom: '20px' }}>
               <h3 className="page-title" style={{ fontSize: '20px' }}>Сохранить в...</h3>
               <button className="close-btn" onClick={() => setShowPlaylistModal(false)} style={{ fontSize: '24px' }}>&times;</button>
            </div>
            
            <div className="playlist-scroll-area">
              {playlists.map(pl => (
                <div 
                  key={pl.id} 
                  className="playlist-row-item" 
                  onClick={() => handleSaveToAny(pl)} 
                >
                  <div className="row-icon-wrapper" style={{ display: 'flex', alignItems: 'center', shrink: 0 }}>
                    {renderPlaylistIcon(pl.type, pl.is_private)}
                  </div>
                  <span className="summary-count" style={{ fontSize: '15px', fontWeight: 400 }}>{pl.title}</span>
                </div>
              ))}
            </div>

            <div className="create-pl-inline">
               <input 
                type="text" 
                placeholder="Название нового..." 
                value={newPlaylistTitle}
                onChange={(e) => setNewPlaylistTitle(e.target.value)}
                className="edit-input-field"
                style={{ padding: '10px 12px' }}
               />
               <button 
                className="plus-btn-create" 
                onClick={handleQuickCreate}
                style={{
                  background: 'var(--primary-red)',
                  color: 'var(--white)',
                  borderRadius: '8px',
                  width: '42px',
                  height: '42px',
                  fontSize: '22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
               >
                 +
               </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VideoModals;