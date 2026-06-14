import React from 'react';
import '../assets/styles/landing.css';

// Импорт иконок из папки с компонентом
import logo from '../assets/img/logo.svg';
import logo2 from '../assets/img/logo2.svg';
import eye from '../assets/img/eye.svg';
import heart from '../assets/img/heart.svg';
import star from '../assets/img/star.svg';
import star2 from '../assets/img/star2.svg';

export default function Landing() {
  return (
    <div className="landing-container">
      {/* Шапка */}
      <header className="header">
        <div className="header-inner">
          <div className="logo-container">
            <img src={logo} alt="Комьюнити" />
          </div>
          <nav className="nav-menu">
            <a href="#features" className="nav-link">Возможности</a>
            <a href="#tariffs" className="nav-link">Тарифы</a>
            <a href="#register" className="btn-gradient">Регистрация</a>
          </nav>
        </div>
      </header>

      {/* Главный экран */}
      <section className="hero-section">
        <div className="hero-card">
          <div className="hero-title-wrapper">
            <div className="hero-row-first">
              <h1 className="hero-title">Образовательная</h1>
              <img src={star} alt="" className="hero-star-icon" />
            </div>
            <div className="hero-row-second">
              <h1 className="hero-title">
                <span className="accent">видеоплатформа</span>
              </h1>
            </div>
          </div>
          
          <div className="hero-footer">
            <p className="hero-desc">
              Для изучения IT<br />публикации экспертного контента <br />и развития профессионального сообщества
            </p>
            <span className="hero-tagline">Изучайте новые технологии</span>
          </div>
        </div>
      </section>

      {/* Возможности (Асимметричный Bento-grid на флексах из Фигмы) */}
      <section id="features" className="section-container">
        <div className="section-header-row">
          <h2 className="section-h2">Возможности</h2>
        </div>
        
        <div className="bento-wrapper">
          {/* Строка 1 */}
          <div className="bento-row">
            <div className="bento-item-fixed-right">
              <div className="bento-content-inner">
                <div className="card-header-row">
                  <div className="card-icon-container">
                    <img src={eye} alt="" style={{ width: '33.18px', height: '48.83px', position: 'absolute', left: 0, top: '0.56px' }} />
                    <img src={eye} alt="" style={{ width: '35.08px', height: '50px', position: 'absolute', left: '64.10px', top: 0 }} />
                  </div>
                  <h3 className="card-h3">Смотрите и изучайте</h3>
                </div>
                <p className="card-p">
                  Получите доступ к образовательным видеоматериалам <br />по программированию, веб-разработке, дизайну <br />и другим цифровым направлениям.
                </p>
              </div>
            </div>

            <div className="bento-item-fluid">
              <div className="bento-content-inner">
                <div className="card-header-row">
                  <h3 className="card-h3">Публикуйте видео</h3>
                </div>
                <p className="card-p">
                  Загружайте собственный контент и делитесь <br />знаниями с другими участниками сообщества.
                </p>
              </div>
            </div>
          </div>

          {/* Строка 2 */}
          <div className="bento-row">
            <div className="bento-item-fixed-right">
              <div className="bento-content-inner">
                <div className="card-header-row">
                  <img src={star2} alt="" className="card-icon-square" />
                  <h3 className="card-h3">Развивайте канал</h3>
                </div>
                <p className="card-p">
                  Публикуйте образовательные материалы <br />и собирайте аудиторию.
                </p>
              </div>
            </div>

            <div className="bento-item-fluid">
              <div className="bento-content-inner">
                <div className="card-header-row">
                  <h3 className="card-h3">Создавайте собственные подборки</h3>
                </div>
                <p className="card-p">
                  Формируйте плейлисты и сохраняйте полезные <br />материалы для удобного и структурированного обучения.
                </p>
              </div>
            </div>
          </div>

          {/* Строка 3 */}
          <div className="bento-row">
            <div className="bento-item-fluid">
              <div className="bento-content-inner">
                <div className="card-header-row">
                  <img src={heart} alt="" className="card-icon-square" style={{ width: '41.67px', height: '37.50px' }} />
                  <h3 className="card-h3">Участвуйте в сообществе</h3>
                </div>
                <p className="card-p">
                  Делитесь опытом, обсуждайте <br />технологии и обменивайтесь знаниями.
                </p>
              </div>
            </div>

            <div className="bento-item-fixed-right">
              <div className="bento-content-inner">
                <div className="card-header-row">
                  <h3 className="card-h3">Анализируйте результаты</h3>
                </div>
                <p className="card-p">
                  Используйте Творческую студию для просмотра статистики, <br />анализа просмотров и оценки эффективности контента.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Тарифы */}
      <section id="tariffs" className="tariffs-container">
        <div className="section-header-row">
          <h2 className="section-h2">тарифы</h2>
        </div>
        
        <div className="tariffs-row">
          {/* Бесплатный тариф */}
          <div className="tariff-card-fluid">
            <div className="tariff-inner-content">
              <h3 className="tariff-title">Бесплатный тариф</h3>
              <ul className="tariff-list">
                <li className="tariff-item">
                  <span className="check-icon">✓</span>
                  <div className="tariff-text-el"><p className="tariff-p">Просмотр образовательных видео</p></div>
                </li>
                <li className="tariff-item">
                  <span className="check-icon">✓</span>
                  <div className="tariff-text-el"><p className="tariff-p">Создание плейлистов</p></div>
                </li>
                <li className="tariff-item">
                  <span className="check-icon">✓</span>
                  <div className="tariff-text-el"><p className="tariff-p">Создание собственного канала</p></div>
                </li>
                <li className="tariff-item">
                  <span className="check-icon">✓</span>
                  <div className="tariff-text-el"><p className="tariff-p">Кастомизация профиля</p></div>
                </li>
                <li className="tariff-item">
                  <span className="check-icon">✓</span>
                  <div className="tariff-text-el"><p className="tariff-p">Возможность публикации видео (до 100 мб)</p></div>
                </li>
                <li className="tariff-item">
                  <span className="check-icon">✓</span>
                  <div className="tariff-text-el"><p className="tariff-p">Творческая студия и аналитика</p></div>
                </li>
              </ul>
            </div>
          </div>

          {/* Премиум тариф */}
          <div className="tariff-card-fluid">
            <div className="tariff-inner-content">
              <h3 className="tariff-title">Премиум-тариф</h3>
              <ul className="tariff-list">
                <li className="tariff-item">
                  <span className="check-icon">✓</span>
                  <div className="tariff-text-el"><p className="tariff-p">Все возможности Бесплатного тарифа</p></div>
                </li>
                <li className="tariff-item-centered">
                  <span className="premium-tag">Загрузка видео до 1 ГБ</span>
                </li>
                <li className="tariff-item-centered">
                  <span className="premium-tag">Расширенная персонализация аккаунта</span>
                </li>
                <li className="tariff-item-centered">
                  <span className="premium-tag">Возможность оставлять комментарии под видео</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Промокод */}
      <section className="promo-banner">
        <div className="promo-inner">
          <div className="promo-title-block">
            <div className="promo-h2-row">
              <h2 className="promo-h2">ПОПРОБУЙТЕ ПРЕМИУМ БЕСПЛАТНО </h2>
            </div>
            <p className="promo-p">Активируйте премиум-доступ на 30 дней, чтобы познакомиться со всеми возможностями платформы</p>
          </div>
          <div className="promo-code-box">
            <div className="promo-code">COMM-FREE30DAYS</div>
          </div>
        </div>
      </section>

      {/* CTA-Блок */}
      <section id="register" className="cta-section">
        <div className="cta-card">
          <div className="cta-top-row">
            <h2 className="cta-h2">присоединяйтесь <br />к комьюнити!</h2>
            <a href="#register" className="btn-gradient">Зарегистрироваться</a>
          </div>
          <div className="cta-bottom-row">
            <p className="cta-p">Создавайте образовательный контент, развивайте собственный канал <br />и становитесь частью сообщества, где главная ценность — знания.</p>
            <img src={star} alt="" className="cta-star" />
          </div>
        </div>
      </section>

      {/* Темный Футер */}
      <footer className="footer-dark">
        <div className="footer-inner">
          <div className="footer-left-col">
            <div className="footer-logo-box">
              <img src={logo2} alt="Комьюнити" />
            </div>
            <div className="footer-diploma">Дипломный проект 2026</div>
          </div>
          <div className="footer-right-nav">
            <a href="#privacy" className="footer-link">Политика Конфиденциальности</a>
            <a href="#terms" className="footer-link">Пользовательское Соглашение</a>
            <a href="#support" className="footer-link">Поддержка</a>
          </div>
        </div>
      </footer>
    </div>
  );
}