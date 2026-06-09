import React from 'react';
import { NavLink, Outlet, Navigate, useNavigate } from 'react-router-dom';
import '../assets/styles/layout.css'; // Используем синхронизированные стили лайаута
import logo from '../assets/img/logo.svg';
import { LayoutDashboard, Users, Flag, Tags, Crown, HeartPulse, LogOut } from 'lucide-react';

const AdminLayout = () => {
  const navigate = useNavigate();
  const authUser = JSON.parse(localStorage.getItem('user'));

  // Защита: если не админ — на выход
  if (!authUser || Number(authUser.is_admin) !== 1) {
    return <Navigate to="/" />;
  }

  return (
    <div className="app-container">
      {/* Левая панель — Сайдбар */}
      <aside className="sidebar admin-sidebar">
        <div className="sidebar-top">
          <div className="logo-container" style={{ cursor: 'pointer' }} onClick={() => navigate('/admin')}>
            <img src={logo} alt="Community Logo" />
          </div>

          <nav className="nav-menu">
            <NavLink to="/admin" end className="nav-link">
              <LayoutDashboard size={18} strokeWidth={2} />
              <span>Дашборд</span>
            </NavLink>
            <NavLink to="/admin/channels" className="nav-link">
              <Users size={18} strokeWidth={2} />
              <span>Каналы</span>
            </NavLink>
            <NavLink to="/admin/reports" className="nav-link">
              <Flag size={18} strokeWidth={2} />
              <span>Жалобы</span>
            </NavLink>
            <NavLink to="/admin/tags" className="nav-link">
              <Tags size={18} strokeWidth={2} />
              <span>Теги</span>
            </NavLink>
            <NavLink to="/admin/monetization" className="nav-link">
              <Crown size={18} strokeWidth={2} />
              <span>Монетизация</span>
            </NavLink>
            <NavLink to="/admin/health" className="nav-link">
              <HeartPulse size={18} strokeWidth={2} />
              <span>Состояние системы</span>
            </NavLink>
          </nav>
        </div>

        <div className="sidebar-bottom">
          <nav className="nav-menu">
            <button
              onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
              className="nav-link"
            >
              <LogOut size={18} strokeWidth={2} transform="rotate(180)" />
              <span>Выйти из системы</span>
            </button>
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

      {/* Правая часть — Контент */}
      <main className="main-content">
        <section className="page-wrapper">
          <Outlet />
        </section>
      </main>
    </div>
  );
};

export default AdminLayout;