import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost/projects/community/api';

const StudioProfile = () => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
  const [editData, setEditData] = useState({ 
    full_name: user.full_name || '', 
    username: user.username || '' 
  });
  
  const [avatarFile, setAvatarFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // Лимиты для полей
  const limits = { full_name: 50, username: 30 };

  const handleInputChange = (e, field) => {
    let value = e.target.value;

    if (field === 'username') {
      // 1. Приводим к нижнему регистру (по желанию, но для ников это стандарт)
      // 2. Убираем ВСЕ пробелы (даже внутри текста)
      // 3. Вырезаем всё, кроме латиницы, цифр и нижнего подчеркивания
      value = value.toLowerCase()
                   .replace(/\s/g, '') 
                   .replace(/[^a-z0-9_]/g, '');
    }

    if (value.length <= limits[field]) {
      setEditData({ ...editData, [field]: value });
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append('id', user.id);
    formData.append('full_name', editData.full_name);
    formData.append('username', editData.username);
    if (avatarFile) formData.append('avatar', avatarFile);
    if (bannerFile) formData.append('banner', bannerFile);

    try {
      const res = await axios.post(`${API_BASE_URL}/user/update_user.php`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (res.data.status === 'success') {
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        alert("Профиль обновлен! ✨");
      }
    } catch (err) { 
      alert(err.response?.data?.message || "Ошибка при обновлении"); 
    } finally { 
      setLoading(false); 
    }
  };


  const [usernameError, setUsernameError] = useState('');

// 2. Функция проверки
const checkUsername = async () => {
  if (editData.username === user.username) {
    setUsernameError(''); // Если это наш текущий ник — всё ок
    return;
  }
  
  if (editData.username.length < 3) {
    setUsernameError('Ник слишком короткий');
    return;
  }

  try {
    const res = await axios.post(`${API_BASE_URL}/user/check_username.php`, {
      username: editData.username,
      user_id: user.id
    });
    
    if (res.data.status === 'taken') {
      setUsernameError(res.data.message);
    } else {
      setUsernameError('');
    }
  } catch (err) {
    console.error("Ошибка проверки ника");
  }
};

  return (
    <div className="content-card">
      <h2 className="page-title">Настройки канала</h2>
      
      <form onSubmit={handleUpdate} className="admin-form" style={{maxWidth: '600px'}}>
        
        {/* ИМЯ */}
        <div className="form-group" style={{position: 'relative'}}>
          <label>Отображаемое имя</label>
          <span className={`char-counter ${editData.full_name.length >= limits.full_name ? 'limit' : ''}`}>
            {editData.full_name.length}/{limits.full_name}
          </span>
          <input 
            type="text" 
            className="auth-input" // Используем класс из auth.css для стиля
            value={editData.full_name} 
            onChange={e => handleInputChange(e, 'full_name')} 
          />
        </div>

        {/* USERNAME */}
       <div className="form-group" style={{position: 'relative'}}>
          <label>Уникальный @username</label>
          <span className={`char-counter ${editData.username.length >= limits.username ? 'limit' : ''}`}>
            {editData.username.length}/{limits.username}
          </span>
          <input 
            type="text" 
            className={`auth-input ${usernameError ? 'invalid' : ''}`}
            value={editData.username} 
            onChange={e => handleInputChange(e, 'username')}
            onBlur={checkUsername} // Проверяем, когда юзер закончил ввод
          />
          {/* Выводим ошибку "Занято" */}
          {usernameError && <p className="error-label">{usernameError}</p>}
          <p className="sub-text">Только латиница, цифры и нижнее подчеркивание</p>
        </div>

        <div className="form-group">
          <label>Аватарка канала</label>
          <div className="file-input-wrapper">
             <input type="file" accept="image/*" onChange={e => setAvatarFile(e.target.files[0])} />
             <p className="sub-text">Рекомендуется: 400x400px</p>
          </div>
        </div>

        <div className="form-group">
          <label>Баннер канала {user.is_paid == 0 && '🔒'}</label>
          <div className="file-input-wrapper">
             <input type="file" accept="image/*" 
                    disabled={user.is_paid == 0}
                    onChange={e => setBannerFile(e.target.files[0])} />
             {user.is_paid == 0 ? (
               <p style={{color: 'var(--brand-red)', fontSize: '12px', fontWeight: '500'}}>
                 Требуется PREMIUM подписка
               </p>
             ) : (
               <p className="sub-text">Рекомендуется: 1500x400px</p>
             )}
          </div>
        </div>

        <button 
          type="submit" 
          className={`btn-create ${(!usernameError && !loading) ? 'active' : ''}`} 
          disabled={loading || !!usernameError} // Кнопка гаснет, если ник занят
        >
          {loading ? 'СОХРАНЯЕМ...' : 'ОБНОВИТЬ КАНАЛ'}
        </button>
      </form>
    </div>
  );
};

export default StudioProfile;