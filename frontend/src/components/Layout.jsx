import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../assets/styles/layout.css';
import '../assets/styles/search-dropdown.css';
import logo from '../assets/img/logo.svg';
import { House, Users, ListVideo, User, PaintbrushVertical, Plus, Settings, LogOut, Search } from 'lucide-react';

import { API_BASE_URL } from '@/config/api';
const THUMB_URL = `${API_BASE_URL}/uploads/thumbnails/`;

const isPremiumActive = (user) => {
  if (!user || parseInt(user.is_paid) === 0) return false;
  if (!user.premium_until || user.premium_until === "0000-00-00 00:00:00") return false;
  return new Date(user.premium_until).getTime() > Date.now();
};

const getUserData = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

const Layout = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(getUserData());
  const [price, setPrice] = useState('...');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const debounceTimer = useRef(null);
  const searchRef = useRef(null);

  const getPluralForm = (number, titles) => {
    const cases = [2, 0, 1, 1, 1, 2];
    return titles[(number % 100 > 4 && number % 100 < 20) ? 2 : cases[(number % 10 < 5) ? number % 10 : 5]];
  };

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/billing/get_settings.php`);
        if (res.data?.sub_price) setPrice(res.data.sub_price);
      } catch (err) { console.error("Ошибка цены:", err); }
    };
    fetchPrice();
    const interval = setInterval(() => { setUser(getUserData()); }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Закрываем дропдаун при клике вне поиска
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Динамический поиск с debounce 300ms
  const handleSearchChange = useCallback((e) => {
    const val = e.target.value;
    setSearchQuery(val);

    clearTimeout(debounceTimer.current);

    if (!val.trim()) {
      setSearchResults(null);
      setShowDropdown(false);
      return;
    }

    setSearchLoading(true);
    setShowDropdown(true);

    debounceTimer.current = setTimeout(async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/search/global_search.php?q=${encodeURIComponent(val.trim())}`
        );
        setSearchResults(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  }, []);

  // Сбросить поиск и перейти
  const handleSelect = useCallback((path) => {
    setSearchQuery('');
    setSearchResults(null);
    setShowDropdown(false);
    navigate(path);
  }, [navigate]);

  // Enter — переходим на страницу поиска
  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      setShowDropdown(false);
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
    navigate('/login', { replace: true });
  };

  const getDaysRemaining = (dateString) => {
    if (!dateString || dateString === "0000-00-00 00:00:00") return null;
    return Math.ceil((new Date(dateString) - new Date()) / (1000 * 60 * 60 * 24));
  };

  const daysLeft = getDaysRemaining(user?.premium_until);
  const activePremium = isPremiumActive(user);
  const expiredPremium = user?.is_paid == 1 && !activePremium;
  const hasChannel = user?.channel_created == 1;
  const isBanned = user?.is_active == 0;

  const hasResults = searchResults && (
    searchResults.users?.length > 0 ||
    searchResults.videos?.length > 0 ||
    searchResults.playlists?.length > 0
  );

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="logo-container" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
            <img src={logo} alt="Community Logo" />
          </div>
          <nav className="nav-menu">
            <NavLink to="/" className="nav-link">
              <House size={18} strokeWidth={2} />
              <span>Главная</span>
            </NavLink>
            <NavLink to="/subs" className="nav-link">
              <Users size={18} strokeWidth={2} />
              <span>Подписки</span>
            </NavLink>
            <NavLink to="/playlists" className="nav-link">
              <ListVideo size={18} strokeWidth={2} />
              <span>Плейлисты</span>
            </NavLink>
            <NavLink to={user ? `/profile/${user.id}` : '/login'} className="nav-link">
              <User size={18} strokeWidth={2} />
              <span>Профиль</span>
            </NavLink>

            {hasChannel && (
              <NavLink to="studio/profile" className="nav-link">
                <PaintbrushVertical size={18} strokeWidth={2} />
                <span>Творческая студия</span>
              </NavLink>
            )}

            {hasChannel && !isBanned && (
              <button className="nav-link" onClick={() => navigate('studio/upload')}>
                <Plus size={16} strokeWidth={2.5} />
                <span>Загрузить видео</span>
              </button>
            )}
          </nav>
        </div>

        <div className={`premium-card ${activePremium ? 'is-premium' : ''} ${expiredPremium ? 'is-expired' : ''}`}>
  <div className="premium-info">
    {activePremium ? (
      <>
        <div className="premium-header-flex">
          <p className="premium-title">Premium активен</p>
          {daysLeft <= 5 && <span className="urgent-badge">!</span>}
        </div>
        <p className="premium-days">
          Осталось: <strong>{daysLeft} {getPluralForm(daysLeft, ['день', 'дня', 'дней'])}</strong>
        </p>
      </>
    ) : expiredPremium ? (
      <>
        <p className="premium-title">Premium истек</p>
        <p className="premium-days">Функции ограничены</p>
      </>
    ) : (
      <>
        <p className="premium-title">Полный доступ к контенту</p>
        <p className="premium-price">Всего за {price} единиц валюты!</p>
      </>
    )}
  </div>
  <button className="premium-button" onClick={() => navigate('/premium')}>
    {activePremium ? 'ПРОДЛИТЬ' : expiredPremium ? 'РАЗБЛОКИРОВАТЬ' : 'ОФОРМИТЬ'}
  </button>
