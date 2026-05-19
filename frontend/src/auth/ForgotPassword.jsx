import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import '../assets/styles/auth.css';
import logo from '../assets/img/logo.svg';

import { API_BASE_URL } from '@/config/api';

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [timer, setTimer] = useState(0);
  const [showPass, setShowPass] = useState(false);
  
  const [formData, setFormData] = useState({ email: '', code: '', password: '', confirm: '' });
  const [touched, setTouched] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  
  const navigate = useNavigate();
  const limits = { email: 50, code: 6, password: 32 };

  // Вставь это в Login, Register и ForgotPassword
useEffect(() => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  if (isLoggedIn) {
    // Если уже залогинен — отправляем на главную, стирая историю входа
    navigate('/', { replace: true });
  }
}, [navigate]);

  // Таймер для повторной отправки
  useEffect(() => {
    let interval;
    if (timer > 0) interval = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // Валидация на лету
  const validateField = (name, value) => {
    let error = '';
    if (name === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value) error = 'Введите email';
      else if (!emailRegex.test(value)) error = 'Некорректный формат почты';
    }
    if (name === 'code') {
      if (value.length > 0 && value.length < 6) error = 'Код состоит из 6 цифра';
    }
    if (name === 'password') {
      if (value.length > 0 && value.length < 6) error = 'Минимум 6 символов';
    }
    if (name === 'confirm') {
      if (value !== formData.password) error = 'Пароли не совпадают';
    }
    setFieldErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleInputChange = (e, field) => {
    let value = e.target.value;
    if (field === 'code') value = value.replace(/\D/g, '').slice(0, 6);
    if (limits[field] && value.length > limits[field]) return;

    setServerError('');
    setFormData({ ...formData, [field]: value });
    validateField(field, value);
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  // --- ОТПРАВКА ДАННЫХ ---

  const handleRequestCode = async (e) => {
    if (e) e.preventDefault();
    setTouched({ ...touched, email: true });
    if (fieldErrors.email || !formData.email) return;

    try {
      const res = await axios.post(`${API_BASE_URL}/auth/forgot_password.php`, { email: formData.email });
      if (res.data.status === 'success') {
        setStep(2);
        setTimer(59);
        setServerError('');
        // Удалили alert, теперь просто смотрим в Network в браузере, если нужен код
      }
    } catch (err) { 
      setServerError(err.response?.data?.message || "Ошибка сервера"); 
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (formData.code.length < 6) return;
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/verify_code.php`, { email: formData.email, code: formData.code });
      if (res.data.status === 'success') {
        setStep(3);
        setServerError('');
      }
    } catch (err) { setServerError("Неверный код подтверждения"); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setTouched({ ...touched, password: true, confirm: true });
    if (fieldErrors.password || fieldErrors.confirm) return;

    try {
      await axios.post(`${API_BASE_URL}/auth/set_password.php`, { email: formData.email, password: formData.password });
      alert("Пароль успешно изменен!");
      // После алерта об успешной смене пароля
navigate('/login', { replace: true });
    } catch (err) { setServerError("Ошибка при сохранении пароля"); }
  };

  // Условия активности кнопок
  const isEmailActive = formData.email && !fieldErrors.email;
  const isCodeActive = formData.code.length === 6;
  const isPassActive = formData.password.length >= 6 && formData.confirm === formData.password;

  return (
    <div className="auth-container">
      <div className="logo-main"><img src={logo} alt="Community Logo" /></div>
      <div className="auth-card">
        <h2>ВОССТАНОВЛЕНИЕ</h2>

        {/* ШАГ 1: ВВОД EMAIL */}
        {step === 1 && (
          <form onSubmit={handleRequestCode}>
            <div className="input-group">
              <label>ВВЕДИТЕ EMAIL</label>
              <span className={`char-counter ${formData.email.length >= limits.email ? 'limit' : ''}`}>
                {formData.email.length}/{limits.email}
              </span>
              <input 
                className={`auth-input ${fieldErrors.email && touched.email ? 'invalid' : ''}`}
                type="email" 
                placeholder="example@gmail.com"
                value={formData.email} 
                onChange={e => handleInputChange(e, 'email')} 
                onBlur={() => handleBlur('email')}
                required 
              />
              {fieldErrors.email && touched.email && <span className="error-label">{fieldErrors.email}</span>}
            </div>
            <button type="submit" className={`btn-auth ${isEmailActive ? 'active' : ''}`}>ОТПРАВИТЬ КОД</button>
          </form>
        )}

        {/* ШАГ 2: ВВОД КОДА */}
        {step === 2 && (
          <form onSubmit={handleVerifyCode}>
            <div className="input-group">
              <label>КОД ПОДТВЕРЖДЕНИЯ</label>
              <input 
                className={`auth-input ${serverError && formData.code ? 'invalid' : ''}`}
                type="text" 
                placeholder="123456"
                value={formData.code} 
                onChange={e => handleInputChange(e, 'code')} 
                required 
              />
              {serverError && formData.code && <span className="error-label">{serverError}</span>}
            </div>
            <div className="code-info">
              {timer > 0 ? (
                <span className="timer-text">Повтор через {timer} с</span>
              ) : (
                <button type="button" onClick={handleRequestCode} className="resend-link">Отправить еще раз</button>
              )}
            </div>
            <button type="submit" className={`btn-auth ${isCodeActive ? 'active' : ''}`}>ПРОДОЛЖИТЬ</button>
          </form>
        )}

        {/* ШАГ 3: НОВЫЙ ПАРОЛЬ */}
        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            <div className="input-group password-group">
              <label>НОВЫЙ ПАРОЛЬ</label>
              <span className="char-counter">{formData.password.length}/{limits.password}</span>
              <input 
                className={`auth-input ${fieldErrors.password && touched.password ? 'invalid' : ''}`}
                type={showPass ? "text" : "password"} 
                onChange={e => handleInputChange(e, 'password')} 
                onBlur={() => handleBlur('password')}
                required 
              />
              <span className="eye-icon" onClick={() => setShowPass(!showPass)}>{showPass ? '👁️' : '🙈'}</span>
              {fieldErrors.password && touched.password && <span className="error-label">{fieldErrors.password}</span>}
            </div>
            <div className="input-group password-group">
              <label>ПОВТОРИТЕ ПАРОЛЬ</label>
              <input 
                className={`auth-input ${fieldErrors.confirm && touched.confirm ? 'invalid' : ''}`}
                type={showPass ? "text" : "password"} 
                onChange={e => handleInputChange(e, 'confirm')} 
                onBlur={() => handleBlur('confirm')}
                required 
              />
              <span className="eye-icon" onClick={() => setShowPass(!showPass)}>{showPass ? '👁️' : '🙈'}</span>
              {fieldErrors.confirm && touched.confirm && <span className="error-label">{fieldErrors.confirm}</span>}
            </div>
            <button type="submit" className={`btn-auth ${isPassActive ? 'active' : ''}`}>СБРОСИТЬ ПАРОЛЬ</button>
          </form>
        )}

        {serverError && step !== 2 && <div className="error-message" style={{marginTop:'15px'}}>{serverError}</div>}
        <div className="auth-footer"><Link to="/login">Вернуться ко входу</Link></div>
      </div>
    </div>
  );
};

export default ForgotPassword;