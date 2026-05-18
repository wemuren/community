import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../assets/styles/not-found.css';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <h1 className="error-code">404</h1>
        <h2 className="error-message">Упс! Кажется, такой страницы нет :(</h2>
        <p className="error-desc">
          Мы обыскали всё COMMUNITY, но не смогли найти то, что вы ищете. 
          Возможно, ссылка устарела или видео было удалено.
        </p>
        <button className="back-home-btn" onClick={() => navigate('/')}>
          Вернуться на главную
        </button>
      </div>
    </div>
  );
};

export default NotFound;