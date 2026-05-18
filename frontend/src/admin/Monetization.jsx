import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../assets/styles/admin.css';
import UserAvatar from '../components/UserAvatar';

const API_BASE_URL = 'http://localhost/projects/community/api';

const Monetization = () => {
  const [data, setData] = useState({ promos: [], premiums: [], price: '0' });
  const [copiedCode, setCopiedCode] = useState(null);

  const [selectedUser, setSelectedUser] = useState(null);
  const [userVideos, setUserVideos] = useState([]);
  const [userPlaylists, setUserPlaylists] = useState([]);
  
  // Состояния для модалки цены
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [tempPrice, setTempPrice] = useState('');

  const authUser = JSON.parse(localStorage.getItem('user')) || {};

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/manage_monetization.php?admin_id=${authUser.id}`);
      setData(res.data);
      setTempPrice(res.data.price); // Синхронизируем цену для ввода
    } catch (err) { console.error(err); }
  };

  const handleUpdatePrice = async () => {
    try {
      await axios.post(`${API_BASE_URL}/admin/manage_monetization.php`, {
        admin_id: authUser.id,
        action: 'update_price',
        new_price: tempPrice
      });
      setIsPriceModalOpen(false);
      fetchData();
    } catch (err) { alert("Ошибка при смене цены"); }
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const generatePromo = async () => {
    await axios.post(`${API_BASE_URL}/admin/manage_monetization.php`, {
      admin_id: authUser.id, action: 'generate_promo'
    });
    fetchData();
  };

  useEffect(() => { fetchData(); }, []);

  const getDaysRemaining = (dateString) => {
  if (!dateString) return 0;
  const now = new Date();
  const end = new Date(dateString);
  const diffTime = end - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  return diffDays > 0 ? diffDays : 0;
};

useEffect(() => {
    if (selectedUser) {
      const fetchUserData = async () => {
        try {
          const vidRes = await axios.get(`${API_BASE_URL}/video/get_user_videos.php?user_id=${selectedUser.id}`);
          setUserVideos(Array.isArray(vidRes.data) ? vidRes.data : []);

          const plRes = await axios.get(`${API_BASE_URL}/playlist/get_user_playlists.php?user_id=${selectedUser.id}&viewer_id=0`);
          const publicOnly = Array.isArray(plRes.data) 
            ? plRes.data.filter(p => p.type === 'custom' && p.is_private == 0) 
            : [];
          setUserPlaylists(publicOnly);
        } catch (err) { console.error(err); }
      };
      fetchUserData();
    }
  }, [selectedUser]);

// Функция для красивой даты (ДД.ММ.ГГГГ)
const formatDate = (dateString) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('ru-RU');
};

  return (
    <div>
      <h2 className="page-title">Монетизация и тарифы</h2>
      
      <div className="stats-grid">
        {/* Клик теперь просто открывает нашу модалку */}
        <div className="stat-card clickable" onClick={() => setIsPriceModalOpen(true)}>
          <div className="stat-label">Цена подписки</div>
          <div className="stat-value" style={{color: 'var(--brand-red)'}}>{data.price}</div>
          <div className="card-link">Изменить тариф</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Premium-пользователей</div>
          <div className="stat-value">{data.premiums.length}</div>
        </div>
      </div>

      <div className="admin-split-view" style={{display: 'flex', gap: '40px', marginTop: '40px'}}>
        <div style={{flex: 1}}>
          <h3 className="section-subtitle">Промокоды (Активные)</h3>
          <button className="btn-create" onClick={generatePromo} style={{marginBottom: '20px'}}>+ Создать код</button>
          
          <div className="promo-list">
            {data.promos.map(p => (
              <div 
                key={p.id} 
                className={`admin-tag-pill promo-item-box ${copiedCode === p.code ? 'copied' : ''}`}
                onClick={() => copyToClipboard(p.code)}
              >
                <div className="promo-code-wrapper">
                  <code>{p.code}</code>
                  {copiedCode === p.code && <span className="copy-badge">Скопировано!</span>}
                </div>
                <span className="sub-text">30 ДНЕЙ</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{flex: 1.5}}>
          <h3 className="section-subtitle">Премиум-пользователи</h3>
          <div className="table monetization-table">
  <div className="table-header">
    <div>Пользователь</div>
    <div style={{textAlign: 'center'}}>Действует до</div>
    <div style={{textAlign: 'right'}}>Осталось</div>
  </div>

  {data.premiums.map(u => {
  const daysLeft = getDaysRemaining(u.premium_until);
  return (
    <div key={u.id} className="table-row">
      <div className="user-info-cell">
        {/* Передаем user={u} и меняем selectedUser на u */}
        <UserAvatar 
          user={u} 
          sizeClass={`avatar-mini ${u.is_paid == 1 ? 'premium' : ''}`} 
        />
        <div>
          <strong>{u.full_name || u.username}</strong>
          <div className="sub-text">@{u.username}</div>
        </div>
      </div>
        
        <div className="date-display" style={{textAlign: 'center'}}>
          {formatDate(u.premium_until)}
        </div>

        <div style={{textAlign: 'right'}}>
          <span className={`badge ${daysLeft <= 5 ? 'premium' : ''}`}>
            {daysLeft} дн.
          </span>
        </div>
      </div>
    );
  })}
</div>
        </div>
      </div>

      {/* МОДАЛКА РЕДАКТИРОВАНИЯ ЦЕНЫ */}
      {isPriceModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setIsPriceModalOpen(false)}>
          <div className="admin-user-card small-modal" onClick={e => e.stopPropagation()}>
            <div className="card-header">
              <h3>Изменение тарифа</h3>
              <button className="close-btn" onClick={() => setIsPriceModalOpen(false)}>&times;</button>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label>Стоимость подписки</label>
                <input 
                  type="number" 
                  className="admin-search-input price-input-large"
                  value={tempPrice}
                  onChange={(e) => setTempPrice(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="quick-actions-bar" style={{marginTop: '24px'}}>
                <button className="btn-action danger" onClick={() => setIsPriceModalOpen(false)}>Отмена</button>
                <button className="btn-create" style={{flex: 1}} onClick={handleUpdatePrice}>Сохранить</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Monetization;