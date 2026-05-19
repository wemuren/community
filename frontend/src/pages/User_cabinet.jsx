import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import '../assets/styles/grid.css';
import '../assets/styles/user.css';
import UserAvatar from '../components/UserAvatar';
import VideoCard from '../components/VideoCard';
import VideoModals from '../components/VideoModals';
import { useVideoActions } from '../hooks/useVideoActions';
import PlaylistCard from '../components/PlaylistCard';
import { TriangleAlert, Settings } from 'lucide-react';

import { API_BASE_URL } from '@/config/api';
import { BANNER_URL } from '@/config/api';

const User_cabinet = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const authUser = JSON.parse(localStorage.getItem('user'));

  const isMyProfile = !id || parseInt(id) === authUser?.id;
  const activeTab = searchParams.get('tab') || 'videos';

  const [profileUser, setProfileUser] = useState(null);
  const [videos, setVideos] = useState([]);
  const [profilePlaylists, setProfilePlaylists] = useState([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subCount, setSubCount] = useState(0);
  const [subLoading, setSubLoading] = useState(false);

  const isPremiumActive = (user) => {
    if (!user || parseInt(user.is_paid) === 0) return false;
    if (!user.premium_until) return false;
    return new Date(user.premium_until).getTime() > Date.now();
  };

  // Функция для очистки имени от смайликов и эмодзи
const stripEmojis = (text) => {
  if (!text) return '';
  return text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F191}-\u{1F19A}\u{1F200}-\u{1F2FF}\u{2B50}\u{2B55}\u{231A}\u{231B}\u{23E9}-\u{23EC}\u{23F0}\u{23F3}\u{25AA}\u{25AB}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}\u{2B05}-\u{2B07}\u{2B1B}\u{2B1C}\u{2B50}\u{2B55}\u{3030}\u{303D}\u{3297}\u{3299}]/gu, '').trim();
};

