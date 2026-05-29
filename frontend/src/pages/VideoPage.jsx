import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../assets/styles/video-page.css';

import VideoModals from '../components/VideoModals';
import { useVideoActions } from '../hooks/useVideoActions';

import { API_BASE_URL } from '@/config/api';
import { VIDEO_URL } from '@/config/api';
import { THUMB_URL } from '@/config/api';

import {
  ThumbsUp,
  Bookmark,
  TriangleAlert,
  Send,
} from 'lucide-react';

const COMMENT_LIMIT = 500;

const getAuthUser = () => JSON.parse(localStorage.getItem('user'));

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

const VideoPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [video, setVideo] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subLoading, setSubLoading] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [similarVideos, setSimilarVideos] = useState([]);

  const authUser = useMemo(() => getAuthUser(), []);

  const isMyVideo = video && authUser && parseInt(video.user_id) === parseInt(authUser.id);

  const isPremiumActive = (u) => {
    if (!u || parseInt(u.is_paid) === 0) return false;
    return new Date(u.premium_until) > new Date();
  };

  const handleCommentChange = (e) => {
    const value = e.target.value;
    if (value.length <= COMMENT_LIMIT) setNewComment(value);
  };

  const fetchComments = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/comments/get_comments.php?video_id=${id}`);
      setComments(res.data);
    } catch (err) { console.error(err); }
  }, [id]);

  const checkSubscription = useCallback(async (authorId) => {
    if (!authUser || authUser.id === authorId) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/user/check_sub.php?follower_id=${authUser.id}&followed_id=${authorId}`);
      setIsSubscribed(res.data.isSubscribed);
    } catch (err) { console.error(err); }
  }, [authUser]);

  const fetchSimilar = useCallback(async (videoId) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/video/get_similar.php?id=${videoId}`);
      setSimilarVideos(res.data);
    } catch (err) { console.error(err); }
  }, []);

  const loadPageData = useCallback(async () => {
    try {
      const viewerId = authUser ? authUser.id : 0;
      const res = await axios.get(`${API_BASE_URL}/video/get_video.php?id=${id}&viewer_id=${viewerId}`);

      if (res.data.status === 'success') {
        const videoData = res.data.video;
        setVideo(videoData);
        setIsLiked(videoData.is_liked === 1);
        fetchComments();
        fetchSimilar(id);
        checkSubscription(videoData.user_id);

        axios.post(`${API_BASE_URL}/video/view_increment.php`, {
          video_id: id
        }).catch(e => console.error('Ошибка просмотра:', e));

        if (authUser) {
          axios.post(`${API_BASE_URL}/history/log_view.php`, {
            user_id: authUser.id,
            video_id: id
          }).catch(e => console.error('Ошибка истории:', e));
        }
      }
    } catch (err) { console.error(err); }
  }, [id, authUser, fetchComments, fetchSimilar, checkSubscription]);

  const va = useVideoActions(loadPageData);

  useEffect(() => {
    loadPageData();
    window.scrollTo(0, 0);
  }, [loadPageData]);

  const handleSubscribeToggle = async () => {
    if (!authUser) return navigate('/login');
    if (isMyVideo || subLoading) return;
    setSubLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/user/subscribe.php`, {
        follower_id: authUser.id,
        followed_id: video.user_id
      });
      setIsSubscribed(res.data.status === 'subscribed');
    } catch (err) { console.error(err); } finally { setSubLoading(false); }
  };

  const handleSendComment = async () => {
    if (!newComment.trim()) return;
    try {
      await axios.post(`${API_BASE_URL}/comments/add_comment.php`, {
        user_id: authUser.id,
        video_id: id,
        text: newComment
      });
      setNewComment('');
      fetchComments();
    } catch (err) { alert(err.response?.data?.message || 'Ошибка'); }
  };

  if (!video) return <div className="loader">Загрузка...</div>;

  return (
    <div className="video-page-container">
      <VideoModals
        showPlaylistModal={va.showPlaylistModal}
        setShowPlaylistModal={va.setShowPlaylistModal}
        playlists={va.playlists}
        handleSaveToAny={va.handleSaveToAny}
        newPlaylistTitle={va.newPlaylistTitle}
        setNewPlaylistTitle={va.setNewPlaylistTitle}
        handleQuickCreate={va.handleQuickCreate}
        activeVideo={video}
        setActiveVideo={() => {}}
      />

      {/* ── ЛЕВАЯ КОЛОНКА ── */}
      <div className="video-main-content">

        {/* Плеер */}
        <div className="player-wrapper">
          <video
            controls
            autoPlay
            poster={`${THUMB_URL}${video.thumbnail}`}
            src={`${VIDEO_URL}${video.video_url}`}
            className="main-video-player"
          />
        </div>

        {/* Детали */}
        <div className="video-details">

          {/* Теги */}
          {video.tags?.length > 0 && (
            <div className="tags-row">
              {video.tags.map(tag => (
                <Link key={tag} to={`/search?q=%23${tag}`} className="tag-label">#{tag}</Link>
              ))}
            </div>
          )}

          {/* Заголовок */}
          <h2 className="vp-title">{video.title}</h2>

          {/* Статистика */}
          <div className="vp-stats-row">
            <span className="vp-stat">
              {formatViews(video.views)}{' '}
              {getPluralForm(video.views, ['просмотр', 'просмотра', 'просмотров'])}
            </span>
            <span className="vp-stat-dot" />
            <span className="vp-stat">{new Date(video.created_at).toLocaleDateString()}</span>
          </div>

          {/* Панель: автор + действия */}
          <div className="video-meta-bar">

            {/* Автор */}
            <div className="author-info">
              <Link to={`/profile/${video.user_id}`} onClick={e => e.stopPropagation()}>
                <img
                  src={video.avatar ? `${API_BASE_URL}/uploads/avatars/${video.avatar}` : '/default-avatar.png'}
                  alt={video.username}
                  className="author-avatar-img"
                />
              </Link>

              <div className="author-text">
                <Link to={`/profile/${video.user_id}`} className="author-name">
                  {video.full_name || video.username}
                </Link>
                <span className="sub-count">Автор платформы</span>
              </div>

              {isMyVideo ? (
                <button className="btn-sub btn-me" disabled>Это вы</button>
              ) : (
                <button className={`btn-sub ${isSubscribed ? 'btn-subscribed' : 'btn-subscribe'}`}
                  onClick={handleSubscribeToggle}
                  disabled={subLoading}
                >
                  {subLoading ? '...' : (isSubscribed ? 'Вы подписаны' : 'Подписаться')}
                </button>
              )}
            </div>

            {/* Действия */}
            <div className="video-actions">
              <button
                className={`action-pill ${isLiked ? 'action-pill--active' : ''}`}
                onClick={(e) => va.handleToggleSystem(e, 'liked', video.id)}
                title="Нравится"
              >
                <ThumbsUp size={16} strokeWidth={2} />
                <span>{video.likes_count || 0}</span>
              </button>

              <button
                className="action-pill"
                onClick={(e) => va.openPlaylistModal(e, video.id)}
                title="Сохранить"
              >
                <Bookmark size={16} strokeWidth={2} />
                <span>{video.saves_count || 0}</span>
                <span className="action-pill__label">Сохранить</span>
              </button>

              {!isMyVideo && (
                <button
                  className="action-pill"
                  onClick={(e) => va.handleReport(e, video.id, 'video')}
                  title="Пожаловаться"
                >
                  <TriangleAlert size={16} strokeWidth={2} />
                  <span className="action-pill__label">Жалоба</span>
                </button>
              )}
            </div>
          </div>

          {/* Описание */}
          {video.description && (
            <div className="video-description">
              <p>{video.description}</p>
            </div>
          )}
        </div>

        {/* ── КОММЕНТАРИИ ── */}
        <div className="comments-section">
          <h2 className="comments-heading">
            {comments.length}{' '}
            {getPluralForm(comments.length, ['комментарий', 'комментария', 'комментариев'])}
          </h2>

          {/* Поле ввода */}
          <div className="comment-input-block">
            <div className="comment-input-inner">
              <input
                type="text"
                placeholder={
                  isPremiumActive(authUser)
                    ? 'Оставьте комментарий...'
                    : 'Только для Premium-пользователей'
                }
                disabled={!isPremiumActive(authUser)}
                value={newComment}
                onChange={handleCommentChange}
                onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
              />
              {isPremiumActive(authUser) && newComment.length > 0 && (
                <span className={`char-counter ${newComment.length >= COMMENT_LIMIT ? 'char-counter--limit' : ''}`}>
                  {newComment.length}/{COMMENT_LIMIT}
                </span>
              )}
            </div>
            <button
              className="comment-send-btn"
              onClick={handleSendComment}
              disabled={!isPremiumActive(authUser) || !newComment.trim()}
              title="Отправить"
            >
              <Send size={16} strokeWidth={2} />
              <span>Отправить</span>
            </button>
          </div>

          {/* Список комментариев */}
          <div className="comments-list">
            {comments.map(c => (
              <div key={c.id} className="comment-item">
                <Link to={`/profile/${c.user_id}`} onClick={e => e.stopPropagation()}>
                  <img
                    src={c.avatar ? `${API_BASE_URL}/uploads/avatars/${c.avatar}` : '/default-avatar.png'}
                    alt=""
                    className="comment-avatar"
                  />
                </Link>

                <div className="comment-body">
                  <div className="comment-meta">
                    <Link to={`/profile/${c.user_id}`} className="comment-author">
                      {c.full_name || c.username}
                    </Link>
                    {c.is_paid == 1}
                    <span className="comment-date">
                      {new Date(c.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="comment-text">{c.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── ПРАВЫЙ САЙДБАР ── */}
      <aside className="video-sidebar">
        <h2 className="sidebar-heading">Следующие видео</h2>

        <div className="sidebar-grid">
          {similarVideos.length > 0 ? (
            similarVideos.map(sv => (
              <div
                key={sv.id}
                className="sidebar-video-card"
                onClick={() => navigate(`/video/${sv.id}`)}
              >
                {/* Превью 16:9 */}
                <div className="sidebar-thumb">
                  <img src={`${THUMB_URL}${sv.thumbnail}`} alt={sv.title} />
                </div>

                {/* Инфо */}
                <div className="sidebar-info">
                  <span className="sidebar-title">{sv.title}</span>
                  <div className="sidebar-meta">
                    <span>{sv.full_name || sv.username}</span>
                    <span className="sidebar-meta-dot" />
                    <span>{formatViews(sv.views)} просмотров</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="sidebar-empty">Похожих видео пока нет...</p>
          )}
        </div>
      </aside>
    </div>
  );
};

export default VideoPage;