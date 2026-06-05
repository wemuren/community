import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
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

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (isLoggedIn) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    let interval;
    if (timer > 0) interval = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const validateField = (name, value) => {
    let error = '';
    if (name === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value) error = 'Поле не может быть пустым';
      else if (!emailRegex.test(value)) error = 'Некорректный формат почты';
    }
    if (name === 'code') {
      if (value.length > 0 && value.length < 6) error = 'Код состоит из 6 цифр';
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

  const handleRequestCode = async () => {
    setTouched({ ...touched, email: true });
    if (fieldErrors.email || !formData.email) return;

    try {
      const res = await axios.post(`${API_BASE_URL}/auth/forgot_password.php`, { email: formData.email });
      if (res.data.status === 'success') {
        setStep(2);
        setTimer(59);
        setServerError('');
      }
    } catch (err) { 
      setServerError(err.response?.data?.message || "Ошибка сервера"); 
    }
  };

  const handleVerifyCode = async () => {
    if (formData.code.length < 6) return;
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/verify_code.php`, { email: formData.email, code: formData.code });
      if (res.data.status === 'success') {
        setStep(3);
        setServerError('');
      }
    } catch (err) { setServerError("Неверный код подтверждения"); }
  };

  const handleResetPassword = async () => {
    setTouched({ ...touched, password: true, confirm: true });
    if (fieldErrors.password || fieldErrors.confirm) return;

    try {
      await axios.post(`${API_BASE_URL}/auth/set_password.php`, { email: formData.email, password: formData.password });
      navigate('/login', { replace: true });
    } catch (err) { setServerError("Ошибка при сохранении пароля"); }
  };

  const isEmailActive = formData.email && !fieldErrors.email;
  const isCodeActive = formData.code.length === 6;
  const isPassActive = formData.password.length >= 6 && formData.confirm === formData.password && !fieldErrors.confirm;

  return (
    <div className="auth-container">
      <div className="logo-main">
        <img src={logo} alt="Community Logo" />
      </div>
      
      <div className="auth-card">
        <h2>ВОССТАНОВЛЕНИЕ</h2>

        {/* ШАГ 1: ВВОД EMAIL */}
        {step === 1 && (
          <>
            <div className="auth-body">
              <div className="input-group">
                <label htmlFor="email">ВВЕДИТЕ EMAIL</label>
                <span className={`char-counter ${formData.email.length >= limits.email ? 'limit' : ''}`}>
                  {formData.email.length}/{limits.email}
                </span>
                <input 
                  id="email"
                  className={`auth-input ${fieldErrors.email && touched.email ? 'invalid' : ''}`}
                  type="email" 
                  placeholder="example@gmail.com"
                  value={formData.email} 
                  onChange={e => handleInputChange(e, 'email')} 
                  onBlur={() => handleBlur('email')}
                />
                {fieldErrors.email && touched.email && (
                  <span className="error-label">{fieldErrors.email}</span>
                )}
              </div>
            </div>
            
            <div className="auth-footer-section">
              <div className="btn-group">
                <button 
                  className={`btn-auth ${isEmailActive ? 'active' : ''}`}
                  onClick={handleRequestCode}
                >
                  ОТПРАВИТЬ КОД
                </button>
                {serverError && <span className="error-message">{serverError}</span>}
              </div>
              <div className="auth-footer"><Link to="/login">Вернуться ко входу</Link></div>
            </div>
          </>
        )}

        {/* ШАГ 2: ВВОД КОДА */}
        {step === 2 && (
          <>
            <div className="auth-body">
              <div className="input-group">
                <label htmlFor="code">КОД ПОДТВЕРЖДЕНИЯ</label>
                <input 
                  id="code"
                  className={`auth-input ${serverError && formData.code ? 'invalid' : ''}`}
                  type="text" 
                  placeholder="123456"
                  value={formData.code} 
                  onChange={e => handleInputChange(e, 'code')} 
                />
                {serverError && <span className="error-label">{serverError}</span>}
              </div>
              <div className="code-info">
                {timer > 0 ? (
                  <span className="timer-text">Повтор через {timer} с</span>
                ) : (
                  <button type="button" onClick={handleRequestCode} className="resend-link">Отправить еще раз</button>
                )}
              </div>
            </div>

            <div className="auth-footer-section">
              <div className="btn-group">
                <button 
                  className={`btn-auth ${isCodeActive ? 'active' : ''}`}
                  onClick={handleVerifyCode}
                >
                  ПРОДОЛЖИТЬ
                </button>
              </div>
              <div className="auth-footer"><Link to="/login">Вернуться ко входу</Link></div>
            </div>
          </>
        )}

        {/* ШАГ 3: НОВЫЙ ПАРОЛЬ */}
        {step === 3 && (
          <>
            <div className="auth-body">
              <div className="input-group password-group">
                <label htmlFor="password">НОВЫЙ ПАРОЛЬ</label>
                <span className="char-counter">{formData.password.length}/{limits.password}</span>
                <input 
                  id="password"
                  className={`auth-input ${fieldErrors.password && touched.password ? 'invalid' : ''}`}
                  type={showPass ? "text" : "password"} 
                  value={formData.password}
                  onChange={e => handleInputChange(e, 'password')} 
                  onBlur={() => handleBlur('password')}
                />
                <span className="eye-icon" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <Eye size={20} /> : <EyeOff size={20} />}
                </span>
                {fieldErrors.password && touched.password && (
                  <span className="error-label">{fieldErrors.password}</span>
                )}
              </div>

              <div className="input-group password-group">
                <label htmlFor="confirm">ПОВТОРИТЕ ПАРОЛЬ</label>
                <input 
                  id="confirm"
                  className={`auth-input ${fieldErrors.confirm && touched.confirm ? 'invalid' : ''}`}
                  type={showPass ? "text" : "password"} 
                  value={formData.confirm}
                  onChange={e => handleInputChange(e, 'confirm')} 
                  onBlur={() => handleBlur('confirm')}
                />
                <span className="eye-icon" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <Eye size={20} /> : <EyeOff size={20} />}
                </span>
                {fieldErrors.confirm && touched.confirm && (
                  <span className="error-label">{fieldErrors.confirm}</span>
                )}
              </div>
            </div>

            <div className="auth-footer-section">
              <div className="btn-group">
                <button 
                  className={`btn-auth ${isPassActive ? 'active' : ''}`}
                  onClick={handleResetPassword}
                >
                  СБРОСИТЬ ПАРОЛЬ
                </button>
                {serverError && <span className="error-message">{serverError}</span>}
              </div>
              <div className="auth-footer"><Link to="/login">Вернуться ко входу</Link></div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;