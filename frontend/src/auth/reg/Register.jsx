import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import '../../assets/styles/auth.css';

import { API_BASE_URL } from '@/config/api';

const Register = () => {
  const [step, setStep] = useState(1);
  const [timer, setTimer] = useState(59);
  const [showPass, setShowPass] = useState(false);
  const [touched, setTouched] = useState({}); // Храним, какие поля "трогал" юзер
  const navigate = useNavigate();

  const handleBlur = (field) => {
  setTouched(prev => ({ ...prev, [field]: true }));
};

// Вставь это в Login, Register и ForgotPassword
useEffect(() => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  if (isLoggedIn) {
    // Если уже залогинен — отправляем на главную, стирая историю входа
    navigate('/', { replace: true });
  }
}, [navigate]);
  
  // Состояния для данных и ошибок
  const [formData, setFormData] = useState({
    email: '', code: '', password: '', confirmPassword: ''
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');

  // Лимиты символов
  const limits = { email: 50, code: 6, password: 32 };

  // Таймер (Шаг 2)
  useEffect(() => {
    let interval;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  // --- ЖИВАЯ ВАЛИДАЦИЯ ---
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

    // Жесткие ограничения на ввод
    if (field === 'code') value = value.replace(/\D/g, '').slice(0, 6);
    if (limits[field] && value.length > limits[field]) return;

    setServerError('');
    setFormData({ ...formData, [field]: value });
    validateField(field, value);
  };

  // --- SUBMIT-ХЕНДЛЕРЫ ---
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (fieldErrors.email || !formData.email) return setServerError('Проверьте корректность Email');
    if (!document.getElementById('robot').checked) return setServerError('Подтвердите, что вы не робот');

    try {
      const res = await axios.post(`${API_BASE_URL}/auth/register_email.php`, { email: formData.email });
      if (res.data.status === 'success') {
        setStep(2);
        setTimer(59);
      }
    } catch (err) {
      setServerError(err.response?.data?.message || 'Ошибка сервера');
    }
  };

  const handleResendCode = async () => {
  setServerError(''); // Убираем старые ошибки
  try {
    const res = await axios.post(`${API_BASE_URL}/auth/register_email.php`, { 
      email: formData.email 
    });
    
    if (res.data.status === 'success') {
      setTimer(59); // Запускаем таймер заново
      alert("Новый код отправлен на вашу почту!");
    }
  } catch (err) {
    setServerError('Не удалось отправить код, попробуйте позже');
  }
};

  const handleCodeSubmit = async (e) => {
  e.preventDefault();
  setServerError(''); // Чистим старую ошибку перед новым запросом
  
  try {
    const res = await axios.post(`${API_BASE_URL}/auth/verify_code.php`, { 
      email: formData.email, 
      code: formData.code 
    });
    if (res.data.status === 'success') setStep(3);
  } catch (err) {
    // ВОТ ЗДЕСЬ мы записываем текст "Неверный код"
    setServerError(err.response?.data?.message || 'Неверный код подтверждения');
  }
};

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    if (fieldErrors.password || fieldErrors.confirmPassword) return;

    try {
      const res = await axios.post(`${API_BASE_URL}/auth/set_password.php`, { 
        email: formData.email, password: formData.password 
      });
      if (res.data.status === 'success') window.location.href = '/login';
    } catch (err) { setServerError('Не удалось установить пароль'); }
  };

  // Кнопки активны только если нет ошибок и поля заполнены
  const isEmailBtnActive = formData.email && !fieldErrors.email;
  const isCodeBtnActive = formData.code.length === 6;
  const isPassBtnActive = formData.password.length >= 6 && !fieldErrors.confirmPassword;

  return (
    <div className="auth-container">
      <div className="logo-main">COMMUN<span>iTY</span></div>
      <div className="auth-card">
        <h2>РЕГИСТРАЦИЯ</h2>

        {/* ШАГ 1: EMAIL */}
        {step === 1 && (
          <form onSubmit={handleEmailSubmit}>
            <div className="input-group">
  <label>ВВЕДИТЕ EMAIL</label>
  <span className="char-counter">{formData.email.length}/{limits.email}</span>
  <input 
    className={`auth-input ${fieldErrors.email && touched.email ? 'invalid' : ''}`} // КРАСИМ ТОЛЬКО ЕСЛИ TOUCHED
    type="email" 
    placeholder="example@gmail.com" 
    value={formData.email}
    onChange={(e) => handleInputChange(e, 'email')}
    onBlur={() => handleBlur('email')} // ОТМЕЧАЕМ ПРИ ВЫХОДЕ
  />
  {/* ПОКАЗЫВАЕМ ТЕКСТ ТОЛЬКО ЕСЛИ ТРОГАЛИ И ЕСТЬ ОШИБКА */}
  {fieldErrors.email && touched.email && <span className="error-label">{fieldErrors.email}</span>}
</div>
            <div className="captcha-row">
              <input type="checkbox" id="robot" />
              <label htmlFor="robot">Я не робот</label>
            </div>
            <button type="submit" className={`btn-auth ${isEmailBtnActive ? 'active' : ''}`}>зарегистрироваться</button>
          </form>
        )}

        {/* ШАГ 2: КОД */}
        {step === 2 && (
  <form onSubmit={handleCodeSubmit}>
    <div className="input-group">
      <label>КОД ПОДТВЕРЖДЕНИЯ</label>
      {/* Красим в красный ТОЛЬКО если есть ошибка сервера 
         И поле не пустое (чтобы при очистке краснота пропадала) 
      */}
      <input 
        className={`auth-input ${serverError && formData.code ? 'invalid' : ''}`}
        type="text" 
        placeholder="123456" 
        value={formData.code}
        onBlur={() => handleBlur('code')}
        onChange={(e) => handleInputChange(e, 'code')}
      />
      {/* Если хочешь выводить текст ошибки прямо под полем кода */}
      {serverError && formData.code && <span className="error-label">{serverError}</span>}
    </div>

    <div className="code-info">
      <p>Код отправлен на <strong>{formData.email}</strong></p>
      
      {timer > 0 ? (
        <span className="timer-text">Новый код через {timer} с</span>
      ) : (
        /* ПРИВЯЗЫВАЕМ ФУНКЦИЮ */
        <button 
          type="button" 
          className="resend-link" 
          onClick={handleResendCode}
        >
          Получить новый код
        </button>
      )}
    </div>
    
    <button type="submit" className={`btn-auth ${isCodeBtnActive ? 'active' : ''}`}>
      ПРОДОЛЖИТЬ
    </button>
  </form>
)}

        {/* ШАГ 3: ПАРОЛЬ */}
       {step === 3 && (
  <form onSubmit={handleFinalSubmit}>
    {/* ПОЛЕ 1: ПРИДУМАЙТЕ ПАРОЛЬ */}
    <div className="input-group password-group">
      <label>ПРИДУМАЙТЕ ПАРОЛЬ</label>
      <span className="char-counter">{formData.password.length}/{limits.password}</span>
      <input 
        className={`auth-input ${fieldErrors.password && touched.password ? 'invalid' : ''}`}
        type={showPass ? "text" : "password"} 
        value={formData.password}
        onBlur={() => handleBlur('password')}
        onChange={(e) => handleInputChange(e, 'password')}
      />
      <span className="eye-icon" onClick={() => setShowPass(!showPass)}>
        {showPass ? '👁️' : '🙈'}
      </span>
      {fieldErrors.password && touched.password && (
        <span className="error-label">{fieldErrors.password}</span>
      )}
    </div>

    {/* ПОЛЕ 2: ПОВТОРИТЕ ПАРОЛЬ (теперь с глазом) */}
    <div className="input-group password-group">
      <label>ПОВТОРИТЕ ПАРОЛЬ</label>
      <input 
        className={`auth-input ${fieldErrors.confirmPassword && touched.confirmPassword ? 'invalid' : ''}`}
        type={showPass ? "text" : "password"} // Используем тот же showPass
        value={formData.confirmPassword}
        onBlur={() => handleBlur('confirmPassword')}
        onChange={(e) => handleInputChange(e, 'confirmPassword')}
      />
      {/* Кнопка "подсмотреть" для второго поля */}
      <span className="eye-icon" onClick={() => setShowPass(!showPass)}>
        {showPass ? '👁️' : '🙈'}
      </span>
      
      {fieldErrors.confirmPassword && touched.confirmPassword && (
        <span className="error-label">{fieldErrors.confirmPassword}</span>
      )}
    </div>

    <button type="submit" className={`btn-auth ${isPassBtnActive ? 'active' : ''}`}>
      ПРОДОЛЖИТЬ
    </button>
  </form>
)}
        
        {serverError && <div className="error-message">{serverError}</div>}
        <div className="auth-footer">Уже есть аккаунт? <a href="/login">Войти</a></div>
      </div>
    </div>
  );
};

export default Register;