import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X } from 'lucide-react'; // Импортируем крестик для закрытия
import '../assets/styles/premium.css';

import { API_BASE_URL } from '@/config/api';

const Premium = () => {
  const [promo, setPromo] = useState('');
  const [status, setStatus] = useState('');
  const [subPrice, setSubPrice] = useState('900');
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  
  const [cardData, setCardData] = useState({ number: '', date: '', cvv: '' });
  const user = JSON.parse(localStorage.getItem('user'));

  const handleCardNumberChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 16) val = val.slice(0, 16);
    const formatted = val.match(/.{1,4}/g)?.join(' ') || '';
    setCardData({ ...cardData, number: formatted });
  };

  const handleExpiryChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 4) val = val.slice(0, 4);
    let formatted = val;
    if (val.length >= 3) {
      formatted = val.slice(0, 2) + '/' + val.slice(2);
    }
    setCardData({ ...cardData, date: formatted });
  };

  const handleCvcChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 3);
    setCardData({ ...cardData, cvv: val });
  };

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/billing/get_settings.php`);
        if (res.data.sub_price) setSubPrice(res.data.sub_price);
      } catch (e) { console.error(e); }
    };
    fetchPrice();
  }, []);

  const handlePayment = async (e) => {
    e.preventDefault();
    const cleanNumber = cardData.number.replace(/\s/g, '');
    if (cleanNumber.length < 16) return alert("Введите 16 цифр карты");
    if (cardData.date.length < 5) return alert("Введите дату в формате ММ/ГГ");
    
    if (!window.confirm(`Подтверждаете оплату ${subPrice} ед.?`)) return;

    try {
      const res = await axios.post(`${API_BASE_URL}/billing/process_payment.php`, {
        user_id: user.id,
        amount: subPrice
      });
      if (res.data.status === 'success') {
        alert("Премиум активирован!");
        const newUser = { ...user, is_paid: 1 };
        localStorage.setItem('user', JSON.stringify(newUser));
        window.location.reload();
      }
    } catch (e) { alert("Ошибка транзакции"); }
  };

  const handleApplyPromo = async () => {
    if (!promo.trim()) return setStatus('Введите код ⌨️');
    setStatus('Проверка...');

    try {
      const res = await axios.post(`${API_BASE_URL}/billing/apply_promo.php`, {
        user_id: user.id,
        code: promo
      });

      if (res.data.status === 'success') {
        setStatus(` ${res.data.message}`);
        setPromo('');
        const newUser = { ...user, is_paid: 1 };
        localStorage.setItem('user', JSON.stringify(newUser));
        window.dispatchEvent(new Event('storage'));
        setTimeout(() => window.location.reload(), 2000);
      }
    } catch (e) {
      const msg = e.response?.data?.message || 'Ошибка активации ❌';
      setStatus(msg);
    }
  };

  return (
    <div className="premium-page-wrapper">
      <div className="premium-hero">
        <h1>КОМЬЮНИТИ <span className="red-shine">ПРЕМИУМ</span></h1>
      </div>

      <div className="premium-grid">
        {/* Карточка Промокода */}
        <div className="premium-card-bento promo-card">
          <h3>Активация кода</h3>
          <div className="premium-input-container">
            <input 
              type="text" 
              className="edit-input-field"
              placeholder="COMM-XXXX-XXXX" 
              value={promo}
              onChange={(e) => setPromo(e.target.value.toUpperCase())}
            />
          </div>
          <button className="premium-btn-sub" onClick={handleApplyPromo}>Активировать</button>
          {status && <p className="premium-status-text">{status}</p>}
        </div>

        {/* Карточка Подписки */}
        <div className="premium-card-bento featured-card">
          <h3>Оформить подписку</h3>
          <div className="price-display">{subPrice}<span className="currency-icon"></span><span> / мес</span></div>
          <button className="premium-btn-main" onClick={() => setIsPayModalOpen(true)}>Купить подписку</button>
        </div>
      </div>

      {/* МОДАЛКА ОПЛАТЫ КАРТОЙ */}
      {isPayModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setIsPayModalOpen(false)}>
          <div className="playlist-modal-content" onClick={e => e.stopPropagation()}>
            <div className="admin-header-flex" style={{ marginBottom: '24px' }}>
              <h3 className="page-title" style={{ fontSize: '20px' }}>Оплата подписки</h3>
              <button className="close-btn" onClick={() => setIsPayModalOpen(false)} style={{ fontSize: '24px' }}>
                <X size={20} strokeWidth={2} />
              </button>
            </div>

            <form onSubmit={handlePayment} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="input-group">
                <label className="premium-label">Номер карты</label>
                <input 
                  type="text"
                  placeholder="0000 0000 0000 0000"
                  className="edit-input-field premium-masked-font"
                  value={cardData.number}
                  onChange={handleCardNumberChange}
                  required
                />
              </div>

              <div className="modal-action-buttons" style={{ alignItems: 'flex-start' }}>
                <div className="input-group" style={{ flex: 1, width: '50%' }}>
                  <label className="premium-label">ММ/ГГ</label>
                  <input 
                    type="text"
                    placeholder="12/26"
                    className="edit-input-field premium-masked-font"
                    value={cardData.date}
                    onChange={handleExpiryChange}
                    required
                  />
                </div>
                <div className="input-group" style={{ flex: 1, width: '50%' }}>
                  <label className="premium-label">CVC</label>
                  <input 
                    type="password"
                    placeholder="***"
                    className="edit-input-field premium-masked-font cvc-stars"
                    value={cardData.cvv}
                    onChange={handleCvcChange}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="modal-btn-main" >
                Оплатить {subPrice}<span className="currency-icon"></span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Premium;