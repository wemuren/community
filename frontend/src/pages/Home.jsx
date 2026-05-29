import React, { useState, useEffect, useCallback } from 'react'; // Добавили useCallback
import axios from 'axios';
import VideoCard from '../components/VideoCard';
import VideoModals from '../components/VideoModals';
import { useVideoActions } from '../hooks/useVideoActions'; // Проверь путь!
import '../assets/styles/grid.css';

import { API_BASE_URL } from '@/config/api';

const Home = () => {
  const [videos, setVideos] = useState([]);
  const [dbTags, setDbTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState(null);
  const [loading, setLoading] = useState(true); // Добавь этот стейт!

  const authUser = JSON.parse(localStorage.getItem('user'));

  // Найди этот блок в Home.jsx
const fetchData = useCallback(async () => {
  setLoading(true); // Включаем режим ожидания перед запросом
  try {
    const currentUserId = authUser?.id ? authUser.id : 0;
    
    let queryParams = `?user_id=${currentUserId}`;
    if (selectedTag) {
      queryParams += `&tag=${encodeURIComponent(selectedTag)}`;
    }

    const videoRes = await axios.get(`${API_BASE_URL}/video/get_all_videos.php${queryParams}`);
    
    // ИСПРАВЛЕНО: Читаем массив строго из ключа response.data.videos
    if (videoRes.data && videoRes.data.status === 'success') {
      setVideos(Array.isArray(videoRes.data.videos) ? videoRes.data.videos : []);
    } else {
      setVideos([]);
    }

    const tagsRes = await axios.get(`${API_BASE_URL}/video/get_active_tags.php`);
    setDbTags(tagsRes.data);
  } catch (err) {
    console.error("Ошибка загрузки данных в Home:", err);
    setVideos([]);
  } finally {
    setLoading(false); // Выключаем загрузку при любом исходе
  }
}, [selectedTag, authUser?.id]); // Добавил authUser.id в зависимости для безопасности

  const va = useVideoActions(fetchData);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="home-container">
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
      />

      {/* ТЕГИ */}
      <div className="tags-container">
  <button 
    className={`tag-btn ${!selectedTag ? 'active' : ''}`} 
    onClick={() => setSelectedTag(null)}
  >
    Все
  </button>
  {dbTags.map(tag => (
    <button 
      key={tag.id} 
      className={`tag-btn ${selectedTag === tag.name ? 'active' : ''}`}
      onClick={() => setSelectedTag(tag.name)}
    >
      {tag.name}
    </button>
  ))}
</div>

      {/* СЕТКА ВИДЕО */}
      <div className="video-grid">
        {videos.length > 0 ? videos.map(video => (
          <VideoCard 
            key={video.id}
            video={video}
            onVideoClick={va.handleVideoClick} // Улетает на /video/:id
            onPlaylistOpen={va.openPlaylistModal}
            onToggleLiked={va.handleToggleSystem}
            onToggleLater={va.handleToggleSystem}
            onReport={va.handleReport}
          />
        )) : 
        <p>Видео загружаются...</p>}
      </div>
    </div>
  );
};

export default Home;