import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { SquarePen, Heart, Folder } from 'lucide-react';

import { API_BASE_URL } from '@/config/api';
import { THUMB_URL } from '@/config/api';
import '../assets/styles/playlist.css'; // Подключаем наши новые стили

const PlaylistCard = ({ playlist, onEdit, authUser, fetchPlaylists }) => {
  const navigate = useNavigate();
  
  // Состояние сохранения чужого плейлиста себе в коллекцию
  const [isSaved, setIsSaved] = useState(playlist.is_saved === 1);

  const isOwner = authUser && Number(authUser.id) === Number(playlist.user_id); //
  const isPublic = playlist.is_private == 0; //

  const handleToggleSave = async (e) => {
    e.stopPropagation(); //
    if (!authUser) return navigate('/login'); //

    // Вместо уродливого дефолтного window.confirm — элегантная проверка
    if (isSaved) {
      const confirmUnsave = window.confirm(`Удалить плейлист "${playlist.title}" из вашей коллекции?`); //
      if (!confirmUnsave) return; //
    }

    try {
      const res = await axios.post(`${API_BASE_URL}/playlist/toggle_save.php`, { //
        user_id: authUser.id, //
        playlist_id: playlist.id //
      });

      if (res.data.status === 'saved') {
        setIsSaved(true);
        // Если на странице плейлистов нужно обновить списки сохраненных коллекций
        if (fetchPlaylists) fetchPlaylists();
      } else if (res.data.status === 'unsaved') {
        setIsSaved(false);
        if (fetchPlaylists) fetchPlaylists();
      }
    } catch (err) {
      console.error("Ошибка при сохранении плейлиста:", err); //
    }
  };

  const getPlaylistStatus = () => {
    if (playlist.type === 'history') return 'Системный плейлист';
    if (playlist.type === 'liked') return 'Системный плейлист';
    if (playlist.type === 'watch_later') return 'Системный плейлист';
    return parseInt(playlist.is_private) === 1 ? 'Приватный плейлист' : 'Публичный плейлист';
  };

  // Вычисляем, какую обложку показать (проверяем оба возможных поля с бэка)
  const thumbnail = playlist.first_video_thumbnail || playlist.last_video_thumbnail;
  const videoCount = playlist.videos_count || playlist.video_count || 0;

  return (
    <div className="playlist-card" onClick={() => navigate(`/playlists/${playlist.id}`)}>
      {/* Контейнер обложки: Строгие 16:9 из Фигмы */}
      <div className="playlist-cover-thumbnail">
        {thumbnail ? (
          <img 
            src={`${THUMB_URL}${thumbnail}`} 
            alt={playlist.title} 
            className="playlist-cover-img" 
          />
        ) : (
          <div className="playlist-empty-placeholder"></div>
        )}

        {/* Блок счетчика видео в правом нижнем углу обложки (Из экспорта Фигмы) */}
        <div className="playlist-video-counter">
          <Folder size={16} strokeWidth={2} />
          <span className="playlist-counter-number">{videoCount}</span>
        </div>

        {/* СЛОЙ ХОВЕР-ДЕЙСТВИЙ (Появляется плавно при наведении на карточку) */}
        <div className="playlist-hover-actions" onClick={(e) => e.stopPropagation()}>
          {/* 1. Если МОЙ и кастомный — кнопка настроек */}
          {isOwner && playlist.type === 'custom' && (
            <button className="playlist-action-badge" title="Настройки" onClick={() => onEdit(playlist)}>
              <SquarePen size={16} strokeWidth={2} />
            </button>
          )}

          {/* 2. Если НЕ МОЙ и ПУБЛИЧНЫЙ — кнопка лайка (сохранения чужого списка) */}
          {!isOwner && isPublic && (
            <button 
              className={`playlist-action-badge badge-heart ${isSaved ? 'is-active' : ''}`} 
              title={isSaved ? "Удалить из коллекции" : "Сохранить себе"} 
              onClick={handleToggleSave}
            >
              <Heart size={16} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>

      {/* Блок текстовой инфы под обложкой (Полное соответствие video-card) */}
      <div className="playlist-info-block">
        <span className="playlist-card-title">{playlist.title}</span>
        
        <div className="playlist-meta-row">
          <span className="playlist-meta-item">{getPlaylistStatus()}</span>
          <span className="playlist-meta-item">{videoCount} видео</span>
        </div>
      </div>
    </div>
  );
};

export default PlaylistCard;