</div>

        <div className="sidebar-bottom">
          <nav className="nav-menu">
            <NavLink to="/settings" className="nav-link">
              <Settings size={18} strokeWidth={2} />
              <span>Настройки</span>
            </NavLink>
            <button onClick={handleLogout} className="nav-link">
              <LogOut size={18} strokeWidth={2} transform="rotate(180)"/>
              <span>Выйти</span>
            </button>
          </nav>
          <div className="footer-links">
            <NavLink to="/landing"><span>О сервисе</span></NavLink>
            <NavLink to="/privacy"><span>Политика конфиденциальности</span></NavLink>
            <NavLink to="/terms"><span>Пользовательское соглашение</span></NavLink>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="header">
          <div className="search-wrapper" ref={searchRef}>
            <div className="search-icon" onClick={() => {
              if (searchQuery.trim()) {
                navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                setSearchQuery('');
                setShowDropdown(false);
              }
            }}>
              <Search size={18} strokeWidth={2.5} color='grey'/>
            </div>
            <input
              type="text"
              placeholder="Поиск видео, каналов, плейлистов..."
              className="search-input"
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleSearchSubmit}
              onFocus={() => { if (searchResults) setShowDropdown(true); }}
            />

            {/* ЖИВОЙ ДРОПДАУН */}
            {showDropdown && (
              <div className="search-dropdown">
                {searchLoading && (
                  <div className="search-dropdown-loading">Ищем...</div>
                )}

                {!searchLoading && !hasResults && searchResults && (
                  <div className="search-dropdown-empty">Ничего не найдено</div>
                )}

                {!searchLoading && hasResults && (
                  <>
                    {/* КАНАЛЫ */}
                    {searchResults.users?.length > 0 && (
                      <div className="search-dropdown-section">
                        <div className="search-dropdown-label">Каналы</div>
                        {searchResults.users.slice(0, 3).map(u => (
                          <div
                            key={u.id}
                            className="search-dropdown-item"
                            onClick={() => handleSelect(`/profile/${u.id}`)}
                          >
                            <div className="search-dd-avatar">
                              {u.avatar
                                ? <img src={`${API_BASE_URL}/uploads/avatars/${u.avatar}`} alt="" />
                                : <span>{(u.full_name || u.username || '?').charAt(0).toUpperCase()}</span>
                              }
                            </div>
                            <div className="search-dd-info">
                              <span className="search-dd-name">{u.full_name || u.username}</span>
                              <span className="search-dd-sub">@{u.username}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* ВИДЕО */}
                    {searchResults.videos?.length > 0 && (
                      <div className="search-dropdown-section">
                        <div className="search-dropdown-label">Видео</div>
                        {searchResults.videos.slice(0, 4).map(v => (
                          <div
                            key={v.id}
                            className="search-dropdown-item"
                            onClick={() => handleSelect(`/video/${v.id}`)}
                          >
                            <div className="search-dd-thumb">
                              {v.thumbnail
                                ? <img src={`${THUMB_URL}${v.thumbnail}`} alt="" />
                                : <div className="search-dd-thumb-placeholder" />
                              }
                            </div>
                            <div className="search-dd-info">
                              <span className="search-dd-name">{v.title}</span>
                              <span className="search-dd-sub">{v.full_name || v.username}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* ПЛЕЙЛИСТЫ */}
                    {searchResults.playlists?.length > 0 && (
                      <div className="search-dropdown-section">
                        <div className="search-dropdown-label">Плейлисты</div>
                        {searchResults.playlists.slice(0, 3).map(pl => (
                          <div
                            key={pl.id}
                            className="search-dropdown-item"
                            onClick={() => handleSelect(`/playlists/${pl.id}`)}
                          >
                            <div className="search-dd-thumb">
                              {pl.last_video_thumbnail
                                ? <img src={`${THUMB_URL}${pl.last_video_thumbnail}`} alt="" />
                                : <div className="search-dd-thumb-placeholder" />
                              }
                            </div>
                            <div className="search-dd-info">
                              <span className="search-dd-name">{pl.title}</span>
                              <span className="search-dd-sub">{pl.video_count} видео · {pl.author_name || pl.username}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Ссылка на полные результаты */}
                    <div
                      className="search-dropdown-all"
                      onClick={() => {
                        navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                        setSearchQuery('');
                        setShowDropdown(false);
                      }}
                    >
                      Показать все результаты →
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </header>
        <section className="page-wrapper">
          <Outlet />
        </section>
      </main>
    </div>
  );
};

export default Layout;