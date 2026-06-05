import React from 'react';
import { Link } from 'react-router-dom';
import UserAvatar from './UserAvatar';

import { THUMB_URL } from '@/config/api';
import '../assets/styles/video-card.css';
import { Bookmark, Heart, Clock, TriangleAlert, SquarePen, Trash } from 'lucide-react';

const VideoCard = ({ 
  video, 
  isMyProfile = false, 
  hideAuthor = false,
  onVideoClick, 
  onPlaylistOpen, 
  onToggleLiked, 
  onToggleLater, 
  onReport, 
  onDelete,
  onEdit
}) => {
  
  const formatViews = (count) => {
    const num = parseInt(count) || 0;
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num;
  };

  // ФУНКЦИЯ ДЛЯ ВЫБОРА ПРАВИЛЬНОГО СКЛОНЕНИЯ СЛОВ
  const getPluralForm = (count, one, two, many) => {
    const num = Math.abs(parseInt(count)) || 0;
    let mod10 = num % 10;
    let mod100 = num % 100;

    // Если число оканчивается на k или M (после форматирования), возвращаем форму для "множества"
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

  const isLiked = video.is_liked && parseInt(video.is_liked) === 1;
  const isWatchLater = video.in_later && parseInt(video.in_later) === 1;

  const viewsCount = parseInt(video.views) || 0;
  const viewsString = formatViews(viewsCount);
  // Определяем правильное окончание: 1 просмотр, 2 просмотра, 5 просмотров
  const viewsPlural = getPluralForm(viewsCount, 'просмотр', 'просмотра', 'просмотров');

  return (
    <div className="video-card" onClick={() => onVideoClick(video)}>
      {/* Контейнер обложки: строго 16:9 */}
      <div className="video-thumbnail">
        {video.thumbnail ? (
          <img src={`${THUMB_URL}${video.thumbnail}`} alt={video.title} className="thumb-img-main" />
        ) : (
          <div className="no-thumb-placeholder"></div>
        )}
        
        {/* Слой ховер-действий */}
        <div className="hover-actions" onClick={e => e.stopPropagation()}>
          {isMyProfile ? (
            <>
              <button className="action-btn-badge" title="Редактировать" onClick={(e) => onEdit(e, video.id)}>
                <SquarePen size={16} strokeWidth={2} />
              </button>
              {onDelete && (
                <button className="action-btn-badge" title="Удалить" onClick={(e) => onDelete(e, video.id)}>
                  <Trash size={16} strokeWidth={2} />
                </button>
              )}
            </>
          ) : (
            <>
              <button className="action-btn-badge" title="В плейлист" onClick={(e) => onPlaylistOpen(e, video.id)}>
                <Bookmark size={16} strokeWidth={2} />
              </button>
              
              <button 
                className={`action-btn-badge badge-heart ${isLiked ? 'is-active' : ''}`} 
                title="Нравится" 
                onClick={(e) => onToggleLiked(e, 'liked', video.id)}
              >
                <Heart size={16} strokeWidth={2} />
              </button>
              
              <button 
                className={`action-btn-badge badge-clock ${isWatchLater ? 'is-active' : ''}`} 
                title="Позже" 
                onClick={(e) => onToggleLater(e, 'watch_later', video.id)}
              >
                <Clock size={16} strokeWidth={2} />
              </button>
              
              <button className="action-btn-badge" title="Пожаловаться" onClick={(e) => onReport(e, video.id, 'video')}>
                <TriangleAlert size={16} strokeWidth={2} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Блок информации под видео */}
      {/* Блок информации под видео */}
<div className="video-info">
  {!hideAuthor && (
    <Link 
      to={`/profile/${video.user_id}`} 
      className="author-avatar-link"
      onClick={(e) => e.stopPropagation()}
    >
      {/* ИСПРАВЛЕНО: Убрали лишний div className="author-avatar", 
          теперь выводим чистый компонент, который сам возьмет размер 48x48px и отцентрирует букву */}
      <UserAvatar 
        user={{ avatar: video.avatar, full_name: video.full_name, username: video.username, is_paid: video.is_paid }} 
        sizeClass="avatar-medium" 
      />
    </Link>
  )}
  
  <div className="video-text-block">
    <span className="video-title">{video.title}</span>
    
    <div className="video-meta-row">
      {!hideAuthor && <span className="video-meta-item">{video.full_name || video.username}</span>}
      <span className="video-meta-item">{viewsString} {viewsPlural}</span>
      <span className="video-meta-item">{new Date(video.created_at).toLocaleDateString()}</span>
    </div>
  </div>
</div>
    </div>
  );
};

export default VideoCard;