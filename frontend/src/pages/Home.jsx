import React, { useState, useEffect, useCallback } from 'react'; // Добавили useCallback
import axios from 'axios';
import '../assets/styles/home.css';
import VideoCard from '../components/VideoCard';
import VideoModals from '../components/VideoModals';
import { useVideoActions } from '../hooks/useVideoActions'; // Проверь путь!

const API_BASE_URL = 'http://localhost/projects/community/api';

const Home = () => {
  const [videos, setVideos] = useState([]);
  const [dbTags, setDbTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState(null);

  const authUser = JSON.parse(localStorage.getItem('user'));

  const fetchData = useCallback(async () => {
    try {
      const videoParams = selectedTag ? `?tag=${encodeURIComponent(selectedTag)}` : '';
      const videoRes = await axios.get(`${API_BASE_URL}/video/get_all_videos.php${videoParams}`);
      setVideos(Array.isArray(videoRes.data) ? videoRes.data : []);

      const tagsRes = await axios.get(`${API_BASE_URL}/video/get_active_tags.php`);
      setDbTags(tagsRes.data);
    } catch (err) {
      console.error("Ошибка загрузки данных в Home:", err);
    }
  }, [selectedTag]);

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
        <button className={`tag-btn ${!selectedTag ? 'active' : ''}`} onClick={() => setSelectedTag(null)}>Все</button>
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
        )) : <p>Видео не найдены...</p>}
      </div>
    </div>
  );
};

export default Home;