import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import VideoCard from '../components/VideoCard';
import UserAvatar from '../components/UserAvatar';
import { useVideoActions } from '../hooks/useVideoActions';

import { API_BASE_URL, THUMB_URL } from '@/config/api';

const SearchResults = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q');
  const [results, setResults] = useState({ users: [], videos: [], courses: [], playlists: [] });
  const [loading, setLoading] = useState(false);
  
  const va = useVideoActions();

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/search/global_search.php?q=${encodeURIComponent(query)}`);
        setResults(res.data);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    };
    if (query) fetchResults();
  }, [query]);

  const isTag = query?.startsWith('#');
  const isMention = query?.startsWith('@');

  // Проверка на отсутствие результатов
  const isEmpty = !loading && 
                  results.users.length === 0 && 
                  results.videos.length === 0 && 
                  results.courses.length === 0 && 
                  (results.playlists?.length === 0 || !results.playlists);

  return (
    <div className="search-results-page">
      <div className="search-header">
         <h1>
           {isTag ? `Контент по тегу: ` : isMention ? `Профиль: ` : `Результаты по запросу: `}
           <span className="query-highlight">{query}</span>
         </h1>
      </div>

      {loading && <div className="loader">Поиск...</div>}

      {isEmpty && (
        <div className="no-results-state">
          <p>По запросу <strong>"{query}"</strong> ничего не найдено.</p>
          <span>Попробуйте изменить формулировку или проверьте раскладку.</span>
        </div>
      )}

      {/* КАНАЛЫ */}
      {results.users.length > 0 && (
        <section className="search-section">
          <h3>Каналы</h3>
          <div className="users-search-list">
            {results.users.map(u => (
              <Link key={u.id} to={`/profile/${u.id}`} className="search-user-item">
                <UserAvatar user={u} sizeClass="avatar-medium" />
                <div className="search-user-info">
                  <p className="u-name">{u.full_name || u.username}</p>
                  <p className="u-handle">@{u.username}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ВИДЕО */}
      {results.videos.length > 0 && (
        <section className="search-section">
          <h3>{isTag ? "Найденные видео" : "Видео"}</h3>
          <div className="video-grid">
            {results.videos.map(v => (
              <VideoCard key={v.id} video={v} onVideoClick={va.handleVideoClick} {...va} />
            ))}
          </div>
        </section>
      )}

      {/* ПЛЕЙЛИСТЫ */}
      {results.playlists && results.playlists.length > 0 && (
        <section className="search-section">
          <h3>Плейлисты</h3>
          <div className="video-grid">
            {results.playlists.map(pl => (
              <div key={pl.id} className="playlist-main-card" onClick={() => navigate(`/playlists/${pl.id}`)}>
                <div className="playlist-cover-wrapper">
                  {pl.last_video_thumbnail ? (
                    <div className="playlist-image-container">
                      <img src={`${THUMB_URL}${pl.last_video_thumbnail}`} alt={pl.title} className="playlist-main-img" />
                      <div className="playlist-overlay-count"><span>≡</span> {pl.video_count}</div>
                    </div>
                  ) : (
                    <div className="playlist-red-cover">
                      <div className="playlist-count-badge"><span>≡</span> {pl.video_count}</div>
                    </div>
                  )}
                </div>
                <div className="playlist-info">
                  <h4>{pl.title}</h4>
                  <p className="sub-text">Автор: {pl.author_name || pl.username} • {pl.video_count} видео</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* КУРСЫ */}
      {results.courses.length > 0 && (
        <section className="search-section">
          <h3>Курсы</h3>
          <div className="courses-grid">
             {/* Сюда карточки курсов */}
          </div>
        </section>
      )}
    </div>
  );
};

export default SearchResults;
