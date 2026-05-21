import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Crown, Ticket, Trash, Plus, X, Copy, Check } from 'lucide-react';
import '../assets/styles/admin.css'; // Родная база админки
import '../assets/styles/auth.css'; // База инпутов и кнопок
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

  // Создание промокода с жесткой маской COMM-
  const handleCreatePromo = async (e) => {
    e.preventDefault();
    if (!promoText.trim()) return;
    
    const fullCode = `COMM-${promoText.trim().toUpperCase()}`;
    try {
      await axios.post(`${API_BASE_URL}/admin/manage_monetization.php`, {
        admin_id: authUser.id, 
        action: 'generate_promo',
        custom_code: fullCode // Передаем сформированный код на бэкенд
      });
      setPromoText('');
      fetchData();
    } catch (err) {
      console.error("Ошибка при генерации промокода:", err);
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
            <span className="admin-stat-label">Стоимость Premium</span>
            <Crown size={16} strokeWidth={2} className="admin-stat-icon-likes" />
          </div>
          <h2 className="admin-stat-value critical">{data.price} Т</h2>
          <span className="studio-field-subtext" style={{ color: 'var(--primary-red)', fontWeight: 500 }}>Изменить тариф платформы →</span>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card-header">
            <span className="admin-stat-label">Активные Premium подписки</span>
            <Crown size={16} strokeWidth={2} className="admin-stat-icon-subs" />
          </div>
          <h2 className="admin-stat-value">{data.premiums.length}</h2>
          <span className="studio-field-subtext">Пользователи с платным доступом</span>
        </div>
      </div>

      {/* ДВУХКОЛОНОЧНЫЙ БЛОК: ПРОМОКОДЫ И ТАБЛИЦА */}
      <div className="admin-split-view" style={{ display: 'flex', gap: '64px', marginTop: '40px' }}>
        
        {/* ЛЕВАЯ КОЛОНКА: МАРКЕТИНГ И ПРОМОКОДЫ */}
        <div style={{ flex: 1, maxWidth: '420px' }}>
          <h3 className="admin-tags-group-title" style={{ marginBottom: '20px', color: 'var(--text-main)', fontSiz: '16px', fontWeight: 700 }}>
            Выпуск промокодов
          </h3>
          
          {/* ФОРМА СОЗДАНИЯ С ЖЕСТКОЙ МАСКОЙ COMM- */}
          <form onSubmit={handleCreatePromo} className="admin-tag-inline-form" style={{ marginBottom: '32px' }}>
            <div className="input-group">
              <label style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                Новый промокод
              </label>
              <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(0, 0, 0, 0.32)', padding: '4px 0' }}>
                <span style={{ fontFamily: 'var(--font-main)', fontSize: '18px', fontWeight: 700, color: 'var(--text-main)', paddingLeft: '8px', userSelect: 'none' }}>
                  COMM-
                </span>
                <input 
                  type="text" 
                  placeholder="XMAS2026" 
                  value={promoText}
                  onChange={(e) => setPromoText(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())}
                  className="auth-input"
                  style={{ borderBottom: 'none !important', paddingLeft: '4px' }}
                  required
                />
              </div>
            </div>
            <button 
              type="submit" 
              className="tag-btn active" 
              disabled={!promoText.trim()} 
              style={{ height: '40px', padding: '0 16px' }}
            >
              <Plus size={14} strokeWidth={2.5} />
            </button>
          </form>

          {/* СПИСОК АКТИВНЫХ ПРОМОКОДОВ В ИНДАСТРИАЛ-ПИЛЛАХ */}
          <div className="admin-tags-pills-grid">
            {data.promos.map(p => (
              <div 
                key={p.id} 
                className="admin-tag-pill-item"
                style={{ width: '100%', justifyContent: 'space-between', padding: '10px 12px 10px 16px', cursor: 'pointer' }}
                onClick={(e) => copyToClipboard(e, p.code)}
                title="Кликните, чтобы скопировать"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Ticket size={16} className="stat-icon" style={{ opacity: 0.5 }} />
                  <code style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'monospace', letterSpacing: '0.5px' }}>
                    {p.code}
                  </code>
                  {copiedCode === p.code ? (
                    <span style={{ fontSize: '12px', color: '#00B341', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Check size={12} strokeWidth={3} /> Копи
                    </span>
                  ) : (
                    <Copy size={12} style={{ opacity: 0.3 }} />
                  )}
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span className="studio-field-subtext" style={{ fontSize: '12px', fontWeight: 600, background: 'rgba(0,0,0,0.05)', padding: '2px 8px', borderRadius: '4px' }}>
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
        <div style={{ flex: 1.5 }}>
          <h3 className="admin-tags-group-title" style={{ marginBottom: '24px', color: 'var(--text-main)', fontSize: '16px', fontWeight: 700 }}>
            Реестр Premium-клиентов
          </h3>
          
          <div className="admin-table">
            <div className="admin-table-header">
              <div className="admin-col" style={{ flex: 2 }}><span className="admin-stat-label">Пользователь</span></div>
              <div className="admin-col" style={{ flex: 1, justifyContent: 'center' }}><span className="admin-stat-label">Действует до</span></div>
              <div className="admin-col" style={{ flex: 1, justifyContent: 'flex-end' }}><span className="admin-stat-label">Статус</span></div>
            </div>

            {data.premiums.map(u => {
              const daysLeft = getDaysRemaining(u.premium_until);
              return (
                <div key={u.id} className="admin-table-row">
                  <div className="admin-col" style={{ flex: 2 }}>
                    <div className="admin-user-cell">
                      <UserAvatar user={u} sizeClass="avatar-mini" />
                      <div className="admin-user-text">
                        <strong className="admin-user-fullname">{u.full_name || u.username}</strong>
                        <span className="studio-field-subtext">@{u.username}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="admin-col" style={{ flex: 1, justifyContent: 'center', fontSize: '14px', fontWeight: 500 }}>
                    {formatDate(u.premium_until)}
                  </div>

                  <div className="admin-col" style={{ flex: 1, justifyContent: 'flex-end' }}>
                    <span 
                      className="tag-btn active" 
                      style={{ 
                        fontSize: '12px', 
                        padding: '4px 10px', 
                        borderRadius: '6px',
                        background: daysLeft <= 5 ? 'var(--primary-red)' : '#00B341',
                        pointerEvents: 'none'
                      }}
                    >
                      {daysLeft} {daysLeft === 1 ? 'день' : daysLeft > 1 && daysLeft < 5 ? 'дня' : 'дней'}
                    </span>
                  </div>
                </div>
              );
            })}
            {data.premiums.length === 0 && (
              <div style={{ padding: '24px', textAlign: 'center' }} className="studio-field-subtext">
                Платные подписки на платформе ещё не оформлены.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* МОДАЛЬНОЕ ОКНО ИЗМЕНЕНИЯ ЦЕНЫ (1:1 ПО СИСТЕМНОМУ ГАЙДЛАЙНУ) */}
      {isPriceModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setIsPriceModalOpen(false)}>
          <div className="admin-modal-container" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div className="admin-table-header" style={{ justifyContent: 'space-between', padding: '20px 24px' }}>
              <span className="admin-stat-label" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                Изменение тарифа
              </span>
              <button 
                type="button" 
                className="tag-pill-delete-action-btn" 
                onClick={() => setIsPriceModalOpen(false)}
                style={{ width: '28px', height: '28px', borderRadius: '50%' }}
              >
                <X size={14} strokeWidth={2.5} />
              </button>
            </div>
            
            <form onSubmit={handleUpdatePrice} className="admin-modal-scroll-content" style={{ padding: '24px', gap: '24px' }}>
              <div className="input-group">
                <label style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Стоимость подписки (KZT)
                </label>
                <input 
                  type="number" 
                  className="auth-input"
                  value={tempPrice}
                  onChange={(e) => setTempPrice(e.target.value)}
                  style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', textAlign: 'center', padding: '12px 0' }}
                  autoFocus
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '8px' }}>
                <button 
                  type="button" 
                  className="tag-btn" 
                  onClick={() => setIsPriceModalOpen(false)}
                  style={{ flex: 1, border: '1px solid rgba(0,0,0,0.12)', height: '44px', fontSize: '14px' }}
                >
                  Отмена
                </button>
                <button 
                  type="submit" 
                  className="btn-auth active"
                  disabled={loading || !tempPrice}
                  style={{ flex: 1.5, padding: 0, height: '44px', fontSize: '14px' }}
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