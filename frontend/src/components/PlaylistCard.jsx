import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import { API_BASE_URL } from '@/config/api';
import { THUMB_URL } from '@/config/api';

const PlaylistCard = ({ playlist, onEdit, authUser }) => {
  const navigate = useNavigate();
  // Состояние лайка (изначально можно брать из данных API, если прокинешь поле is_saved)
  const [isSaved, setIsSaved] = useState(playlist.is_saved === 1);

  const isOwner = authUser && Number(authUser.id) === Number(playlist.user_id);
  const isPublic = playlist.is_private == 0;

 const handleToggleSave = async (e) => {
  e.stopPropagation();
  if (!authUser) return navigate('/login');

  // Если плейлист уже сохранен, спрашиваем подтверждение перед удалением
  if (isSaved) {
    const confirmUnsave = window.confirm(`Удалить плейлист "${playlist.title}" из вашей коллекции?`);
    if (!confirmUnsave) return;
  }

  try {
    const res = await axios.post(`${API_BASE_URL}/playlist/toggle_save.php`, {
      user_id: authUser.id,
      playlist_id: playlist.id
    });

    if (res.data.status === 'saved') {
      setIsSaved(true);
      alert("Плейлист сохранен в ваш профиль!");
    } else if (res.data.status === 'unsaved') {
      setIsSaved(false);
    }
  } catch (err) {
    console.error("Ошибка при сохранении плейлиста:", err);
    alert("Не удалось выполнить действие");
  }
};

  const getPlaylistStatus = () => {
    if (playlist.type === 'history') return 'Системный';
    if (playlist.type !== 'custom') return 'Системный';
    return playlist.is_private == 1 ? 'Приватный' : 'Публичный';
  };

  return (
    <div className="playlist-main-card" onClick={() => navigate(`/playlists/${playlist.id}`)}>
      <div className="playlist-cover-wrapper">
        {playlist.last_video_thumbnail ? (
          <div className="playlist-image-container">
            <img src={`${THUMB_URL}${playlist.last_video_thumbnail}`} alt={playlist.title} className="playlist-main-img" />
            <div className="playlist-overlay-count"><span>≡</span> {playlist.video_count}</div>
          </div>
        ) : (
          <div className="playlist-red-cover">
            <div className="playlist-count-badge"><span>≡</span> {playlist.video_count}</div>
          </div>
        )}
        
        {/* ХОВЕР-ДЕЙСТВИЯ */}
        <div className="playlist-hover-actions" onClick={(e) => e.stopPropagation()}>
          {/* 1. Если МОЙ — кнопка настроек */}
          {isOwner && playlist.type === 'custom' && (
            <button className="pl-action-btn" title="Настройки" onClick={() => onEdit(playlist)}>
              ✎
            </button>
          )}

          {/* 2. Если НЕ МОЙ и ПУБЛИЧНЫЙ — кнопка лайка (сохранения) */}
          {!isOwner && isPublic && (
            <button 
              className={`pl-action-btn save-btn ${isSaved ? 'active' : ''}`} 
              title={isSaved ? "Удалить из коллекции" : "Сохранить себе"} 
              onClick={handleToggleSave}
            >
              {isSaved ? '❤️' : '🤍'}
            </button>
          )}
        </div>
      </div>

      <div className="playlist-info">
        <h3 className="playlist-title">{playlist.title}</h3>
        <p className="playlist-meta">
          <span className="pl-type-label">{getPlaylistStatus()}</span>
          <span className="stat-dot"> • </span>
          {playlist.video_count} видео
        </p>
      </div>
    </div>
  );
};

export default PlaylistCard;