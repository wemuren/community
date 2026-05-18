import React from 'react';
import { Link } from 'react-router-dom';
import UserAvatar from './UserAvatar';

const THUMB_URL = 'http://localhost/projects/community/api/uploads/thumbnails/';

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

  const getPluralForm = (number, forms) => {
    const n = Math.abs(number) % 100;
    const n1 = n % 10;
    if (n > 10 && n < 20) return forms[2];
    if (n1 > 1 && n1 < 5) return forms[1];
    if (n1 === 1) return forms[0];
    return forms[2];
  };

  return (
    <div className="video-card" onClick={() => onVideoClick(video)}>
      <div className="video-thumbnail">
        {video.thumbnail ? (
          <img src={`${THUMB_URL}${video.thumbnail}`} alt={video.title} className="thumb-img-main" />
        ) : (
          <div className="no-thumb-placeholder" style={{ backgroundColor: '#C20000' }}></div>
        )}
        
        <div className="hover-actions" onClick={e => e.stopPropagation()}>
          {isMyProfile ? (
            /* НАБОР АВТОРА: только редактирование и удаление */
            <>
              <button className="action-btn edit" title="Редактировать" onClick={(e) => onEdit(e, video.id)}>✎</button>
              {onDelete && (
                <button className="action-btn delete" title="Удалить" onClick={(e) => onDelete(e, video.id)}>🗑</button>
              )}
            </>
          ) : (
            /* НАБОР ЗРИТЕЛЯ: лайки, плейлисты, жалобы */
            <>
              <button className="action-btn" title="В плейлист" onClick={(e) => onPlaylistOpen(e, video.id)}>🔖</button>
              <button className="action-btn" title="Нравится" onClick={(e) => onToggleLiked(e, 'liked', video.id)}>❤️</button>
              <button className="action-btn" title="Позже" onClick={(e) => onToggleLater(e, 'watch_later', video.id)}>🕒</button>
              <button className="action-btn report" title="Пожаловаться" onClick={(e) => onReport(e, video.id, 'video')}>⚠️</button>
            </>
          )}
        </div>
        <div className="play-icon-overlay">▶</div>
      </div>

      <div className="video-info">
        {!hideAuthor && (
          <Link 
            to={`/profile/${video.user_id}`} 
            className="author-avatar-link"
            onClick={(e) => e.stopPropagation()}
          >
            <UserAvatar 
              user={{ avatar: video.avatar, full_name: video.full_name, username: video.username, is_paid: video.is_paid }} 
              sizeClass="avatar-home-grid" 
            />
          </Link>
        )}
        <div className="video-text">
          <h3 className="video-title">{video.title}</h3>
          {!hideAuthor && <p className="video-meta-author">{video.full_name || video.username}</p>}
          <p className="video-meta-stats">
            {formatViews(video.views)} {getPluralForm(video.views, ['просмотр', 'просмотра', 'просмотров'])} • {new Date(video.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;