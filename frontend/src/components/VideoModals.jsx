import React from 'react';
import UserAvatar from './UserAvatar';

const UPLOADS_URL = 'http://localhost/projects/community/api/uploads/videos/';

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

  return (
    <>
      {showPlaylistModal && (
        <div className="video-modal-overlay" onClick={() => setShowPlaylistModal(false)}>
          <div className="playlist-modal-content" onClick={e => e.stopPropagation()} style={{maxWidth: '380px'}}>
            <div className="modal-header-flex">
               <h3>Сохранить в...</h3>
               <button className="close-mini" onClick={() => setShowPlaylistModal(false)}>&times;</button>
            </div>
            
            <div className="playlist-scroll-area" style={{maxHeight: '250px', overflowY: 'auto', margin: '15px 0'}}>
              {playlists.map(pl => (
                <div key={pl.id} className="playlist-row-item" onClick={() => handleSaveToAny(pl)} 
                     style={{padding: '12px', borderBottom: '1px solid #eee', cursor: 'pointer', display: 'flex', gap: '12px', alignItems: 'center'}}>
                  <span style={{fontSize: '18px'}}>{pl.type === 'liked' ? '❤️' : pl.type === 'watch_later' ? '🕒' : (pl.is_private == 1 ? '🔒' : '📁')}</span>
                  <span style={{fontWeight: 600, fontSize: '14px'}}>{pl.title}</span>
                </div>
              ))}
            </div>

            <div className="create-pl-footer" style={{display: 'flex', gap: '8px', paddingTop: '15px', borderTop: '2px solid #f5f5f5'}}>
               <input 
                type="text" 
                placeholder="Название нового..." 
                value={newPlaylistTitle}
                onChange={(e) => setNewPlaylistTitle(e.target.value)}
                style={{flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '14px'}}
               />
               <button className="plus-btn-create" onClick={handleQuickCreate} 
                       style={{background: '#C20000', color: '#fff', border: 'none', borderRadius: '10px', width: '42px', height: '42px', fontSize: '20px', cursor: 'pointer'}}>
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