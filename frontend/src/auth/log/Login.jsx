import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import '../../assets/styles/auth.css';

import { API_BASE_URL } from '@/config/api';

const Login = () => {
  const [formData, setFormData] = useState({ login: '', password: '' });
  const [touched, setTouched] = useState({ login: false, password: false });
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const navigate = useNavigate();

  const limits = { login: 50, password: 32 };

  // Вставь это в Login, Register и ForgotPassword
useEffect(() => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  if (isLoggedIn) {
    // Если уже залогинен — отправляем на главную, стирая историю входа
    navigate('/', { replace: true });
  }
}, [navigate]);

  // Валидация на лету
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
    
    // Ограничение по длине (не даем вводить больше лимита)
    if (value.length > limits[name]) return;

    setServerError(''); // Сбрасываем общую ошибку при вводе
    setFormData(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const handleBlur = (name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, formData[name]); // Проверяем еще раз при выходе из поля
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setServerError('');
    
    // Отмечаем всё как touched при попытке входа
    setTouched({ login: true, password: true });

    // Если есть ошибки валидации — не отправляем
    if (fieldErrors.login || fieldErrors.password || !formData.login || !formData.password) return;

    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login.php`, formData);
      
      if (res.data.status === 'success') {
        const userData = res.data.user;
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('isLoggedIn', 'true'); 
        
        // Находишь строку navigate и меняешь на эту:
navigate(Number(userData.is_admin) === 1 ? '/admin' : '/', { replace: true });
      }
    } catch (err) { 
      setServerError(err.response?.data?.message || "Ошибка соединения с сервером"); 
    }
  };

  // Кнопка активна, если поля заполнены и нет ошибок
  const isFormValid = formData.login.length >= 3 && formData.password.length >= 6 && !fieldErrors.login && !fieldErrors.password;

  return (
    <div className="auth-container">
      <div className="logo-main">COMMUN<span>iTY</span></div>

      <div className="auth-card">
        <h2>ВХОД</h2>
        
        <form onSubmit={handleLogin}>
          {/* ПОЛЕ ЛОГИНА */}
          <div className="input-group">
            <label>ЛОГИН / EMAIL</label>
            <span className={`char-counter ${formData.login.length >= limits.login ? 'limit' : ''}`}>
              {formData.login.length}/{limits.login}
            </span>
            <input 
              name="login"
              className={`auth-input ${fieldErrors.login && touched.login ? 'invalid' : ''}`}
              type="text" 
              placeholder="email / имя пользователя" 
              value={formData.login}
              onChange={handleChange}
              onBlur={() => handleBlur('login')}
              required 
            />
            {fieldErrors.login && touched.login && (
              <span className="error-label">{fieldErrors.login}</span>
            )}
          </div>

          {/* ПОЛЕ ПАРОЛЯ */}
          <div className="input-group password-group">
            <label>ПАРОЛЬ</label>
            <span className="char-counter">
              {formData.password.length}/{limits.password}
            </span>
            <input 
              name="password"
              className={`auth-input ${fieldErrors.password && touched.password ? 'invalid' : ''}`}
              type={showPass ? "text" : "password"} 
              placeholder="password" 
              value={formData.password}
              onChange={handleChange}
              onBlur={() => handleBlur('password')}
              required 
            />
            <span className="eye-icon" onClick={() => setShowPass(!showPass)}>
              {showPass ? '👁️' : '🙈'}
            </span>
            {fieldErrors.password && touched.password && (
              <span className="error-label">{fieldErrors.password}</span>
            )}
          </div>

          <div style={{textAlign: 'right', marginBottom: '32px'}}>
            <Link to="/forgot-password" style={{fontSize: '14px', color: '#333', textDecoration: 'none'}}>
              Забыли пароль?
            </Link>
          </div>

          <button type="submit" className={`btn-auth ${isFormValid ? 'active' : ''}`}>
            войти
          </button>
          
          {serverError && <div className="error-message">{serverError}</div>}
        </form>

        <div className="auth-footer">
          Еще нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
        </div>

        <p className="legal-text">
          Пользуясь сервисом, Вы принимаете <a href="#">пользовательское соглашение</a> и <a href="#">политику конфиденциальности</a>
        </p>
      </div>
    </div>
  );
};

export default Login;