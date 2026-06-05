import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import '../assets/styles/layout.css';
import logo from '../assets/img/logo.svg';
import { User, ChartNoAxesCombined, Plus, Video, Settings, ArrowLeft } from 'lucide-react';

const StudioLayout = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const hasChannel = user && parseInt(user.channel_created) === 1;
  const isBanned = user?.is_active == 0;

  return (
    <div className="app-container">
      <aside className="sidebar studio-sidebar">
        <div className="sidebar-top">
          <div className="logo-container" onClick={() => navigate(`/profile/${user?.id}`)} style={{ cursor: 'pointer' }}>
            <img src={logo} alt="Community Logo" />
          </div>

          <nav className="nav-menu">
            <NavLink title="Редактировать профиль" to="/studio/profile" className="nav-link">
              <User size={18} strokeWidth={2} />
              <span>Профиль</span>
            </NavLink>

            {/* Загрузка и управление видео — только незабаненным */}
            {hasChannel && !isBanned && (
              <>
                <NavLink title="Статистика" to="/studio/dashboard" className="nav-link">
                  <ChartNoAxesCombined size={18} strokeWidth={2} />
                  <span>Статистика</span>
                </NavLink>
                <NavLink title="Управление контентом" to="/studio/video" className="nav-link">
                  <Video size={18} strokeWidth={2} />
                  <span>Мои видео</span>
                </NavLink>
                <NavLink title="Загрузить новое видео" to="/studio/upload" className="nav-link">
                  <Plus size={18} strokeWidth={2} />
                  <span>Загрузка видео</span>
                </NavLink>
              </>
            )}

            {hasChannel && isBanned && (
              <div className="nav-link disabled-link" title="Публикация недоступна из-за блокировки">
                <span style={{ opacity: 0.5 }}>Публикация заблокирована</span>
              </div>
            )}

            {!hasChannel && (
              <div className="nav-link disabled-link" title="Сначала создайте канал в профиле">
                <span style={{ opacity: 0.5 }}>Остальные разделы <br /> доступны только Авторам</span>
              </div>
            )}
          </nav>
        </div>

        <div className="sidebar-bottom">
          <nav className="nav-menu">
            <NavLink to="/settings" className="nav-link">
              <Settings size={18} strokeWidth={2} />
              <span>Настройки</span>
            </NavLink>
            <NavLink to={`/profile/${user?.id}`} className="nav-link">
              <ArrowLeft size={18} strokeWidth={2} />
              <span>Вернуться</span>
            </NavLink>
          </nav>
          <div className="footer-links">

            <div className='lay-row'>
              <NavLink to="/landing"><span>О сервисе</span></NavLink>
              <a href="https://vk.com/wemurr" target="_blank" rel="noopener noreferrer">
                <span>Поддержка</span>
              </a>
            </div>

            <NavLink to="/terms"><span>Пользовательское соглашение</span></NavLink>

            <NavLink to="/privacy"><span>Политика конфиденциальности</span></NavLink>

          </div>
        </div>
      </aside>

      <main className="main-content">
        {/* Добавлен page-wrapper для сохранения отступов контента как на главной */}
        <section className="page-wrapper">
          <Outlet />
        </section>
      </main>
    </div>
  );
};

export default StudioLayout;