import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Trash2, Image as ImageIcon } from 'lucide-react';
import '../assets/styles/studio.css';
import '../assets/styles/auth.css';

import { API_BASE_URL, BANNER_URL } from '@/config/api';
import UserAvatar from '../components/UserAvatar'; // ИСПРАВЛЕНО: Подключили сквозной компонент аватарок

const StudioProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')));
  const [editData, setEditData] = useState({ 
    full_name: user?.full_name || '', 
    username: user?.username || '' 
  });
  
  const [avatarFile, setAvatarFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  
  // Стейты для локального предпросмотра картинок перед отправкой
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);
  const [bannerPreview, setBannerPreview] = useState(user?.banner ? `${BANNER_URL}${user.banner}` : null);
  
  const [loading, setLoading] = useState(false);
  const [usernameError, setUsernameError] = useState('');

  const limits = { full_name: 50, username: 30 };

  const handleInputChange = (e, field) => {
    let value = e.target.value;
    if (field === 'username') {
      value = value.toLowerCase().replace(/\s/g, '').replace(/[^a-z0-9_]/g, '');
    }
    if (value.length <= limits[field]) {
      setEditData({ ...editData, [field]: value });
    }
  };

  // Обработка выбора файлов с генерацией локальных Blob-ссылок для превью
  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    console.log(`Выбран файл для ${type}:`, file.name, file.size);

    if (type === 'avatar') {
      setAvatarFile(file);
      // Для аватарки пишем чистую Blob-ссылку прямо в стейт превью
      setAvatarPreview(URL.createObjectURL(file));
    } else if (type === 'banner') {
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  // Метод удаления аватарки или баннера с сервера
  const handleDeleteMedia = async (type) => {
    if (!window.confirm(`Вы уверены, что хотите удалить ${type === 'avatar' ? 'аватарку' : 'баннер'} канала?`)) return;
    try {
      const res = await axios.post(`${API_BASE_URL}/user/delete_profile_media.php`, {
        user_id: user.id,
        type: type
      });
      if (res.data.success) {
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        if (type === 'avatar') {
          setAvatarFile(null); setAvatarPreview(null);
        } else {
          setBannerFile(null); setBannerPreview(null);
        }
      }
    } catch (err) {
      alert("Ошибка при удалении медиа-файла");
    }
  };

  const checkUsername = async () => {
    if (editData.username === user.username) {
      setUsernameError(''); return;
    }
    if (editData.username.length < 3) {
      setUsernameError('Ник слишком короткий'); return;
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
    } catch { console.error("Ошибка проверки ника"); }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (usernameError || loading) return;
    setLoading(true);

    const formData = new FormData();
    formData.append('id', Number(user.id));
    formData.append('full_name', editData.full_name.trim());
    formData.append('username', editData.username.trim());
    
    if (avatarFile) {
      formData.append('avatar', avatarFile);
    }
    if (bannerFile) {
      formData.append('banner', bannerFile);
    }

    try {
      const res = await axios.post(`${API_BASE_URL}/user/update_user.php`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (res.data.status === 'success' && res.data.user) {
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        
        setAvatarFile(null);
        setBannerFile(null);
        
        alert("Настройки канала успешно сохранены! ");
      } else {
        alert(res.data.message || "Неизвестная ошибка сервера");
      }
    } catch (err) { 
      console.error("Полная ошибка сохранения:", err);
      alert(err.response?.data?.message || "Ошибка соединения с сервером"); 
    } finally { 
      setLoading(false); 
    }
  };

  const isFormValid = editData.full_name && editData.username && !usernameError;

  return (
    <div className="settings-white-wrapper">
      {/* КНОПКА НАЗАД */}
      <div className="settings-back-action" onClick={() => navigate(-1)}>
        <ChevronLeft size={16} strokeWidth={2} /> Назад
      </div>

     <div className="pl-top-bar"><h2>Настройки канала</h2></div>

      <form onSubmit={handleUpdate} className="settings-columns-grid" noValidate>
        
        {/* ЛЕВАЯ КОЛОНКА: ТЕКСТОВЫЕ ДАННЫЕ */}
        <section className="settings-col-section">
          <h3>Основная информация</h3>
          <div className="auth-body">
            
            {/* ОТОБРАЖАЕМОЕ ИМЯ */}
            <div className="input-group">
              <label>Отображаемое имя</label>
              <input 
                type="text" 
                className="auth-input"
                value={editData.full_name} 
                onChange={e => handleInputChange(e, 'full_name')} 
              />
              <span className="char-counter">{editData.full_name.length}/{limits.full_name}</span>
            </div>

            {/* USERNAME */}
            <div className="input-group">
              <label>Уникальный @username</label>
              <input 
                type="text" 
                className={`auth-input ${usernameError ? 'invalid' : ''}`}
                value={editData.username} 
                onChange={e => handleInputChange(e, 'username')}
                onBlur={checkUsername}
              />
              <span className="char-counter">{editData.username.length}/{limits.username}</span>
              {usernameError && <span className="error-label">{usernameError}</span>}
              <p className="studio-field-subtext">Только латиница, цифры и нижнее подчеркивание</p>
            </div>

            <button 
              type="submit" 
              className={`btn-auth ${isFormValid && !loading ? 'active' : ''}`} 
              disabled={!isFormValid || loading}
            >
              {loading ? 'Сохраняем...' : 'Обновить настройки канала'}
            </button>
          </div>
        </section>

        {/* ПРАВАЯ КОЛОНКА: КАСТОМИЗАЦИЯ И ОФОРМЛЕНИЕ КАНАЛА */}
        <section className="settings-col-section">
          <h3>Визуальное оформление</h3>
          
          <div className="studio-media-upload-body">
            
            {/* БЛОК АВАТАРКИ */}
            <div className="input-group">
              <label>Аватар профиля</label>
              <div className="studio-avatar-row-ctx">
                {/* ИСПРАВЛЕНО: Интегрировали чистый UserAvatar. 
                    Если юзер выбрал локальный файл — скармливаем Blob-ссылку напрямую */}
                <UserAvatar 
                  user={{ 
                    avatar: avatarPreview, 
                    full_name: editData.full_name, 
                    username: editData.username 
                  }} 
                  sizeClass="avatar-large" 
                />
                
                <div className="studio-upload-controls-block">
                  <label className="btn-settings-footer-action secondary-outline">
                    Загрузить фото
                    <input type="file" accept="image/*" className="studio-hidden-file-input" onChange={e => handleFileChange(e, 'avatar')} />
                  </label>
                  {avatarPreview && (
                    <button type="button" className="studio-media-delete-btn" title="Удалить аватар" onClick={() => handleDeleteMedia('avatar')}>
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
              <p className="studio-field-subtext studio-subtext-margin">Квадратное изображение, рекомендуемый размер 400x400px</p>
            </div>

            {/* БЛОК БАННЕРА */}
            <div className="input-group studio-banner-group-margin">
              <label>Баннер канала</label>
              
              <div className="studio-banner-preview-rectangle">
                {bannerPreview ? (
                  <img src={bannerPreview} alt="Banner preview" />
                ) : (
                  <div className="studio-banner-empty-placeholder">
                    <ImageIcon size={40} color="rgba(0,0,0,0.15)" />
                  </div>
                )}
              </div>

              <div className="studio-upload-controls-block studio-banner-controls-margin">
                <label 
                  className={`btn-settings-footer-action secondary-outline ${user.is_paid == 0 ? 'disabled-label' : ''}`} 
                  style={{ cursor: user.is_paid == 0 ? 'not-allowed' : 'pointer' }}
                >
                  Загрузить баннер
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="studio-hidden-file-input"
                    disabled={user.is_paid == 0} 
                    onChange={e => handleFileChange(e, 'banner')} 
                  />
                </label>
                {bannerPreview && (
                  <button type="button" className="studio-media-delete-btn" title="Удалить баннер" onClick={() => handleDeleteMedia('banner')}>
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              
              {user.is_paid == 0 ? (
                <p className="error-label studio-subtext-margin-small">
                  Загрузка кастомных баннеров доступна только пользователям с тарифом премиум
                </p>
              ) : (
                <p className="studio-field-subtext studio-subtext-margin">Широкоформатный баннер, рекомендуемый размер 1500x400px</p>
              )}
            </div>

          </div>
        </section>
      </form>
    </div>
  );
};

export default StudioProfile;