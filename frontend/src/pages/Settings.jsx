import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Eye, EyeOff, ChevronLeft } from 'lucide-react';
import '../assets/styles/settings.css';
import '../assets/styles/auth.css';

import { API_BASE_URL } from '@/config/api';

const normalize = (str) => (str || '').trim().toLowerCase();

const Settings = () => {
  const [authUser, setAuthUser] = useState(() => {
    const data = localStorage.getItem('user');
    return data ? JSON.parse(data) : null;
  });
  const navigate = useNavigate();

  // ── ТАБЫ (РАЗДЕЛЕНИЕ НА БЛОКИ) ──────────────────────────
  const [activeTab, setActiveTab] = useState('security'); // По умолчанию активна "Безопасность"

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

  const limits = { password: 32, email: 50 };

  useEffect(() => {
    if (timer > 0) {
      const t = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [timer]);

  if (!authUser) {
    return (
      <div className="settings-white-wrapper">
        <p className="error-label">Пожалуйста, войдите в аккаунт.</p>
      </div>
    );
  }

  // Обработчики валидации
  const validatePass = (field, val, all) => {
    if (!val) return 'Обязательное поле';
    if (val.length > limits.password) return `Максимум ${limits.password} символов`;
    if (field === 'confirm' && val !== all.new) return 'Пароли не совпадают';
    return '';
  };

  const handlePassChange = (e) => {
    const { name, value } = e.target;
    if (value.length > limits.password) return;
    const next = { ...passData, [name]: value };
    setPassData(next);
    if (passTouched[name]) {
      setPassErrors(prev => ({ ...prev, [name]: validatePass(name, value, next) }));
    }
  };

  const handlePassBlur = (e) => {
    const { name, value } = e.target;
    setPassTouched(prev => ({ ...prev, [name]: true }));
    setPassErrors(prev => ({ ...prev, [name]: validatePass(name, value, passData) }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPassServerError(''); setPassSuccess('');
    const fields = ['old', 'new', 'confirm'];
    const nextTouched = {}; const nextErrors = {};
    let hasErr = false;

    fields.forEach(f => {
      nextTouched[f] = true;
      const err = validatePass(f, passData[f], passData);
      nextErrors[f] = err;
      if (err) hasErr = true;
    });

    setPassTouched(nextTouched); setPassErrors(nextErrors);
    if (hasErr) return;

    try {
      const res = await axios.post(`${API_BASE_URL}/user/change_password.php`, {
        user_id: authUser.id,
        old_password: passData.old,
        new_password: passData.new
      });
      if (res.data.success) {
        setPassSuccess('Пароль успешно изменен');
        setPassData({ old: '', new: '', confirm: '' });
        setPassTouched({});
      } else {
        setPassServerError(res.data.message || 'Ошибка сервера');
      }
    } catch {
      setPassServerError('Проверьте корректность введенного пароля или подключение к интернету');
    }
  };

  const validateEmail = (field, val) => {
    if (!val) return 'Обязательное поле';
    if (val.length > limits.email) return `Максимум ${limits.email} символов`;
    if (field === 'current' && normalize(val) !== normalize(authUser.email)) {
      return 'Не совпадает с текущим email';
    }
    if (field === 'next') {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!re.test(val)) return 'Некорректный формат email';
      if (normalize(val) === normalize(authUser.email)) return 'Новый email совпадает с текущим';
    }
    return '';
  };

  const handleEmailChange = (e) => {
    const { name, value } = e.target;
    if (value.length > limits.email) return;
    setEmailData(prev => ({ ...prev, [name]: value }));
    if (emailTouched[name]) {
      setEmailErrors(prev => ({ ...prev, [name]: validateEmail(name, value) }));
    }
  };

  const handleEmailBlur = (e) => {
    const { name, value } = e.target;
    setEmailTouched(prev => ({ ...prev, [name]: true }));
    setEmailErrors(prev => ({ ...prev, [name]: validateEmail(name, value) }));
  };

  const handleEmailStep1 = async (e) => {
    e.preventDefault();
    setEmailServerError(''); setEmailSuccess('');
    setEmailTouched(p => ({ ...p, current: true }));
    const err = validateEmail('current', emailData.current);
    setEmailErrors(p => ({ ...p, current: err }));
    if (err) return;

    try {
      const res = await axios.post(`${API_BASE_URL}/user/email_change_request.php`, {
        user_id: authUser.id,
        current_email: normalize(emailData.current)
      });
      if (res.data.success) {
        setEmailStep(2); setTimer(60);
      } else {
        setEmailServerError(res.data.message || 'Ошибка отправки кода');
      }
    } catch { setEmailServerError('Ошибка сети или сервера'); }
  };

  const handleEmailStep2 = async (e) => {
    e.preventDefault();
    setEmailServerError('');
    if (!emailData.code) {
      setEmailErrors(p => ({ ...p, code: 'Введите код' })); return;
    }
    try {
      const res = await axios.post(`${API_BASE_URL}/user/verify_settings_code.php`, {
        email: normalize(emailData.current),
        code: emailData.code
      });
      if (res.data.success) { setEmailStep(3); } else { setEmailServerError(res.data.message || 'Неверный код'); }
    } catch { setEmailServerError('Ошибка проверки кода'); }
  };

  const handleEmailStep3 = async (e) => {
    e.preventDefault();
    setEmailServerError('');
    setEmailTouched(p => ({ ...p, next: true }));
    const err = validateEmail('next', emailData.next);
    setEmailErrors(p => ({ ...p, next: err }));
    if (err) return;

    try {
      const res = await axios.post(`${API_BASE_URL}/user/email_change_confirm.php`, {
        user_id: authUser.id,
        new_email: normalize(emailData.next)
      });
      if (res.data.success) {
        const updated = { ...authUser, email: normalize(emailData.next) };
        localStorage.setItem('user', JSON.stringify(updated));
        setAuthUser(updated);
        setEmailSuccess('Email успешно изменен');
        setEmailStep(1); setEmailData({ current: '', code: '', next: '' }); setEmailTouched({});
      } else {
        setEmailServerError(res.data.message || 'Этот email уже занят');
      }
    } catch { setEmailServerError('Ошибка сохранения новой почты'); }
  };

  const resendCode = async () => {
    if (timer > 0) return;
    setEmailServerError('');
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/change_email_step1.php`, { user_id: authUser.id });
      if (res.data.success) { setTimer(60); } else { setEmailServerError(res.data.message || 'Ошибка переотправки'); }
    } catch { setEmailServerError('Ошибка сети'); }
  };

  const handleDeleteChannel = async () => {
    if (!window.confirm('Вы уверены, что хотите удалить свой канал? Это действие сотрет все видео и плейлисты.')) return;
    try {
      const res = await axios.post(`${API_BASE_URL}/user/delete_channel.php`, { user_id: authUser.id });
      if (res.data.success) {
        const nextUser = { ...authUser, channel_created: 0, channel_id: null };
        localStorage.setItem('user', JSON.stringify(nextUser));
        setAuthUser(nextUser);
        alert('Канал успешно удален.');
        setActiveTab('security'); // Возвращаем на безопасность после удаления канала
      } else { alert(res.data.message || 'Ошибка удаления канала'); }
    } catch { alert('Ошибка при выполнении запроса'); }
  };

  const handleAccountDelete = async () => {
    if (!window.confirm('ВНИМАНИЕ! Вы полностью удаляете свой профиль с платформы. Это действие необратимо. Продолжить?')) return;
    try {
      const res = await axios.post(`${API_BASE_URL}/user/delete_account.php`, { user_id: authUser.id });
      if (res.data.success) {
        localStorage.clear(); alert('Ваш аккаунт был успешно удален.'); navigate('/login');
      } else { alert(res.data.message || 'Ошибка при удалении аккаунта'); }
    } catch { alert('Ошибка соединения с сервером'); }
  };

  const isPassFormValid = passData.old && passData.new && passData.confirm && !passErrors.old && !passErrors.new && !passErrors.confirm;

  return (
    <div className="settings-white-wrapper">
      {/* КНОПКА ВОЗВРАТА НАЗАД */}
      <div className="settings-back-action" onClick={() => navigate(-1)}>
        <ChevronLeft size={16} strokeWidth={2} /> Назад
      </div>

      <div className="pl-top-bar"><h2>Настройки учетной записи</h2></div>

      {/* НАВИГАЦИЯ ПО ТАБАМ (КАК В ПРОФИЛЕ) */}
      <nav className="channel-navigation" style={{ marginBottom: '32px' }}>
        <span
          className={`nav-tab ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          БЕЗОПАСНОСТЬ
        </span>
        <span
          className={`nav-tab ${activeTab === 'email' ? 'active' : ''}`}
          onClick={() => setActiveTab('email')}
        >
          СМЕНА ПОЧТОВОГО АДРЕСА
        </span>
        <span
          className={`nav-tab ${activeTab === 'channel' ? 'active' : ''}`}
          onClick={() => setActiveTab('channel')}
        >
          УПРАВЛЕНИЕ КАНАЛОМ
        </span>
      </nav>

      {/* КОНТЕНТ АКТИВНОГО ТАБА */}
<div className="settings-columns-grid">
  
  {/* ТАБ 1: БЕЗОПАСНОСТЬ */}
  {activeTab === 'security' && (
    <section className="settings-col-section">
      <form onSubmit={handlePasswordSubmit} className="auth-body" noValidate>
        
        <div className="input-group password-group">
          <label>Текущий пароль</label>
          <input
            type={showPass ? 'text' : 'password'}
            name="old"
            className={`auth-input ${passTouched.old && passErrors.old ? 'invalid' : ''}`}
            value={passData.old}
            onChange={handlePassChange}
            onBlur={handlePassBlur}
          />
          <span className="char-counter">{passData.old.length}/{limits.password}</span>
          <span className="eye-icon" onClick={() => setShowPass(!showPass)}>
            {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
          </span>
          {passTouched.old && passErrors.old && <span className="error-label">{passErrors.old}</span>}
        </div>

        <div className="input-group password-group">
          <label>Новый пароль</label>
          <input
            type={showPass ? 'text' : 'password'}
            name="new"
            className={`auth-input ${passTouched.new && passErrors.new ? 'invalid' : ''}`}
            value={passData.new}
            onChange={handlePassChange}
            onBlur={handlePassBlur}
          />
          <span className="char-counter">{passData.new.length}/{limits.password}</span>
          {passTouched.new && passErrors.new && <span className="error-label">{passErrors.new}</span>}
          <span className="eye-icon" onClick={() => setShowPass(!showPass)}>
            {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
          </span>
        </div>

        <div className="input-group password-group">
          <label>Подтвердите пароль</label>
          <input
            type={showPass ? 'text' : 'password'}
            name="confirm"
            className={`auth-input ${passTouched.confirm && passErrors.confirm ? 'invalid' : ''}`}
            value={passData.confirm}
            onChange={handlePassChange}
            onBlur={handlePassBlur}
          />
          <span className="char-counter">{passData.confirm.length}/{limits.password}</span>
          {passTouched.confirm && passErrors.confirm && <span className="error-label">{passErrors.confirm}</span>}
          <span className="eye-icon" onClick={() => setShowPass(!showPass)}>
            {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
          </span>
        </div>

        {passServerError && <div className="error-message">{passServerError}</div>}
        {passSuccess && <div className="error-message neutral">{passSuccess}</div>}

        <button type="submit" className={`btn-auth ${isPassFormValid ? 'active' : ''}`} disabled={!isPassFormValid}>
          Обновить пароль
        </button>
      </form>
    </section>
  )}

  {/* ТАБ 2: ИЗМЕНЕНИЕ EMAIL */}
  {activeTab === 'email' && (
    <section className="settings-col-section">
      <p className="settings-current-info">Текущий адрес электронной почты: <strong>{authUser.email}</strong></p>

      <div className="auth-body">
        {emailStep === 1 && (
          <form onSubmit={handleEmailStep1} noValidate>
            <div className="input-group">
              <label>Подтвердите текущий Email</label>
              <input
                type="email"
                name="current"
                className={`auth-input ${emailTouched.current && emailErrors.current ? 'invalid' : ''}`}
                value={emailData.current}
                onChange={handleEmailChange}
                onBlur={handleEmailBlur}
                placeholder="example@mail.com"
              />
              <span className="char-counter">{emailData.current.length}/{limits.email}</span>
              {emailTouched.current && emailErrors.current && <span className="error-label">{emailErrors.current}</span>}
            </div>
            <button type="submit" style={{ marginTop: '16px' }} className={`btn-auth ${emailData.current && !emailErrors.current ? 'active' : ''}`} disabled={!emailData.current || !!emailErrors.current}>
              Получить код
            </button>
          </form>
        )}

        {emailStep === 2 && (
          <form onSubmit={handleEmailStep2} noValidate>
            <div className="input-group">
              <label>Код из письма</label>
              <input
                type="text"
                name="code"
                className="auth-input"
                value={emailData.code}
                onChange={handleEmailChange}
                placeholder="6-значный код"
              />
              {emailErrors.code && <span className="error-label">{emailErrors.code}</span>}
            </div>
            <div className="code-info">
              {timer > 0 ? (
                <span className="timer-text">Отправить снова через {timer}с</span>
              ) : (
                <button type="button" className="resend-link" onClick={resendCode}>Переотправить код</button>
              )}
            </div>
            <button type="submit" style={{ marginTop: '16px' }} className={`btn-auth ${emailData.code.length >= 4 ? 'active' : ''}`} disabled={!emailData.code}>
              Подтвердить код
            </button>
          </form>
        )}

        {emailStep === 3 && (
          <form onSubmit={handleEmailStep3} noValidate>
            <div className="input-group">
              <label>Введите новый Email</label>
              <input
                type="email"
                name="next"
                className={`auth-input ${emailTouched.next && emailErrors.next ? 'invalid' : ''}`}
                value={emailData.next}
                onChange={handleEmailChange}
                onBlur={handleEmailBlur}
                placeholder="new-email@mail.com"
              />
              <span className="char-counter">{emailData.next.length}/{limits.email}</span>
              {emailTouched.next && emailErrors.next && <span className="error-label">{emailErrors.next}</span>}
            </div>
            <button type="submit" style={{ marginTop: '16px' }} className={`btn-auth ${emailData.next && !emailErrors.next ? 'active' : ''}`} disabled={!emailData.next || !!emailErrors.next}>
              Привязать почту
            </button>
          </form>
        )}

        {emailServerError && <div className="error-message">{emailServerError}</div>}
        {emailSuccess && <div className="error-message neutral">{emailSuccess}</div>}
      </div>
    </section>
  )}

  {/* ТАБ 3: УПРАВЛЕНИЕ КАНАЛОМ */}
  {activeTab === 'channel' && (
    <section className="settings-col-section">
      <div className="auth-body">
        {authUser.channel_created == 1 ? (
          <div className="settings-channel-container">
            <p className="settings-current-info">
              Вы можете отредактировать информацию о вашем канале или полностью удалить его.
              Ваши подписки и профиль пользователя при этом сохранятся.
            </p>
            <div className="set-row">
              <Link to="/studio/profile" className="btn-settings-footer-action secondary-outline">
                Редактировать профиль
              </Link>
              <button className="btn-settings-footer-action secondary-outline" onClick={handleDeleteChannel}>
                Удалить канал
              </button>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <div className="create-channel-promo">
              <p className="settings-current-info">У вас пока нет созданного канала на платформе.</p>
              <button className="btn-auth active" onClick={() => navigate(`/profile/${authUser?.id}`)}>
                Перейти в профиль для создания
              </button>
            </div>
          </div>
        )}

        {/* БЛОК УДАЛЕНИЯ АККАУНТА */}
        <div className="settings-account-delete-zone">
          <h2 style={{ color: '#ff4d4f', marginBottom: '32px'}}>
            Удаление учетной записи
          </h2>
          <p className="settings-current-info">
            Удаление аккаунта приведет к безвозвратной и полной потере всех данных вашего профиля без возможности восстановления.
          </p>
          <button className="btn-settings-footer-action danger-outline" onClick={handleAccountDelete}>
            Удалить аккаунт навсегда
          </button>
        </div>
      </div>
    </section>
  )}

</div>
    </div>
  );
};

export default Settings;