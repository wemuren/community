import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link, NavLink } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import '../../assets/styles/auth.css';
import logo from '../../assets/img/logo.svg';

import { API_BASE_URL } from '@/config/api';

const Login = () => {
  const [formData, setFormData] = useState({ login: '', password: '' });
  const [touched, setTouched] = useState({ login: false, password: false });
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const navigate = useNavigate();

  const limits = { login: 50, password: 32 };

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (isLoggedIn) navigate('/', { replace: true });
  }, [navigate]);

  const validateField = (name, value) => {
    let error = '';
    if (name === 'login') {
      if (!value) error = 'Введите логин или email';
      else if (value.length < 3) error = 'Минимум 3 символа';
    }
    if (name === 'password') {
      if (!value) error = 'Введите пароль';
      else if (value.length < 6) error = 'Пароль слишком короткий';
    }
    setFieldErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (value.length > limits[name]) return;
    setServerError('');
    setFormData(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const handleBlur = (name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, formData[name]);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setServerError('');
    setTouched({ login: true, password: true });
    if (fieldErrors.login || fieldErrors.password || !formData.login || !formData.password) return;

    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login.php`, formData);
      if (res.data.status === 'success') {
        const userData = res.data.user;
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('isLoggedIn', 'true');
        navigate(Number(userData.is_admin) === 1 ? '/admin' : '/', { replace: true });
      } else {
        setServerError(res.data.message || 'Ошибка входа');
      }
    } catch (err) {
      setServerError(err.response?.data?.message || 'Ошибка соединения с сервером');
    }
  };

  const isFormValid = formData.login.length >= 3 && formData.password.length >= 6 &&
    !fieldErrors.login && !fieldErrors.password;

  return (
    <div className="auth-container">
      <div className="logo-main">
        <img src={logo} alt="Logo" />
      </div>

      <div className="auth-card">
        <h2>ВХОД</h2>

        <div className="auth-body">
          {/* ЛОГИН */}
          <div className="input-group">
            <label htmlFor="login">ЛОГИН / EMAIL</label>
            <span className={`char-counter${formData.login.length >= limits.login ? ' limit' : ''}`}>
              {formData.login.length}/{limits.login}
            </span>
            <input
              id="login"
              name="login"
              className={`auth-input${(fieldErrors.login && touched.login) || serverError ? ' invalid' : ''}`}
              type="text"
              placeholder="email / имя пользователя"
              value={formData.login}
              onChange={handleChange}
              onBlur={() => handleBlur('login')}
            />
            {fieldErrors.login && touched.login && (
              <span className="error-label">{fieldErrors.login}</span>
            )}
          </div>

          {/* ПАРОЛЬ */}
          <div className="input-group password-group">
            <label htmlFor="password">ПАРОЛЬ</label>
            <span className="char-counter">
              {formData.password.length}/{limits.password}
            </span>
            <input
              id="password"
              name="password"
              className={`auth-input${(fieldErrors.password && touched.password) || serverError ? ' invalid' : ''}`}
              type={showPass ? 'text' : 'password'}
              placeholder="password"
              value={formData.password}
              onChange={handleChange}
              onBlur={() => handleBlur('password')}
            />
            <span className="eye-icon" onClick={() => setShowPass(!showPass)}>
              {showPass ? <Eye size={20} /> : <EyeOff size={20} />}
            </span>
            {fieldErrors.password && touched.password && (
              <span className="error-label">{fieldErrors.password}</span>
            )}
          </div>

          <div style={{ textAlign: 'right' }}>
            <Link
              to="/forgot-password"
              style={{ fontSize: 'var(--descr)', color: 'rgba(0,0,0,0.72)', textDecoration: 'underline' }}
            >
              Забыли пароль?
            </Link>
          </div>
        </div>

        <div className="auth-footer-section">
          <div className="btn-group">
            <button
              className={`btn-auth${isFormValid ? ' active' : ''}`}
              onClick={handleLogin}
            >
              войти
            </button>
            {serverError && <span className="error-message">{serverError}</span>}
          </div>

          <div className="auth-footer">
            <span>Еще нет аккаунта?</span>
            <Link to="/register">Зарегистрироваться</Link>
          </div>

          <p className="legal-text">
            Пользуясь сервисом, Вы принимаете{' '}
            <NavLink to="/terms">Пользовательское соглашение</NavLink>
            {' '}и{' '}
            <NavLink to="/privacy">Политику конфиденциальности</NavLink>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;