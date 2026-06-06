import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../assets/styles/grid.css'; //
import '../assets/styles/video-card.css'; //
import VideoCard from '../components/VideoCard'; //
import UserAvatar from '../components/UserAvatar'; //
import VideoModals from '../components/VideoModals'; //
import { useVideoActions } from '../hooks/useVideoActions'; //

import { API_BASE_URL } from '@/config/api'; //

const Subscriptions = () => {
  const authUser = JSON.parse(localStorage.getItem('user')); //
  
  const [channels, setChannels] = useState([]); //
  const [videos, setVideos] = useState([]); //
  const [loading, setLoading] = useState(true); //

  // Основная функция загрузки данных этой страницы
  const fetchSubsData = useCallback(async () => {
    if (!authUser) return; //
    try {
      // Загружаем список каналов для кружочков
      const channelsRes = await axios.get(`${API_BASE_URL}/user/get_subscribed_channels.php?user_id=${authUser.id}`); //
      setChannels(channelsRes.data); //

      // Загружаем ленту видео
      const videosRes = await axios.get(`${API_BASE_URL}/video/get_subs_videos.php?user_id=${authUser.id}`); //
      setVideos(Array.isArray(videosRes.data) ? videosRes.data : []); //
    } catch (err) {
      console.error("Ошибка загрузки подписок:", err); //
    } finally {
      setLoading(false); //
    }
  }, [authUser?.id]); //

  // Подключаем наш магический хук действий с видео
  const va = useVideoActions(fetchSubsData); //

  useEffect(() => {
    fetchSubsData(); //
  }, [fetchSubsData]); //

  if (loading) return <div className="admin-loader">Загрузка ваших подписок...</div>;

  return (
    <div className="home-container">
      {/* КОМПОНЕНТ МОДАЛОК (плейлисты, жалобы) */}
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

      <div className="pl-top-bar"><h2>Подписки</h2></div>

      {channels.length > 0 ? (
        <>
          {/* ЛЕНТА КАНАЛОВ (Скролл-кружочки по ТЗ) */}
<div className="subs-container">
  {channels.map(channel => (
    <Link 
      key={channel.id} 
      to={`/profile/${channel.id}`} 
      className="sub-channel-item" 
    >
      {/* ИСПРАВЛЕНО: Убрали промежуточный div.author-avatar. 
          Теперь выводим чистый UserAvatar, размеры которого контролирует CSS-класс */}
      <UserAvatar 
        user={channel} 
        sizeClass="avatar-subs-list" 
      />

      <span>
        {channel.full_name || channel.username}
      </span>
    </Link>
  ))}
</div>

          {/* СЕТКА ВИДЕО (Железобетонные 4 в ряд на мониках, 3 на ноутах) */}
          <div className="video-grid">
            {videos.map(video => (
              <VideoCard 
                key={video.id}
                video={video}
                isMyProfile={false}
                onVideoClick={va.handleVideoClick} 
                onPlaylistOpen={va.openPlaylistModal}
                onToggleLiked={va.handleToggleSystem}
                onToggleLater={va.handleToggleSystem}
                onReport={va.handleReport}
              />
            ))}
          </div>
        </>
      ) : (
        /* ПУСТОЕ СОСТОЯНИЕ (Минимализм без смайлов) */
        <div className="create-channel-promo">
         <h2> Вы еще ни на кого не подписаны</h2>
          <p>
            Подписывайтесь на авторов платформы, чтобы их новые ролики появлялись в этой ленте.
          </p>
          <Link 
            to="/" 
            className="tag-btn active" 
          >
            Найти интересные каналы
          </Link>
        </div>
      )}
    </div>
  );
};

export default Subscriptions;