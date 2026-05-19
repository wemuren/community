import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../assets/styles/premium.css';

import { API_BASE_URL } from '@/config/api';

const Premium = () => {
  const [promo, setPromo] = useState('');
  const [status, setStatus] = useState('');
  const [subPrice, setSubPrice] = useState('900');
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  
  const [cardData, setCardData] = useState({ number: '', date: '', cvv: '' });
  const user = JSON.parse(localStorage.getItem('user'));

  // 1. Маска для номера карты (0000 0000 0000 0000)
  const handleCardNumberChange = (e) => {
    let val = e.target.value.replace(/\D/g, ''); // Только цифры
    if (val.length > 16) val = val.slice(0, 16);
    // Разбиваем по 4 цифры через пробел
    const formatted = val.match(/.{1,4}/g)?.join(' ') || '';
    setCardData({ ...cardData, number: formatted });
  };

  // 2. Маска для даты (MM/YY)
  const handleExpiryChange = (e) => {
    let val = e.target.value.replace(/\D/g, ''); // Только цифры
    if (val.length > 4) val = val.slice(0, 4);
    
    let formatted = val;
    if (val.length >= 3) {
      formatted = val.slice(0, 2) + '/' + val.slice(2);
    }
    setCardData({ ...cardData, date: formatted });
  };

  // 3. Обработка CVC (Только 3 цифры)
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
    
    if (!window.confirm(`Подтверждаете оплату ${subPrice} ₸?`)) return;

    try {
      const res = await axios.post(`${API_BASE_URL}/billing/process_payment.php`, {
        user_id: user.id,
        amount: subPrice
      });
      if (res.data.status === 'success') {
        alert("✨ Premium активирован!");
        const newUser = { ...user, is_paid: 1 };
        localStorage.setItem('user', JSON.stringify(newUser));
        window.location.reload();
      }
    } catch (e) { alert("Ошибка транзакции"); }
  };

  const handleApplyPromo = async () => {
  if (!promo.trim()) return setStatus('Введите код ⌨️');
  
  setStatus('Проверка...'); // Визуальный лоадер

  try {
    const res = await axios.post(`${API_BASE_URL}/billing/apply_promo.php`, {
      user_id: user.id,
      code: promo
    });

    if (res.data.status === 'success') {
      setStatus(`✨ ${res.data.message}`);
      setPromo(''); // Очищаем поле
      
      // Обновляем локальные данные (чтобы сразу появилась корона/премиум статус)
      const newUser = { ...user, is_paid: 1 };
      localStorage.setItem('user', JSON.stringify(newUser));
      
      // Уведомляем другие компоненты (например, Header) через событие
      window.dispatchEvent(new Event('storage'));
      
      // Через пару секунд обновляем страницу для верности
      setTimeout(() => window.location.reload(), 2000);
    }
  } catch (e) {
    // Берем сообщение об ошибке прямо с сервера
    const msg = e.response?.data?.message || 'Ошибка активации ❌';
    setStatus(msg);
  }
};

  return (
    <div className="premium-page-wrapper">
      <div className="premium-hero">
        <h1>COMMUNITY <span className="red-shine">PREMIUM</span></h1>
      </div>

      <div className="premium-grid">
        {/* Промокод */}
        <div className="premium-card glass-card">
          <h3>Активация кода</h3>
          <input 
            type="text" 
            className="premium-input"
            placeholder="COMM-XXXX-XXXX" 
            value={promo}
            onChange={(e) => setPromo(e.target.value.toUpperCase())}
          />
         <button className="premium-btn secondary" onClick={handleApplyPromo}>Активировать</button>
        </div>

        {/* Купить */}
        <div className="page-premium-card featured-card">
          <h3>Месячная подписка</h3>
          <div className="price-display">{subPrice}</div>
          <button className="premium-btn primary" onClick={() => setIsPayModalOpen(true)}>Купить</button>
        </div>
      </div>

      {isPayModalOpen && (
        <div className="pay-modal-overlay" onClick={() => setIsPayModalOpen(false)}>
          <div className="pay-modal-content" onClick={e => e.stopPropagation()}>
            <h2>Оплата подписки</h2>
            <form onSubmit={handlePayment} className="pay-form">
              <div className="input-group">
                <label>Номер карты</label>
                <input 
                  type="text"
                  placeholder="0000 0000 0000 0000"
                  className="premium-input-masked"
                  value={cardData.number}
                  onChange={handleCardNumberChange}
                  required
                />
              </div>

              <div className="row flex-row" style={{display: 'flex', gap: '15px'}}>
                <div className="input-group">
                  <label>ММ/ГГ</label>
                  <input 
                    type="text"
                    placeholder="12/26"
                    className="premium-input-masked"
                    value={cardData.date}
                    onChange={handleExpiryChange}
                    required
                  />
                </div>
                <div className="input-group">
                  <label>CVC</label>
                  <input 
                    type="password"
                    placeholder="***"
                    className="premium-input-masked"
                    value={cardData.cvv}
                    onChange={handleCvcChange}
                    required
                  />
                </div>
              </div>
              <button type="submit" className="pay-submit-btn">Оплатить {subPrice}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Premium;