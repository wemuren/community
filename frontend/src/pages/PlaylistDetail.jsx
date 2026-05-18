import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../assets/styles/home.css';
import '../assets/styles/playlist.css';
import VideoCard from '../components/VideoCard';
import VideoModals from '../components/VideoModals';
import { useVideoActions } from '../hooks/useVideoActions';

const API_BASE_URL = 'http://localhost/projects/community/api';

const PlaylistDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const authUser = JSON.parse(localStorage.getItem('user'));
  
  const [playlist, setPlaylist] = useState(null);
  const [videos, setVideos] = useState([]);
  
  // Состояния для массового редактирования
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedVideos, setSelectedVideos] = useState([]);

  const isMine = playlist && authUser && parseInt(playlist.user_id) === authUser.id;

  const fetchPlaylistContent = useCallback(async () => {
    try {
      // Убрали viewer_id, так как логика сохранений плейлистов вырезана
      const res = await axios.get(`${API_BASE_URL}/playlist/get_playlist_details.php?id=${id}`);
      setPlaylist(res.data.playlist);
      setVideos(res.data.videos);
    } catch (err) { console.error(err); }
  }, [id]);

  const va = useVideoActions(fetchPlaylistContent);

  useEffect(() => { 
    fetchPlaylistContent(); 
    window.scrollTo(0, 0);
  }, [fetchPlaylistContent]);

  // Логика выбора видео
  const toggleVideoSelection = (videoId) => {
    setSelectedVideos(prev => 
      prev.includes(videoId) ? prev.filter(v => v !== videoId) : [...prev, videoId]
    );
  };

  // Массовое удаление
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
    } catch (err) { alert("Ошибка при удалении"); }
  };

  if (!playlist) return <div className="white-card">Загрузка...</div>;

  return (
    <div className="home-container">
      <div className="back-button-wrapper" style={{ marginBottom: '20px' }}>
        <button onClick={() => navigate(-1)} className="btn-back"><span>←</span> Назад</button>
      </div>

      {/* ШАПКА ПЛЕЙЛИСТА (БЕЗ АВАТАРКИ) */}
      <div className="playlist-header-context" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
        <div>
            <p className="sub-text" style={{ textTransform: 'uppercase', fontSize: '12px', fontWeight: '800', marginBottom: '5px' }}>
                {isMine ? 'Мой плейлист' : `Плейлист @${playlist.username}`}
            </p>
            <h1 style={{ margin: 0, fontWeight: '900', fontSize: '32px' }}>{playlist.title.toUpperCase()}</h1>
            <p className="sub-text">
                {videos.length} видео • {playlist.is_private == 1 ? '🔒 Приватный' : '🌐 Публичный'}
            </p>
        </div>

        {/* Кнопки управления: только если плейлист мой */}
        <div className="pl-header-actions" style={{ display: 'flex', gap: '10px' }}>
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
                        <button className="tag-btn danger" onClick={handleBulkDelete}>Удалить выбранное({selectedVideos.length})</button>
                        
                        {/* НОВАЯ КНОПКА МАССОВОГО ПЕРЕНОСА */}
                        {playlist.type !== 'history' && (
                        <button 
                          className="tag-btn" 
                          style={{ background: '#eee', color: '#000' }} 
                          onClick={(e) => va.openPlaylistModal(e, selectedVideos)}
                        >
                          Перенести ({selectedVideos.length})
                        </button> )}
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
        handleSaveToAny={va.handleSaveToAny}
        newPlaylistTitle={va.newPlaylistTitle}
        setNewPlaylistTitle={va.setNewPlaylistTitle}
        handleQuickCreate={va.handleQuickCreate}
        activeVideo={va.activeVideo}
        setActiveVideo={va.setActiveVideo}
        handleSaveToAny={(playlist) => va.handleSaveToAny(playlist, id)}
      />

      {/* СЕТКА С ВИДЕО */}
      <div className={`video-grid ${isEditMode ? 'edit-mode-active' : ''}`}>
        {videos.length > 0 ? (
          videos.map(video => (
            <div key={video.id} className={`selectable-card-wrapper ${selectedVideos.includes(video.id) ? 'is-selected' : ''}`}>
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
          <div className="empty-state"><p>В этом плейлисте пока нет видео.</p></div>
        )}
      </div>
    </div>
  );
};

export default PlaylistDetail;