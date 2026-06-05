import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Tv, Activity, Grid, Check, X, ArrowRight, FileVideo, MessageSquare, ShieldCheck } from 'lucide-react';
import '../assets/styles/landing.css';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-container">
      {/* HERO SECTION */}
      <section className="landing-hero">
        <div className="badge-diploma">Дипломный проект</div>
        <h1 className="hero-title">COMMUNITY</h1>
        <p className="hero-subtitle">
          Образовательная видеоплатформа, созданная для свободного обмена знаниями, разбора кейсов и лекций.
        </p>
        <p className="hero-description">
          Экспериментальная среда нового поколения. Никакой рекламы, никаких скрытых алгоритмов удержания внимания — только чистый фокус на контенте, строгая модульная сетка и техническая эстетика.
        </p>
        <button className="btn-join" onClick={() => navigate('/register')}>
          Присоединиться к комьюнити <ArrowRight size={20} />
        </button>
      </section>

      {/* BENTO GRID CONCEPTS */}
      <section className="landing-bento">
        <div className="bento-card bento-main">
          <div className="bento-icon"><Grid size={24} /></div>
          <h3>Чистый индастриал-дизайн</h3>
          <p>Интерфейс спроектирован по жесткой сетке, не отвлекает от сути и адаптирован под любые рабочие окружения — от мониторов 1920x1440 до быстрых мобильных сессий.</p>
        </div>

        <div className="bento-card bento-side">
          <div className="bento-icon"><Activity size={24} /></div>
          <h3>Сквозная аналитика</h3>
          <p>Встроенная Творческая студия позволяет авторам контролировать просмотры, удержание и активность в реальном времени.</p>
        </div>

        <div className="bento-card bento-full">
          <div className="bento-icon"><Tv size={24} /></div>
          <h3>Качественная дистрибуция контента</h3>
          <p>Платформа оптимизирована под мгновенную отдачу исходного видеопотока. Ваши лекции и туториалы транслируются без жесткого сжатия и потери детализации интерфейсов.</p>
        </div>
      </section>

      {/* TARIFFS SECTION */}
      <section className="landing-tariffs">
        <h2 className="section-title">Тарифные планы</h2>
        
        <div className="tariffs-grid">
          {/* БЕСПЛАТНО */}
          <div className="tariff-card">
            <div className="tariff-header">
              <h3>БЕСПЛАТНО</h3>
              <p className="tariff-desc">Базовые возможности для старта</p>
            </div>
            
            <ul className="tariff-features">
              <li><Check size={18} className="icon-check" /> <span>Безлимитный просмотр базы</span></li>
              <li><Check size={18} className="icon-check" /> <span>Публикация видео (ограничение до 100 МБ)</span></li>
              <li><Check size={18} className="icon-check" /> <span>Базовая статистика канала в Студии</span></li>
              <li className="disabled"><X size={18} className="icon-x" /> <span>Комментарии (только чтение)</span></li>
              <li className="disabled"><X size={18} className="icon-x" /> <span>Профиль автора по умолчанию</span></li>
            </ul>

            <button className="btn-tariff-action" onClick={() => navigate('/register')}>
              Начать бесплатно
            </button>
          </div>

          {/* PREMIUM */}
          <div className="tariff-card premium">
            <div className="premium-badge">Максимум управления</div>
            <div className="tariff-header">
              <h3>Премиум</h3>
              <p className="tariff-desc">Полный контроль контента и визуала</p>
            </div>
            
            <ul className="tariff-features">
              <li><Check size={18} className="icon-check" /> <span>Безлимитный просмотр базы</span></li>
              <li><Check size={18} className="icon-check" /> <span><strong>Безлимитная загрузка</strong> (файлы до 2 ГБ)</span></li>
              <li><Check size={18} className="icon-check" /> <span>Полноценные комментарии и обсуждения</span></li>
              <li><Check size={18} className="icon-check" /> <span>Персонализация (кастомный баннер канала)</span></li>
              <li><Check size={18} className="icon-check" /> <span>Продвинутая аналитика и статус «Автор дня»</span></li>
            </ul>

            <button className="btn-tariff-action btn-premium-action" onClick={() => navigate('/premium')}>
              Оформить доступ
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer">
        <div className="footer-copyright">COMMUNITY © {new Date().getFullYear()} · Разработано как дипломный проект</div>
        <div className="footer-links">
          <span onClick={() => navigate('/terms')}>Условия соглашения</span>
          <span onClick={() => navigate('/privacy')}>Конфиденциальность</span>
        </div>
      </footer>
    </div>
  );
};

export default Landing;