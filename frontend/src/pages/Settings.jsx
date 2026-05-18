import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../assets/styles/user.css';
import '../assets/styles/auth.css';

const API_BASE_URL = 'http://localhost/projects/community/api';

const normalize = (str) => (str || '').trim().toLowerCase();

const Settings = () => {
  const [authUser, setAuthUser] = useState(() => {
    const data = localStorage.getItem('user');
    return data ? JSON.parse(data) : null;
  });
  const navigate = useNavigate();


  // ── ПАРОЛЬ ──────────────────────────────────────────────
  const [passData, setPassData] = useState({ old: '', new: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [passTouched, setPassTouched] = useState({});
  const [passErrors, setPassErrors] = useState({});
  const [passSuccess, setPassSuccess] = useState('');
  const [passServerError, setPassServerError] = useState('');

  // ── EMAIL ────────────────────────────────────────────────
  const [emailStep, setEmailStep] = useState(1);
  const [emailData, setEmailData] = useState({ current: '', code: '', next: '' });
  const [emailTouched, setEmailTouched] = useState({});
  const [emailErrors, setEmailErrors] = useState({});
  const [emailSuccess, setEmailSuccess] = useState('');
  const [emailServerError, setEmailServerError] = useState('');
  const [timer, setTimer] = useState(0);

  const limits = { password: 32, email: 50, code: 6 };

  // Таймер для кода
  useEffect(() => {
    let interval;
    if (timer > 0) interval = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // Синхронизация authUser из localStorage
  useEffect(() => {
    const data = localStorage.getItem('user');
    if (data) {
      setAuthUser(JSON.parse(data));
    }
  }, []);

  // ── ВАЛИДАЦИЯ ПАРОЛЯ ─────────────────────────────────────
  const validatePass = (name, value, all) => {
    let err = '';
    if (name === 'new' && value.length > 0 && value.length < 6) err = 'Минимум 6 символов';
    if (name === 'confirm' && value !== all.new) err = 'Пароли не совпадают';
    setPassErrors(prev => ({ ...prev, [name]: err }));
  };

  const handlePassInput = (e) => {
    const { name, value } = e.target;
    if (value.length > limits.password) return;
    const newData = { ...passData, [name]: value };
    setPassData(newData);
    validatePass(name, value, newData);
    setPassServerError('');
    setPassSuccess('');
  };

  const isPassFormValid = () =>
    passData.old &&
    passData.new &&
    passData.confirm &&
    passData.new.length >= 6 &&
    passData.new === passData.confirm;

  const onUpdatePassword = async (e) => {
    e.preventDefault();
    setPassServerError('');
    setPassSuccess('');
    if (!isPassFormValid()) return;
    try {
      await axios.post(`${API_BASE_URL}/user/change_password.php`, {
        user_id: authUser.id,
        old_password: passData.old,
        new_password: passData.new,
      });
      setPassSuccess('Пароль успешно изменён!');
      setPassData({ old: '', new: '', confirm: '' });
      setPassTouched({});
      setPassErrors({});
    } catch (err) {
      setPassServerError(err.response?.data?.message || 'Ошибка сервера');
    }
  };

  // ── ВАЛИДАЦИЯ ПОЧТЫ ──────────────────────────────────────
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validateEmail = (name, value) => {
    let err = '';
    const val = normalize(value);
    const current = normalize(authUser?.email);

    if (name === 'current') {
      if (!emailRegex.test(value)) err = 'Некорректный формат почты';
      else if (val !== current) err = 'Не совпадает с текущим адресом';
    }

    if (name === 'next') {
      if (!emailRegex.test(value)) err = 'Некорректный формат почты';
      else if (val === current) err = 'Это ваша текущая почта';
    }

    setEmailErrors(prev => ({ ...prev, [name]: err }));
    return err;
  };

  const handleEmailInput = (e) => {
    const { name, value } = e.target;
    if ((name === 'current' || name === 'next') && value.length > limits.email) return;
    if (name === 'code' && value.length > limits.code) return;
    setEmailData(prev => ({ ...prev, [name]: value }));
    if (name !== 'code') validateEmail(name, value);
    setEmailServerError('');
    setEmailSuccess('');
  };

  // ── ХЕНДЛЕРЫ ПОЧТЫ ──────────────────────────────────────
  const onRequestCode = async (e) => {
    e?.preventDefault();
    setEmailServerError('');
    const err = validateEmail('current', emailData.current);
    if (err || !emailData.current) return;
    const normalizedEmail = normalize(emailData.current);
    try {
      const res = await axios.post(`${API_BASE_URL}/user/email_change_request.php`, {
        user_id: authUser.id,
        current_email: normalizedEmail,
      });
      if (res.data.status === 'success') {
        setEmailStep(2);
        setTimer(59);
        if (res.data.code_for_test) console.log('Код для теста:', res.data.code_for_test);
      }
    } catch (err) {
      setEmailServerError(err.response?.data?.message || 'Ошибка сервера');
    }
  };

  const onVerifyCode = async (e) => {
    e.preventDefault();
    setEmailServerError('');
    try {
      const res = await axios.post(`${API_BASE_URL}/user/verify_settings_code.php`, {
        email: normalize(emailData.current),
        code: emailData.code.trim(),
      });
      if (res.data.status === 'success') {
        setEmailStep(3);
      }
    } catch (err) {
      setEmailServerError('Неверный код или истекло время ожидания');
    }
  };

  const onUpdateEmail = async (e) => {
    e.preventDefault();
    setEmailServerError('');
    setEmailSuccess('');
    const err = validateEmail('next', emailData.next);
    if (err || !emailData.next) return;
    console.log('Отправляю на сервер:', {
      user_id: authUser.id,
      new_email: normalize(emailData.next),
    });
    console.log('authUser целиком:', authUser);
    try {
      const res = await axios.post(`${API_BASE_URL}/user/email_change_confirm.php`, {
        user_id: authUser.id,
        new_email: normalize(emailData.next),
      });
      if (res.data.status === 'success') {
        const updated = { ...authUser, email: normalize(emailData.next) };
        localStorage.setItem('user', JSON.stringify(updated));
        setAuthUser(updated);
        setEmailStep(1);
        setEmailData({ current: '', code: '', next: '' });
        setEmailTouched({});
        setEmailErrors({});
        setEmailSuccess('Почта успешно обновлена!');
      }
    } catch (err) {
      setEmailServerError(err.response?.data?.message || 'Ошибка сервера');
    }
  };

  const resetEmailFlow = () => {
    setEmailStep(1);
    setEmailData({ current: '', code: '', next: '' });
    setEmailTouched({});
    setEmailErrors({});
    setEmailServerError('');
    setEmailSuccess('');
    setTimer(0);
  };

  const handleDeleteChannel = async () => {
    if (window.confirm("Вы уверены? Это скроет ваш канал, но сам аккаунт останется. Видео и плейлисты могут стать недоступны.")) {
      try {
        const res = await axios.post(`${API_BASE_URL}/user/delete_channel.php`, {
          user_id: authUser.id
        });

        if (res.data.status === 'success') {
          // Обновляем локальные данные юзера
          const updatedUser = { ...authUser, channel_created: 0 };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          alert("Канал успешно удален. Вы всё еще можете смотреть видео других авторов.");
          // Перенаправляем в профиль, чтобы увидеть изменения
          navigate(`/profile/${authUser.id}`);
        }
      } catch (err) {
        console.error("Ошибка при удалении канала:", err);
        alert("Не удалось удалить канал.");
      }
    }
  };



  const handleDeleteAccount = async () => {
    if (window.confirm("Вы уверены? Это удалит все ваши видео и плейлисты навсегда!")) {
      try {
        // 1. Сначала стучимся в базу
        const res = await axios.post(`${API_BASE_URL}/user/delete_account.php`, {
          user_id: authUser.id
        });

        if (res.data.status === 'success') {
          // 2. Если база подтвердила — чистим фронт
          localStorage.clear();
          alert("Прощай, ковбой! Аккаунт удален.");
          navigate('/register'); // Или на лендинг
        }
      } catch (err) {
        console.error("Не удалось удалить аккаунт:", err);
        alert("Ошибка сервера при удалении.");
      }
    }
  };

  if (!authUser) return null;

  return (
    <div className="auth-container settings-page-v2">
      <div className="settings-header">
        <button onClick={() => navigate(-1)} className="btn-back">← Назад</button>
        <h2 className="user-name">Настройки аккаунта</h2>
      </div>

      <div className="auth-card" style={{ width: '100%', maxWidth: '500px', marginTop: '20px' }}>

        <section className='row'>
          {/* ── СЕКЦИЯ ПАРОЛЯ ── */}
          <section className="settings-form-block">
            <h3>БЕЗОПАСНОСТЬ</h3>
            <form onSubmit={onUpdatePassword} noValidate>
              {[
                { field: 'old', label: 'СТАРЫЙ ПАРОЛЬ' },
                { field: 'new', label: 'НОВЫЙ ПАРОЛЬ' },
                { field: 'confirm', label: 'ПОВТОР НОВОГО' },
              ].map(({ field, label }) => (
                <div className="input-group password-group" key={field}>
                  <label>{label}</label>
                  <input
                    type={showPass ? 'text' : 'password'}
                    name={field}
                    className={`auth-input ${passErrors[field] && passTouched[field] ? 'invalid' : ''}`}
                    value={passData[field]}
                    onChange={handlePassInput}
                    onBlur={() => setPassTouched(p => ({ ...p, [field]: true }))}
                    autoComplete={field === 'old' ? 'current-password' : 'new-password'}
                  />
                  {field === 'old' && (
                    <span
                      className="eye-icon"
                      onClick={() => setShowPass(s => !s)}
                      style={{ cursor: 'pointer' }}
                    >
                      {showPass ? '👁️' : '🙈'}
                    </span>
                  )}
                  {passErrors[field] && passTouched[field] && (
                    <span className="error-label">{passErrors[field]}</span>
                  )}
                </div>
              ))}
              {passServerError && <div className="error-message">{passServerError}</div>}
              {passSuccess && <div className="success-message">{passSuccess}</div>}
              <button
                type="submit"
                className={`btn-auth ${isPassFormValid() ? 'active' : ''}`}
                disabled={!isPassFormValid()}
              >
                обновить пароль
              </button>
            </form>
          </section>

          {/* ── СЕКЦИЯ ПОЧТЫ ── */}
          <section className="settings-form-block">
            <h3>EMAIL АДРЕС</h3>
            <p style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '12px' }}>
              Текущий: <strong>{authUser.email}</strong>
            </p>

            {/* Шаг 1 — подтвердить текущую почту */}
            {emailStep === 1 && (

              <form onSubmit={onRequestCode} noValidate>
                <div className="input-group">
                  <label>ПОДТВЕРДИТЕ ТЕКУЩИЙ EMAIL</label>
                  <input
                    type="email"
                    name="current"
                    className={`auth-input ${emailErrors.current && emailTouched.current ? 'invalid' : ''}`}
                    value={emailData.current}
                    onChange={handleEmailInput}
                    onBlur={() => {
                      setEmailTouched(p => ({ ...p, current: true }));
                      validateEmail('current', emailData.current);
                    }}
                    placeholder={authUser.email}
                    autoComplete="email"
                  />
                  {emailErrors.current && emailTouched.current && (
                    <span className="error-label">{emailErrors.current}</span>
                  )}
                </div>
                {emailServerError && <div className="error-message">{emailServerError}</div>}
                {emailSuccess && <div className="success-message">{emailSuccess}</div>}
                <button
                  type="submit"
                  className={`btn-auth ${!emailErrors.current && emailData.current ? 'active' : ''}`}
                  disabled={!!emailErrors.current || !emailData.current}
                >
                  получить код
                </button>
              </form>
            )}

            {/* Шаг 2 — ввести код */}
            {emailStep === 2 && (
              <form onSubmit={onVerifyCode} noValidate>
                <div className="input-group">
                  <label>КОД ИЗ ПИСЬМА (на {emailData.current})</label>
                  <input
                    type="text"
                    name="code"
                    className="auth-input"
                    value={emailData.code}
                    onChange={handleEmailInput}
                    maxLength={6}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                  />
                  <div className="code-info">
                    {timer > 0 ? (
                      <span className="timer-text">Повтор через {timer}с</span>
                    ) : (
                      <button type="button" className="resend-link" onClick={onRequestCode}>
                        Переотправить
                      </button>
                    )}
                  </div>
                </div>
                {emailServerError && <div className="error-message">{emailServerError}</div>}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn-auth"
                    onClick={resetEmailFlow}
                    style={{ flex: '0 0 auto', opacity: 0.6 }}
                  >
                    ←
                  </button>
                  <button
                    type="submit"
                    className={`btn-auth ${emailData.code.length === 6 ? 'active' : ''}`}
                    disabled={emailData.code.length !== 6}
                    style={{ flex: 1 }}
                  >
                    подтвердить код
                  </button>
                </div>
              </form>
            )}

            {/* Шаг 3 — ввести новую почту */}
            {emailStep === 3 && (
              <form onSubmit={onUpdateEmail} noValidate>
                <div className="input-group">
                  <label>ВВЕДИТЕ НОВЫЙ EMAIL</label>
                  <input
                    type="email"
                    name="next"
                    className={`auth-input ${emailErrors.next && emailTouched.next ? 'invalid' : ''}`}
                    value={emailData.next}
                    onChange={handleEmailInput}
                    onBlur={() => {
                      setEmailTouched(p => ({ ...p, next: true }));
                      validateEmail('next', emailData.next);
                    }}
                    autoComplete="email"
                  />
                  {emailErrors.next && emailTouched.next && (
                    <span className="error-label">{emailErrors.next}</span>
                  )}
                </div>
                {emailServerError && <div className="error-message">{emailServerError}</div>}
                {emailSuccess && <div className="success-message">{emailSuccess}</div>}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn-auth"
                    onClick={resetEmailFlow}
                    style={{ flex: '0 0 auto', opacity: 0.6 }}
                  >
                    ←
                  </button>
                  <button
                    type="submit"
                    className={`btn-auth ${emailData.next && !emailErrors.next ? 'active' : ''}`}
                    disabled={!emailData.next || !!emailErrors.next}
                    style={{ flex: 1 }}
                  >
                    сохранить почту
                  </button>
                </div>
              </form>
            )}
          </section>
        </section>

        {/* СЕКЦИЯ: УПРАВЛЕНИЕ КАНАЛОМ (показываем, только если канал есть) */}
        {authUser.channel_created == 1 && (
          <section className="settings-section" style={{ padding: '20px', border: '1px solid #eee', borderRadius: '16px' }}>
            <h3>Настройки канала</h3>
            <p style={{ fontSize: '14px', color: 'gray' }}>Вы можете удалить свой канал. Ваши подписки и профиль сохранятся.</p>
            <button
              className="btn-cancel"
              style={{ width: 'auto', padding: '10px 20px', background: '#f5f5f5', color: '#333', border: '1px solid #ddd' }}
              onClick={handleDeleteChannel}
            >
              Удалить мой канал
            </button>
          </section>
        )}

        {/* СЕКЦИЯ: ОПАСНАЯ ЗОНА */}
        <section className="settings-section" style={{ marginTop: '20px', padding: '20px', border: '1px solid #ffebeb', borderRadius: '16px' }}>
          <h3 style={{ color: '#C20000' }}>Опасная зона</h3>
          <p style={{ fontSize: '14px', color: 'gray' }}>Удаление аккаунта приведет к безвозвратной потере всех данных.</p>
          <button className="action-btn delete" style={{ width: 'auto', padding: '10px 20px' }} onClick={handleDeleteAccount}>
            Удалить мой аккаунт
          </button>
        </section>
      </div>
    </div>
  );
};

export default Settings;