// Функция для правильного склонения числительных (ИСПРАВЛЕНО: добавлена сюда)
const getPluralForm = (number, forms) => {
  const n = Math.abs(number) % 100;
  const n1 = n % 10;
  if (n > 10 && n < 20) return forms[2];
  if (n1 > 1 && n1 < 5) return forms[1];
  if (n1 === 1) return forms[0];
  return forms[2];
};

  const fetchProfileData = useCallback(async () => {
    const targetId = isMyProfile ? authUser?.id : parseInt(id);
    if (!targetId) return navigate('/login');

    try {
      const userRes = await axios.get(`${API_BASE_URL}/user/get_user.php?id=${targetId}`);
      const userData = userRes.data;
      setProfileUser(userData);
      setSubCount(userData.subscribers || 0);

      if (isMyProfile) localStorage.setItem('user', JSON.stringify(userData));

      if (!isMyProfile && authUser) {
        const checkRes = await axios.get(`${API_BASE_URL}/user/check_sub.php?follower_id=${authUser.id}&followed_id=${targetId}`);
        setIsSubscribed(checkRes.data.isSubscribed);
      }

      // Передаём viewer_id чтобы владелец видел свои видео даже при бане
      const videoRes = await axios.get(
        `${API_BASE_URL}/video/get_user_videos.php?user_id=${targetId}&viewer_id=${authUser?.id || 0}`
      );
      setVideos(Array.isArray(videoRes.data) ? videoRes.data : []);

      const plRes = await axios.get(
        `${API_BASE_URL}/playlist/get_user_playlists.php?user_id=${targetId}&viewer_id=${authUser?.id || 0}`
      );
      setProfilePlaylists(Array.isArray(plRes.data.playlists) ? plRes.data.playlists : []);
    } catch (err) {
      console.error('Ошибка загрузки профиля:', err);
    }
  }, [id, isMyProfile, authUser?.id, navigate]);

  const va = useVideoActions(fetchProfileData);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const handleCreateChannel = async () => {
    try {
      const res = await axios.post(`${API_BASE_URL}/user/create_channel.php`, { user_id: authUser.id });
      if (res.data.status === 'success') {
        fetchProfileData();
        alert('Канал успешно создан!');
      }
    } catch (err) { console.error(err); }
  };

  const handleEditVideo = (e, videoId) => {
    e.stopPropagation();
    navigate(`/studio/edit/${videoId}`);
  };

  const handleSubscribe = async () => {
    if (!authUser) return navigate('/login');
    try {
      const res = await axios.post(`${API_BASE_URL}/user/subscribe.php`, {
        follower_id: authUser.id, followed_id: profileUser.id
      });
      if (res.data.status === 'subscribed') {
        setIsSubscribed(true);
        setSubCount(prev => prev + 1);
      } else {
        setIsSubscribed(false);
        setSubCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) { console.error(err); }
  };

  const handleDeleteVideo = async (e, videoId) => {
    e.stopPropagation();
    if (!window.confirm('Удалить видео?')) return;
    try {
      await axios.post(`${API_BASE_URL}/video/delete_video.php`, { id: videoId });
      fetchProfileData();
    } catch (err) { console.error(err); }
  };

  const handleSubscribeToggle = async () => {
    if (!authUser) return navigate('/login');
    if (subLoading) return;
    setSubLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/user/subscribe.php`, {
        follower_id: authUser.id, 
        followed_id: profileUser.id
      });
      if (res.data.status === 'subscribed') {
        setIsSubscribed(true);
        setSubCount(prev => prev + 1);
      } else {
        setIsSubscribed(false);
        setSubCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) { 
      console.error(err); 
    } finally { 
      setSubLoading(false); 
    }
  };
  // Кнопка ОК при уведомлении о сбросе имени
  const handleDismissNotice = async (userId) => {
    try {
      await axios.post(`${API_BASE_URL}/user/clear_reset_flag.php`, { id: userId });
      // Обновляем локально без перезагрузки
      setProfileUser(prev => ({ ...prev, name_reset: 0 }));
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...stored, name_reset: 0 }));
    } catch (err) {
      console.error('Ошибка при сбросе флага:', err);
    }
  };

  if (!profileUser) return <div className="white-card profile-container">Загрузка...</div>;

  // Забанен и это не мой профиль — показываем заглушку
  const isBanned = profileUser.is_active == 0;
  if (isBanned && !isMyProfile) {
    return (
      <div className="white-card profile-container">
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '80px 20px', textAlign: 'center', gap: '16px'
        }}>
          <span style={{ fontSize: '48px' }}>🚫</span>
          <h2 style={{ margin: 0 }}>Канал заблокирован</h2>
          <p style={{ color: 'gray', maxWidth: '400px', margin: 0 }}>
            Этот аккаунт был заблокирован за нарушение Правил сообщества.
          </p>
          <a
            href="mailto:support@community.ru"
            style={{
              marginTop: '8px', padding: '10px 24px',
              background: '#C20000', color: '#fff', borderRadius: '8px',
              textDecoration: 'none', fontWeight: 600, fontSize: '14px'
            }}
          >
            Обратиться в поддержку
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="white-card profile-container">
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

      {/* УВЕДОМЛЕНИЕ О СБРОСЕ ИМЕНИ */}
      {isMyProfile && profileUser.name_reset == 1 && (
        <div className="moderation-notice">
          <span>Имя профиля было сброшено модератором.</span>
          <button onClick={() => handleDismissNotice(profileUser.id)}>ОК</button>
        </div>
      )}

      {/* УВЕДОМЛЕНИЕ О БЛОКИРОВКЕ — только для владельца */}
      {isMyProfile && isBanned && (
        <div className="moderation-notice" style={{ background: '#fff0f0', borderColor: '#C20000' }}>
          <span>Вы были заблокированы за нарушение Правил сообщества.</span>
          <a href="https://t.me/wemurr" style={{ color: '#C20000', fontWeight: 600 }}>
            Обратиться в поддержку
          </a>
        </div>
      )}

      {/* БАННЕР */}
      {profileUser.channel_created == 1 && (isPremiumActive(profileUser) || isMyProfile) && (
        <div className="profile-banner-wrapper">
          {profileUser.banner ? (
            <div
              className={`profile-banner ${!isPremiumActive(profileUser) ? 'banner-locked' : ''}`}
              style={{ backgroundImage: `url(${BANNER_URL}${profileUser.banner})` }}
            >
              {!isPremiumActive(profileUser) && isMyProfile && (
                <div className="banner-lock-overlay" onClick={() => navigate('/premium')}>
                  <span>Premium истек. Продлите, чтобы разблокировать баннер</span>
                </div>
              )}
            </div>
          ) : (
            isMyProfile && (
              <div className="profile-banner default-bg">
                {!isPremiumActive(profileUser) ? (
                  <div className="banner-lock-overlay" onClick={() => navigate('/premium')}>
                    <span>Оплатите PREMIUM для баннера</span>
                  </div>
                ) : (
                  <div className="banner-upload-prompt" onClick={() => navigate('/studio/profile')}>
                    <span>Настройте оформление канала в Студии</span>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      )}

      {/* HEADER */}
      <header className="profile-header">
        <div className="user-main-info">
          <UserAvatar user={profileUser} sizeClass="avatar-profile-main" />
          <div className="user-text-block">
            <h2>
              {profileUser.full_name || profileUser.username} {profileUser.is_paid == 1}
            </h2>
            <p className="user-handle">@{profileUser.username}</p>
            {profileUser.channel_created == 1 && (
              <div className="user-stats">
                <span>
                  {videos.length} {getPluralForm(videos.length, ['видео', 'видео', 'видео'])}
                </span>
                <span className="stat-dot"> • </span>
                <span>
                  {subCount} {getPluralForm(subCount, ['подписчик', 'подписчика', 'подписчиков'])}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="profile-actions">
          {isMyProfile ? (
            <button className="btn-create-playlist-main" onClick={() => navigate('/studio/profile')}>
              <Settings size={16} strokeWidth={2} /> Настроить канал
            </button>
          ) : profileUser.channel_created == 1 && !isBanned && (
            <>
            <div className='row'>
              <button className={`btn-sub ${isSubscribed ? 'btn-subscribed' : 'btn-subscribe'}`}
                  onClick={handleSubscribeToggle}
                  disabled={subLoading}
                >
                {subLoading ? '...' : (isSubscribed ? 'Вы подписаны' : 'Подписаться')}
              </button>
              
              <button 
                className="profile-report-badge-btn" 
                style={{ borderRadius: '50%' }}
                title="Пожаловаться" 
                onClick={(e) => va.handleReport(e, profileUser.id, 'user')}
              >
                <TriangleAlert size={16} strokeWidth={2} />
              </button>
            </div>
            </>
          )}
        </div>
      </header>

      {/* КОНТЕНТ */}
      <div className="profile-content-body">
        {profileUser.channel_created == 1 ? (
          <div className="channel-view">
            <nav className="channel-navigation">
              <span
                className={`nav-tab ${activeTab === 'videos' ? 'active' : ''}`}
                onClick={() => setSearchParams({ tab: 'videos' })}
              >
                ВИДЕО
              </span>
              <span
                className={`nav-tab ${activeTab === 'playlists' ? 'active' : ''}`}
                onClick={() => setSearchParams({ tab: 'playlists' })}
              >
                ПЛЕЙЛИСТЫ
              </span>
            </nav>

            {activeTab === 'videos' ? (
              <div className="video-grid">
                {videos.length > 0 ? videos.map(video => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    isMyProfile={isMyProfile}
                    hideAuthor={true}
                    onVideoClick={va.handleVideoClick}
                    onPlaylistOpen={va.openPlaylistModal}
                    onToggleLiked={va.handleToggleSystem}
                    onToggleLater={va.handleToggleSystem}
                    onReport={va.handleReport}
                    onDelete={handleDeleteVideo}
                    onEdit={handleEditVideo}
                  />
                )) : <p className="empty-text">Видео нет.</p>}
              </div>
            ) : (
              <div className="video-grid">
                {profilePlaylists.length > 0 ? (
                  profilePlaylists
                    .filter(pl => isMyProfile ? true : (pl.type === 'custom' && pl.is_private == 0))
                    .map(pl => (
                      <PlaylistCard
                        key={pl.id}
                        playlist={{ ...pl, username: profileUser.username }}
                        authUser={authUser}
                        onEdit={() => navigate('/playlists')}
                        onSave={() => va.handleSavePlaylist?.(pl)}
                      />
                    ))
                ) : (
                  <p className="empty-text">Плейлистов пока нет.</p>
                )}
              </div>
            )}
          </div>
        ) : isMyProfile && (
          <div className="empty-state">
            <div className="create-channel-promo">
              <h3>Создайте свой канал, чтобы публиковать видео</h3>
              <button className="btn-create-channel" onClick={handleCreateChannel}>Создать канал</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default User_cabinet;
