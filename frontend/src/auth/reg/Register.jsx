import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, NavLink } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import '../../assets/styles/auth.css';
import logo from '../../assets/img/logo.svg';

import { API_BASE_URL } from '@/config/api';

const Register = () => {
  const [step, setStep] = useState(1);
  const [timer, setTimer] = useState(59);
  const [showPass, setShowPass] = useState(false);
  const [touched, setTouched] = useState({});
  const navigate = useNavigate();

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (isLoggedIn) navigate('/', { replace: true });
  }, [navigate]);

  const [formData, setFormData] = useState({
    email: '', code: '', password: '', confirmPassword: ''
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');

  const limits = { email: 50, code: 6, password: 32 };

  useEffect(() => {
    let interval;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

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
    if (name === 'confirmPassword') {
      if (value !== formData.password) error = 'Пароли не совпадают';
    }
    setFieldErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleInputChange = (e, field) => {
    setServerError('');
    let value = e.target.value;
    if (field === 'code') value = value.replace(/\D/g, '').slice(0, 6);
    if (limits[field] && value.length > limits[field]) return;
    setFormData({ ...formData, [field]: value });
    validateField(field, value);
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (fieldErrors.email || !formData.email) return setServerError('Проверьте корректность Email');
    if (!document.getElementById('robot').checked) return setServerError('Капча не пройдена');
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/register_email.php`, { email: formData.email });
      if (res.data.status === 'success') {
        setServerError(''); setStep(2); setTimer(59);
      } else {
        setServerError(res.data.message || 'Ошибка сервера, попробуйте позднее');
      }
    } catch (err) {
      setServerError(err.response?.data?.message || 'Ошибка сервера, попробуйте позднее');
    }
  };

  const handleResendCode = async () => {
    setServerError('');
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/register_email.php`, { email: formData.email });
      if (res.data.status === 'success') setTimer(59);
    } catch (err) {
      setServerError('Не удалось отправить код, попробуйте позже');
    }
  };

  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/verify_code.php`, { email: formData.email, code: formData.code });
      if (res.data.status === 'success') {
        setServerError(''); setStep(3);
      } else {
        setServerError(res.data.message || 'Неверный код подтверждения');
      }
    } catch (err) {
      setServerError(err.response?.data?.message || 'Неверный код подтверждения');
    }
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    if (fieldErrors.password || fieldErrors.confirmPassword) return;
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/set_password.php`, { email: formData.email, password: formData.password });
      if (res.data.status === 'success') window.location.href = '/login';
    } catch (err) {
      setServerError('Ошибка сервера, попробуйте позднее');
    }
  };

  const isEmailBtnActive = formData.email && !fieldErrors.email;
  const isCodeBtnActive = formData.code.length === 6;
  const isPassBtnActive = formData.password.length >= 6 && !fieldErrors.confirmPassword;

   const Footer = () => (
    <>
      <div className="auth-footer">
        <span>Уже есть аккаунт?</span>
        <a href="/login">Войти</a>
      </div>
      <p className="legal-text">
        Пользуясь сервисом, Вы принимаете{' '}
        <NavLink to="/terms">Пользовательское соглашение</NavLink>
        {' '}и{' '}
        <NavLink to="/privacy">Политику конфиденциальности</NavLink>
      </p>
    </>
  );

  return (
    <div className="auth-container">
      <div className="logo-main">
        <img src={logo} alt="Logo" />
      </div>

      <div className="auth-card">
        <h2>РЕГИСТРАЦИЯ</h2>

        {/* ШАГ 1: EMAIL */}
        {step === 1 && (
          <>
            <div className="auth-body">
              <div className="input-group">
                <label htmlFor="email">ВВЕДИТЕ EMAIL</label>
                <span className="char-counter">{formData.email.length}/{limits.email}</span>
                <input
                  id="email"
                  className={`auth-input${fieldErrors.email && touched.email ? ' invalid' : ''}`}
                  type="email"
                  placeholder="example@gmail.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange(e, 'email')}
                  onBlur={() => handleBlur('email')}
                />
                {fieldErrors.email && touched.email && (
                  <span className="error-label">{fieldErrors.email}</span>
                )}
              </div>

              <div className="captcha-row">
                <input type="checkbox" id="robot" />
                <label htmlFor="robot">Я не робот</label>
              </div>
            </div>

            <div className="auth-footer-section">
              <div className="btn-group">
                <button
                  className={`btn-auth${isEmailBtnActive ? ' active' : ''}`}
                  onClick={handleEmailSubmit}
                >
                  зарегистрироваться
                </button>
                {serverError && (
                  <span className="error-message">{serverError}</span>
                )}
              </div>
              <Footer />
            </div>
          </>
        )}

        {/* ШАГ 2: КОД */}
        {step === 2 && (
          <>
            <div className="auth-body">
              <div className="input-group">
                <label htmlFor="code">введите код подтверждения</label>
                <input
                  id="code"
                  className={`auth-input${serverError ? ' invalid' : ''}`}
                  type="text"
                  placeholder="123456"
                  value={formData.code}
                  onChange={(e) => { handleInputChange(e, 'code'); setServerError(''); }}
                  onBlur={() => handleBlur('code')}
                />
              </div>

              <div className="code-info">
                <p>Отправили код на почту {formData.email}</p>
                {timer > 0 ? (
                  <span className="timer-text">
                    Получить новый код <span>{timer} с</span>
                  </span>
                ) : (
                  <button type="button" className="resend-link" onClick={handleResendCode}>
                    Получить новый код
                  </button>
                )}
              </div>
            </div>

            <div className="auth-footer-section">
              <div className="btn-group">
                <button
                  className={`btn-auth${isCodeBtnActive ? ' active' : ''}`}
                  onClick={handleCodeSubmit}
                >
                  ПРОДОЛЖИТЬ
                </button>
                {serverError && (
                  <span className="error-message">{serverError}</span>
                )}
              </div>
              <Footer />
            </div>
          </>
        )}

        {/* ШАГ 3: ПАРОЛЬ */}
        {step === 3 && (
          <>
            <div className="auth-body">
              <div className="input-group password-group">
                <label htmlFor="password">придумайте пароль</label>
                <span className="char-counter">{formData.password.length}/{limits.password}</span>
                <input
                  id="password"
                  className={`auth-input${fieldErrors.password && touched.password ? ' invalid' : ''}`}
                  type={showPass ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange(e, 'password')}
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
                <label htmlFor="confirmPassword">повторите пароль</label>
                <input
                  id="confirmPassword"
                  className={`auth-input${fieldErrors.confirmPassword && touched.confirmPassword ? ' invalid' : ''}`}
                  type={showPass ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange(e, 'confirmPassword')}
                  onBlur={() => handleBlur('confirmPassword')}
                />
                <span className="eye-icon" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <Eye size={20} /> : <EyeOff size={20} />}
                </span>
                {fieldErrors.confirmPassword && touched.confirmPassword && (
                  <span className="error-label">{fieldErrors.confirmPassword}</span>
                )}
              </div>
            </div>

            <div className="auth-footer-section">
              <div className="btn-group">
                <button
                  className={`btn-auth${isPassBtnActive ? ' active' : ''}`}
                  onClick={handleFinalSubmit}
                >
                  ПРОДОЛЖИТЬ
                </button>
                {serverError && (
                  <span className="error-message">{serverError}</span>
                )}
              </div>
              <Footer />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Register;