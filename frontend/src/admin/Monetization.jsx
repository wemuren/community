import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Crown, Ticket, Plus, X, Copy, Check } from 'lucide-react';
import '../assets/styles/admin.css'; // Родная база админки
import '../assets/styles/auth.css'; // База инпутов и кнопок
import '../assets/styles/modals.css'; // Для сквозных модалок
import UserAvatar from '../components/UserAvatar';

import { API_BASE_URL } from '@/config/api';

const Monetization = () => {
  const navigate = useNavigate();
  const [data, setData] = useState({ promos: [], premiums: [], price: '0' });
  const [copiedCode, setCopiedCode] = useState(null);

  // Состояния для создания кастомного промокода
  const [promoText, setPromoText] = useState('');
  
  // Состояния для модалки изменения цены подписки
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [tempPrice, setTempPrice] = useState('');
  const [loading, setLoading] = useState(false);

  const authUser = JSON.parse(localStorage.getItem('user')) || {};

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/manage_monetization.php?admin_id=${authUser.id}`);
      setData(res.data);
      setTempPrice(res.data.price);
    } catch (err) { 
      console.error("Ошибка загрузки данных монетизации:", err); 
    }
  };

  useEffect(() => { 
    if (authUser?.id) fetchData(); 
  }, [authUser?.id]);

  // Изменение стоимости тарифа Premium
  const handleUpdatePrice = async (e) => {
    e.preventDefault();
    if (!tempPrice || loading) return;
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/admin/manage_monetization.php`, {
        admin_id: authUser.id,
        action: 'update_price',
        new_price: tempPrice
      });
      setIsPriceModalOpen(false);
      fetchData();
    } catch (err) { 
      alert("Ошибка при изменении стоимости тарифа"); 
    } finally {
      setLoading(false);
    }
  };

  // Копирование промокода в буфер обмена
  const copyToClipboard = (e, code) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Создание промокода (Ручное или Рандомное)
  const handleCreatePromo = async (e) => {
    e.preventDefault();
    
    // Если текст вбит — формируем кастомный, если пусто — отправляем пустую строку (бэк сделает рандом)
    const fullCode = promoText.trim() ? `COMM-${promoText.trim().toUpperCase()}` : '';
    
    try {
      await axios.post(`${API_BASE_URL}/admin/manage_monetization.php`, {
        admin_id: authUser.id, 
        action: 'generate_promo',
        custom_code: fullCode
      });
      setPromoText('');
      fetchData();
    } catch (err) {
      console.error("Ошибка при генерации промокода:", err);
      alert(err.response?.data?.message || "Ошибка генерации");
    }
  };

  // Удаление промокода из базы данных
  const handleDeletePromo = async (e, promoId) => {
    e.stopPropagation(); // Исключаем срабатывание копирования при клике на корзину
    if (!window.confirm("Удалить этот промокод навсегда?")) return;
    try {
      await axios.post(`${API_BASE_URL}/admin/manage_monetization.php`, {
        admin_id: authUser.id,
        action: 'delete_promo',
        promo_id: promoId
      });
      fetchData();
    } catch (err) {
      alert("Не удалось удалить промокод");
    }
  };

  const getDaysRemaining = (dateString) => {
    if (!dateString) return 0;
    const now = new Date();
    const end = new Date(dateString);
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays > 0 ? diffDays : 0;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  return (
    <div className="settings-white-wrapper">
      
      {/* КНОПКА НАЗАД */}
      <div className="settings-back-action" onClick={() => navigate(-1)}>
        <ChevronLeft size={16} strokeWidth={2} /> Назад
      </div>

      <div className="pl-top-bar">
        <h2>Монетизация и тарифы</h2>
      </div>
      
      {/* РОДНАЯ СЕТКА АДМИНКИ ДЛЯ ПОКАЗАТЕЛЕЙ ТАРИФОВ */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card clickable" onClick={() => setIsPriceModalOpen(true)}>
          <div className="admin-stat-card-header">
            <span className="admin-stat-label">Стоимость</span>
            <Crown size={16} strokeWidth={2} className="admin-stat-icon-likes" />
          </div>
          <h2 className="admin-stat-value critical">{data.price}</h2>
          <span className="studio-field-subtext-action">Изменить тариф платформы →</span>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card-header">
            <span className="admin-stat-label">Активные подписки</span>
            <Crown size={16} strokeWidth={2} className="admin-stat-icon-subs" />
          </div>
          <h2 className="admin-stat-value">{data.premiums.length}</h2>
          <span className="studio-field-subtext">Пользователи с платным доступом</span>
        </div>
      </div>

      {/* ДВУХКОЛОНОЧНЫЙ БЛОК: ПРОМОКОДЫ И ТАБЛИЦА */}
      <div className="admin-split-view">
        
        {/* ЛЕВАЯ КОЛОНКА: МАРКЕТИНГ И ПРОМОКОДЫ */}
        <div className="monetization-promo-column">
          <h3 className="admin-stat-label">
            Создание промокода
          </h3>
          
          {/* ФОРМА СОЗДАНИЯ: ЕСЛИ ПУСТО — ГЕНЕРИРУЕТ РАНДОМ */}
          <form onSubmit={handleCreatePromo} className="admin-tag-inline-form">
            <div className="input-group">
              <div className="promo-input-prefix-wrapper">
                <span className="promo-static-prefix">
                  COMM-
                </span>
                <input 
                  type="text"
                  value={promoText}
                  onChange={(e) => setPromoText(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())}
                  className="auth-input promo-custom-padding"
                />
              </div>
            </div>
            <button 
              type="submit" 
              className="tag-btn active promo-btn-submit-size" 
              title={promoText.trim() ? "Создать кастомный код" : "Сгенерировать случайный код"}
            >
              <Plus size={14} strokeWidth={2.5} />
            </button>
          </form>

          {/* СПИСОК АКТИВНЫХ ПРОМОКОДОВ В ИНДАСТРИАЛ-ПИЛЛАХ */}
          <div className="admin-tags-pills-grid">
            {data.promos.map(p => (
              <div 
                key={p.id} 
                className="admin-tag-pill-item promo-pill-fullwidth"
                onClick={(e) => copyToClipboard(e, p.code)}
                title="Кликните, чтобы скопировать"
              >
                <div className="promo-code-text-block">
                  <Ticket size={16} className="stat-icon promo-icon-opacity" />
                  <code className="promo-monospace-code">
                    {p.code}
                  </code>
                  {copiedCode === p.code ? (
                    <span className="promo-copied-badge">
                      <Check size={12} strokeWidth={3} /> Скопировано
                    </span>
                  ) : (
                    <Copy size={12} className="promo-icon-opacity" />
                  )}
                </div>
                
                <div className="promo-code-actions-block">
                  <span className="studio-field-subtext promo-duration-badge">
                    30 ДН.
                  </span>
                  <button 
                    type="button" 
                    className="tag-pill-delete-action-btn" 
                    onClick={(e) => handleDeletePromo(e, p.id)}
                    title="Удалить промокод"
                  >
                    <X size={14} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            ))}
            {data.promos.length === 0 && <p className="studio-field-subtext">Активных промокодов в системе нет.</p>}
          </div>
        </div>

        {/* ПРАВАЯ КОЛОНКА: МОНОЛИТНАЯ ТАБЛИЦА ПРЕМИУМ-ПОЛЬЗОВАТЕЛЕЙ */}
        <div className="monetization-table-column">
          <h3 className="admin-stat-label">
            Премиум-аккаунты
          </h3>
          
          <div className="admin-table">
            <div className="admin-table-header">
              <div className="admin-col admin-col-user-flex"><span className="admin-stat-label">Пользователь</span></div>
              <div className="admin-col admin-col-center-flex"><span className="admin-stat-label">Действует до</span></div>
              <div className="admin-col admin-col-right-flex"><span className="admin-stat-label">Статус</span></div>
            </div>

            {data.premiums.map(u => {
              const daysLeft = getDaysRemaining(u.premium_until);
              return (
                <div key={u.id} className="admin-table-row">
                  <div className="admin-col admin-col-user-flex">
                    <div className="admin-user-cell">
                      <UserAvatar user={u} sizeClass="avatar-mini" />
                      <div className="admin-user-text">
                        <strong className="admin-user-fullname">{u.full_name || u.username}</strong>
                        <span className="studio-field-subtext">@{u.username}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="admin-col admin-col-center-flex promo-table-date">
                    {formatDate(u.premium_until)}
                  </div>

                  <div className="admin-col admin-col-right-flex">
                    <span 
                      className="tag-btn active promo-table-status-badge" 
                      style={{ 
                        background: daysLeft <= 5 ? 'var(--primary-red)' : '#00B341'
                      }}
                    >
                      {daysLeft} {daysLeft === 1 ? 'день' : daysLeft > 1 && daysLeft < 5 ? 'дня' : 'дней'}
                    </span>
                  </div>
                </div>
              );
            })}
            {data.premiums.length === 0 && (
              <div className="studio-field-subtext promo-empty-table-text">
                Платные подписки на платформе ещё не оформлены.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* МОДАЛЬНОЕ ОКНО ИЗМЕНЕНИЯ ЦЕНЫ (СИНХРОНИЗИРОВАНО С MODALS.CSS) */}
      {isPriceModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setIsPriceModalOpen(false)}>
          <div className="playlist-modal-content" onClick={e => e.stopPropagation()}>
            <div className="admin-header-flex promo-modal-header-margin">
              <h3 className="page-title promo-modal-title-size">
                Изменение тарифа
              </h3>
              <button 
                type="button" 
                className="close-btn promo-modal-close-size" 
                onClick={() => setIsPriceModalOpen(false)}
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleUpdatePrice} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="input-group">
                <input 
                  type="number" 
                  className="auth-input promo-modal-value-input"
                  value={tempPrice}
                  onChange={(e) => setTempPrice(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="modal-action-buttons promo-modal-actions-spacing">
                <button 
                  type="button" 
                  className="modal-btn-sub promo-modal-btn-fix" 
                  onClick={() => setIsPriceModalOpen(false)}
                >
                  Отмена
                </button>
                <button 
                  type="submit" 
                  className="modal-btn-main promo-modal-btn-fix-heavy"
                  disabled={loading || !tempPrice}
                >
                  {loading ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Monetization;