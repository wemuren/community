import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import axiosInstance from 'axios'; 
import '../assets/styles/video-card.css';
import '../assets/styles/grid.css';
import '../assets/styles/playlist.css';
import '../assets/styles/search.css';
import VideoCard from '../components/VideoCard';
import UserAvatar from '../components/UserAvatar';
import PlaylistCard from '../components/PlaylistCard';
import VideoModals from '../components/VideoModals'; // ИСПРАВЛЕНО: Добавили импорт компонента модальных окон
import { useVideoActions } from '../hooks/useVideoActions';

import { API_BASE_URL } from '@/config/api';

const SearchResults = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q');
  const [results, setResults] = useState({ users: [], videos: [], courses: [], playlists: [] });
  const [loading, setLoading] = useState(false);

  const authUser = JSON.parse(localStorage.getItem('user'));

  const va = useVideoActions();

  const fetchResults = useCallback(async () => {
    if (!query) return;
    setLoading(true);
    try {
      const res = await axiosInstance.get(`${API_BASE_URL}/search/global_search.php?q=${encodeURIComponent(query)}&viewer_id=${authUser?.id || 0}`);
      setResults(res.data);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  }, [query, authUser?.id]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const isTag = query?.startsWith('#');

  const isEmpty = !loading &&
    results.users.length === 0 &&
    results.videos.length === 0 &&
    results.courses.length === 0 &&
    (!results.playlists || results.playlists.length === 0);

  const handleEditPlaylistPlaceholder = (playlist) => {
    navigate(`/playlists?edit=${playlist.id}`);
  };

  return (
    <div className="settings-white-wrapper search-results-wrapper">
      {/* ИСПРАВЛЕНО: Вывели компонент модалок на страницу, передав ему все управление из хука va */}
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

      <div className="pl-top-bar">
        <h2>Результаты поиска:</h2>
      </div>

      {loading && (
        <div className="studio-field-subtext" style={{ fontSize: '16px', fontWeight: 600 }}>
          Поиск контента в базе данных...
        </div>
      )}

      {isEmpty && (
        <div className="search-empty-state">
          <p>По запросу <strong style={{ color: 'var(--primary-red)' }}>"{query}"</strong> ничего не найдено.</p>
          <span>Проверьте раскладку клавиатуры или попробуйте изменить формулировку.</span>
        </div>
      )}

      {/* КАНАЛЫ (АВТОРЫ) */}
      {results.users.length > 0 && (
        <section className="settings-col-section search-section">
          <h3>Каналы</h3>
          <div className="search-channels-scroll-row">
            {results.users.map(u => (
              <Link key={u.id} to={`/profile/${u.id}`} className="sub-channel-item">
                <div className="sub-channel-avatar-ctx">
                  <UserAvatar user={u} sizeClass="avatar-subs-list" />
                </div>
                <div className="sub-channel-text-group">
                  <span className="sub-channel-name">
                    {u.full_name || u.username}
                  </span>
                  <span className="sub-channel-handle">
                    @{u.username}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ВИДЕОРОЛИКИ */}
      {results.videos.length > 0 && (
        <section className="settings-col-section search-section">
          <h3>{isTag ? "Найденные видеоролики" : "Видео"}</h3>
          <div className="video-grid">
            {results.videos.map(v => (
              <VideoCard 
                key={v.id} 
                video={v} 
                onVideoClick={va.handleVideoClick} 
                onPlaylistOpen={va.openPlaylistModal}
                onToggleLiked={va.handleToggleSystem}
                onToggleLater={va.handleToggleSystem}
                onReport={va.handleReport}
              />
            ))}
          </div>
        </section>
      )}

      {/* ПЛЕЙЛИСТЫ */}
      {results.playlists && results.playlists.length > 0 && (
        <section className="settings-col-section search-section">
          <h3>Плейлисты</h3>
          <div className="video-grid">
            {results.playlists.map(pl => (
              <PlaylistCard 
                key={pl.id}
                playlist={pl}
                authUser={authUser}
                onEdit={handleEditPlaylistPlaceholder}
                fetchPlaylists={fetchResults}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default SearchResults;