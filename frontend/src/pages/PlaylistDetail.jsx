import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft } from 'lucide-react';
import '../assets/styles/grid.css';
import '../assets/styles/playlist.css';
import VideoCard from '../components/VideoCard';
import VideoModals from '../components/VideoModals';
import { useVideoActions } from '../hooks/useVideoActions';

import { API_BASE_URL } from '@/config/api';

const PlaylistDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const authUser = JSON.parse(localStorage.getItem('user'));
  
  const [playlist, setPlaylist] = useState(null);
  const [videos, setVideos] = useState([]);
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedVideos, setSelectedVideos] = useState([]);

  const isMine = playlist && authUser && parseInt(playlist.user_id) === authUser.id;

  const fetchPlaylistContent = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/playlist/get_playlist_details.php?id=${id}`);
      setPlaylist(res.data.playlist);
      setVideos(res.data.videos);
    } catch (err) { 
      console.error("Ошибка загрузки содержимого плейлиста:", err); 
    }
  }, [id]);

  const va = useVideoActions(fetchPlaylistContent);

  useEffect(() => { 
    fetchPlaylistContent(); 
    window.scrollTo(0, 0);
  }, [fetchPlaylistContent]);

  const toggleVideoSelection = (videoId) => {
    setSelectedVideos(prev => 
      prev.includes(videoId) ? prev.filter(v => v !== videoId) : [...prev, videoId]
    );
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Удалить ${selectedVideos.length} видео из плейлиста?`)) return;
    try {
      await axios.post(`${API_BASE_URL}/playlist/remove_videos_bulk.php`, {
        playlist_id: id,
        video_ids: selectedVideos
      });
      setSelectedVideos([]);
      setIsEditMode(false);
      fetchPlaylistContent();
    } catch (err) { 
      alert("Ошибка при удалении"); 
    }
  };

  if (!playlist) return <div className="admin-loader">Загрузка...</div>;

  return (
    <div className="home-container">
      {/* КНОПКА НАЗАД */}
      <div className="back-button-wrapper">
        <button onClick={() => navigate(-1)} className="nav-link" style={{ padding: '8px 16px' }}>
          <ChevronLeft size={18} strokeWidth={2} /> Назад
        </button>
      </div>

      {/* ШАПКА ПЛЕЙЛИСТА (НОРМАЛЬНАЯ ТИПОГРАФИКА) */}
      <div className="playlist-detail-header">
        <div className="playlist-detail-info">
            <h2>{playlist.title}</h2>
            <div className="playlist-detail-meta">
              <span>{videos.length} видео</span>
              <span className="user-item"> · </span>
              <span>{isMine ? 'Мой плейлист' : `Плейлист @${playlist.username}`}</span>
              <span className="user-item"> · </span>
              <span>{parseInt(playlist.is_private) === 1 ? 'Приватный плейлист' : 'Публичный плейлист'}</span>
            </div>
        </div>

        {/* ТУЛБАР УПРАВЛЕНИЯ */}
        <div className="pl-header-actions">
            {isMine && (
                <>
                    <button className={`tag-btn ${isEditMode ? 'active' : ''}`} onClick={() => {
                        setIsEditMode(!isEditMode);
                        setSelectedVideos([]);
                    }}>
                        {isEditMode ? 'Отмена' : 'Управление'}
                    </button>
                    {isEditMode && selectedVideos.length > 0 && (
                      <>
                        <button className="tag-btn danger" onClick={handleBulkDelete}>
                          Удалить ({selectedVideos.length})
                        </button>
                        
                        {playlist.type !== 'history' && (
                          <button 
                            className="tag-btn" 
                            onClick={(e) => va.openPlaylistModal(e, selectedVideos)}
                          >
                            Перенести ({selectedVideos.length})
                          </button> 
                        )}
                      </>
                    )}
                </>
            )}
        </div>
      </div>

      <VideoModals 
        showPlaylistModal={va.showPlaylistModal}
        setShowPlaylistModal={va.setShowPlaylistModal}
        playlists={va.playlists}
        newPlaylistTitle={va.newPlaylistTitle}
        setNewPlaylistTitle={va.setNewPlaylistTitle}
        handleQuickCreate={va.handleQuickCreate}
        activeVideo={va.activeVideo}
        setActiveVideo={va.setActiveVideo}
        handleSaveToAny={(targetPlaylist) => va.handleSaveToAny(targetPlaylist, id)}
      />

      {/* СЕТКА С ВИДЕОМАТЕРИАЛАМИ */}
      <div className="video-grid">
        {videos.length > 0 ? (
          videos.map(video => (
            <div 
              key={video.id} 
              className={`selectable-card-wrapper ${selectedVideos.includes(video.id) ? 'is-selected' : ''}`}
            >
                {isEditMode && (
                    <div className="card-selection-overlay" onClick={() => toggleVideoSelection(video.id)}>
                        <div className="custom-checkbox">
                            {selectedVideos.includes(video.id) && <span>✓</span>}
                        </div>
                    </div>
                )}
                <VideoCard 
                  video={video}
                  isMyProfile={false}
                  onVideoClick={isEditMode ? () => toggleVideoSelection(video.id) : va.handleVideoClick}
                  onPlaylistOpen={va.openPlaylistModal}
                  onToggleLiked={va.handleToggleSystem}
                  onToggleLater={va.handleToggleSystem}
                  onReport={va.handleReport}
                  onDelete={null} 
                />
            </div>
          ))
        ) : (
          <div className="empty-state">
            <p>В этом плейлисте пока нет видео.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaylistDetail;