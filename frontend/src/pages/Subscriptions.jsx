import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../assets/styles/home.css';
import VideoCard from '../components/VideoCard';
import UserAvatar from '../components/UserAvatar';
import VideoModals from '../components/VideoModals';
import { useVideoActions } from '../hooks/useVideoActions';

import { API_BASE_URL } from '@/config/api';

const Subscriptions = () => {
  const authUser = JSON.parse(localStorage.getItem('user'));
  
  const [channels, setChannels] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Основная функция загрузки данных этой страницы
  const fetchSubsData = useCallback(async () => {
    if (!authUser) return;
    try {
      // Загружаем список каналов для кружочков
      const channelsRes = await axios.get(`${API_BASE_URL}/user/get_subscribed_channels.php?user_id=${authUser.id}`);
      setChannels(channelsRes.data);

      // Загружаем ленту видео
      const videosRes = await axios.get(`${API_BASE_URL}/video/get_subs_videos.php?user_id=${authUser.id}`);
      setVideos(Array.isArray(videosRes.data) ? videosRes.data : []);
    } catch (err) {
      console.error("Ошибка загрузки подписок:", err);
    } finally {
      setLoading(false);
    }
  }, [authUser?.id]);

  // 2. Подключаем наш магический хук
  const va = useVideoActions(fetchSubsData);

  useEffect(() => {
    fetchSubsData();
  }, [fetchSubsData]);

  if (loading) return <div className="white-card">Загрузка ваших подписок...</div>;

  return (
    <div className="home-container">
      {/* 3. КОМПОНЕНТ МОДАЛОК (все данные берем из хука va) */}
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

      <h1>Ваши подписки</h1>

      {channels.length > 0 ? (
        <>
          {/* ЛЕНТА КАНАЛОВ (кружочки) */}
          <div className="subs-channels-list" style={{ display: 'flex', gap: '20px', overflowX: 'auto', padding: '20px 0', marginBottom: '30px' }}>
            {channels.map(channel => (
              <Link 
                key={channel.id} 
                to={`/profile/${channel.id}`} 
                className="sub-channel-item" 
                style={{ textAlign: 'center', textDecoration: 'none', color: 'black', minWidth: '80px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                  <UserAvatar user={channel} sizeClass="avatar-subs-list" />
                </div>
                <span style={{ fontSize: '12px', fontWeight: '500', display: 'block' }}>
                  {channel.full_name || channel.username}
                </span>
              </Link>
            ))}
          </div>

          {/* СЕТКА ВИДЕО */}
          <div className="video-grid">
            {videos.map(video => (
              <VideoCard 
                key={video.id}
                video={video}
                isMyProfile={false}
                onVideoClick={va.handleVideoClick} // Улетаем на новую страницу плеера
                onPlaylistOpen={va.openPlaylistModal}
                onToggleLiked={va.handleToggleSystem}
                onToggleLater={va.handleToggleSystem}
                onReport={va.handleReport}
              />
            ))}
          </div>
        </>
      ) : (
        /* ПУСТОЕ СОСТОЯНИЕ */
        <div className="empty-subs-container" style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>🏜️</div>
          <h2 style={{ fontWeight: 800, marginBottom: '12px' }}>Вы еще ни на кого не подписаны</h2>
          <p style={{ color: '#888', marginBottom: '24px' }}>Подписывайтесь на авторов, чтобы их ролики появлялись здесь.</p>
          <Link to="/" className="premium-button" style={{ display: 'inline-block', textDecoration: 'none' }}>
            Найти интересные каналы
          </Link>
        </div>
      )}
    </div>
  );
};

export default Subscriptions;