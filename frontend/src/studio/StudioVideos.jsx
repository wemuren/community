import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, SquarePen, Trash, Eye, Heart, Folder } from 'lucide-react';
import '../assets/styles/studio.css';
import '../assets/styles/video-card.css'; // Переиспользуем готовую атомарную базу карточек

import { API_BASE_URL, THUMB_URL } from '@/config/api';

const StudioVideos = () => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const authUser = JSON.parse(localStorage.getItem('user'));

  // Лингвистическая функция для склонения существительных
  const getPluralForm = (count, one, two, many) => {
    const num = Math.abs(parseInt(count)) || 0;
    let mod10 = num % 10;
    let mod100 = num % 100;

    if (count.toString().includes('k') || count.toString().includes('M')) {
      return many;
    }
    if (mod100 > 10 && mod100 < 20) {
      return many;
    }
    if (mod10 > 1 && mod10 < 5) {
      return two;
    }
    if (mod10 === 1) {
      return one;
    }
    return many;
  };

  const formatCount = (count) => {
    const num = parseInt(count) || 0;
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num;
  };

  const fetchMyVideos = async () => {
    if (!authUser?.id) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/studio/get_videos.php?user_id=${authUser.id}`);
      setVideos(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Ошибка Студии:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMyVideos(); }, []);

  const handleDelete = async (e, id) => {
    e.stopPropagation(); // Исключаем переход по клику на карточку при удалении
    if (!window.confirm("Удалить видео навсегда?")) return;
    try {
      await axios.post(`${API_BASE_URL}/studio/delete_video.php`, {
        user_id: authUser.id,
        video_id: id
      });
      fetchMyVideos();
    } catch (err) { 
      alert("Ошибка при удалении"); 
    }
  };

  const handleEdit = (e, id) => {
    e.stopPropagation(); // Исключаем конфликт кликов
    navigate(`/studio/edit/${id}`);
  };

  if (loading) return <div className="admin-loader">Загрузка Студии...</div>;

  return (
    <div className="settings-white-wrapper">
      {/* КНОПКА НАЗАД */}
      <div className="settings-back-action" onClick={() => navigate(-1)}>
        <ChevronLeft size={16} strokeWidth={2} /> Назад
      </div>

      <div className="pl-top-bar">
        <h2>Моя студия</h2>
      </div>

      {/* Интегрированная сетка видеороликов из video-card.css */}
      <div className="video-grid">
        {videos.map(v => {
          const viewsCount = parseInt(v.views) || 0;
          const likesCount = parseInt(v.likes_count) || 0;
          const savesCount = parseInt(v.saves_count) || 0;

          return (
            <div key={v.id} className="video-card" onClick={() => navigate(`/video/${v.id}`)}>
              
              {/* Контейнер обложки: строго 16:9 из figma spec */}
              <div className="video-thumbnail">
                {v.thumbnail ? (
                  <img src={`${THUMB_URL}${v.thumbnail}`} alt={v.title} className="thumb-img-main" />
                ) : (
                  <div className="no-thumb-placeholder"></div>
                )}
                
                {/* Слой ховер-действий управления автором */}
                <div className="hover-actions" onClick={e => e.stopPropagation()}>
                  <button 
                    className="action-btn-badge" 
                    title="Редактировать" 
                    onClick={(e) => handleEdit(e, v.id)}
                  >
                    <SquarePen size={16} strokeWidth={2} />
                  </button>
                  <button 
                    className="action-btn-badge" 
                    title="Удалить" 
                    onClick={(e) => handleDelete(e, v.id)}
                  >
                    <Trash size={16} strokeWidth={2} />
                  </button>
                </div>
              </div>

              {/* Блок информации под видео (Выровнен по левому краю без аватара автора) */}
              <div className="video-info" style={{ gridTemplateColumns: '1fr' }}>
                <div className="video-text-block">
                  <span className="video-title">{v.title}</span>
                  
                  {/* ИНДАСТРИАЛ СТРОКА СТАТИСТИКИ С ПРАВИЛЬНЫМИ СКЛОНЕНИЯМИ СЛОВ */}
                  <div className="video-meta-row">
                    <span className="video-meta-item">
                      <Eye size={14} strokeWidth={2} style={{ opacity: 0.7 }} />
                      {formatCount(viewsCount)} {getPluralForm(viewsCount, 'просмотр', 'просмотра', 'просмотров')}
                    </span>
                    
                    <span className="video-meta-item">
                      <Heart size={14} strokeWidth={2} style={{ opacity: 0.7 }} />
                      {formatCount(likesCount)} {getPluralForm(likesCount, 'лайк', 'лайка', 'лайков')}
                    </span>
                    
                    <span className="video-meta-item">
                      <Folder size={14} strokeWidth={2} style={{ opacity: 0.7 }} />
                      {formatCount(savesCount)} {getPluralForm(savesCount, 'сохранение', 'сохранения', 'сохранений')}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {videos.length === 0 && (
        <div className="create-channel-promo">
          <h2>У вас пока нет загруженных видеороликов.</h2>
          <span>Все добавленные видео будут отображаться в этой панели управления.</span>
        </div>
      )}
    </div>
  );
};

export default StudioVideos;