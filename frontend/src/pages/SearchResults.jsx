import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../assets/styles/video-card.css';
import '../assets/styles/grid.css';
import '../assets/styles/playlist.css';
import '../assets/styles/search.css';
import VideoCard from '../components/VideoCard';
import UserAvatar from '../components/UserAvatar';
import { useVideoActions } from '../hooks/useVideoActions';
import { FolderHeart } from 'lucide-react'; // Для иконки плейлиста в счетчике

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

  const isEmpty = !loading &&
    results.users.length === 0 &&
    results.videos.length === 0 &&
    results.courses.length === 0 &&
    (results.playlists?.length === 0 || !results.playlists);

  return (
    <div className="settings-white-wrapper">

      {/* СТЕРИЛЬНЫЙ ЗАГОЛОВОК С ОПТИМИЗИРОВАННЫМ HIGHLIGHT */}
       <div className="pl-top-bar">
        <h2>Результаты поиска:</h2>
      </div>

      {loading && <div className="studio-field-subtext" style={{ fontSize: '16px', fontWeight: 600 }}>Поиск контента в базе данных...</div>}

      {isEmpty && (
        <div className="search-empty-state">
          <p>По запросу <strong style={{ color: 'var(--primary-red)' }}>"{query}"</strong> ничего не найдено.</p>
          <span>Проверьте раскладку клавиатуры или попробуйте изменить формулировку.</span>
        </div>
      )}

      {/* КАНАЛЫ (АВТОРЫ) — ЛЕНТА С КРУЖОЧКАМИ, ИМЕНЕМ И ЮЗЕРОМ */}
      {results.users.length > 0 && (
        <section className="settings-col-section  search-section">
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
              <VideoCard key={v.id} video={v} onVideoClick={va.handleVideoClick} {...va} />
            ))}
          </div>
        </section>
      )}

      {/* ПЛЕЙЛИСТЫ (ИНТЕГРИРОВАНЫ В ОБЩИЙ СТИЛЬ С VIDEO-CARD) */}
      {results.playlists && results.playlists.length > 0 && (
        <section className="settings-col-section search-section">
          <h3>Плейлисты</h3>
          <div className="video-grid">
            {results.playlists.map(pl => (
              <div key={pl.id} className="playlist-card" onClick={() => navigate(`/playlists/${pl.id}`)}>

                {/* Обложка плейлиста со стопкой слоев по Фигме */}
                <div className="playlist-cover-thumbnail">
                  {pl.last_video_thumbnail ? (
                    <img src={`${THUMB_URL}${pl.last_video_thumbnail}`} alt={pl.title} className="playlist-cover-img" />
                  ) : (
                    <div className="playlist-empty-placeholder" style={{ backgroundColor: 'var(--primary-red)' }}></div>
                  )}

                  {/* Счетчик видео в правом нижнем углу обложки */}
                  <div className="playlist-video-counter">
                    <FolderHeart size={14} strokeWidth={2} />
                    <span className="playlist-counter-number">{pl.video_count}</span>
                  </div>
                </div>

                {/* Инфо-блок под обложкой */}
                <div className="playlist-info-block">
                  <h4 className="playlist-card-title">{pl.title}</h4>
                  <div className="playlist-meta-row">
                    <span className="playlist-meta-item">Автор: {pl.author_name || pl.username}</span>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default SearchResults;