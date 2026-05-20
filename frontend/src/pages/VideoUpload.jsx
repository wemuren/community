import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Image as ImageIcon, Video, X } from 'lucide-react';
import '../assets/styles/studio.css';
import '../assets/styles/settings.css';
import '../assets/styles/auth.css';

import { API_BASE_URL } from '@/config/api';

const VideoUpload = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const dropdownRef = useRef(null);

  // Основные стейты данных
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  // Стейты процесса отправки
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Стейты управления тегами
  const [allTags, setAllTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagSearch, setTagSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const limits = { title: 100, description: 1000 };
  const IS_PREMIUM = user && parseInt(user.is_paid) === 1;
  const MAX_SIZE_MB = IS_PREMIUM ? 2048 : 100;
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

  // Подгрузка системных тегов
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/admin/manage_tags.php`);
        setAllTags(res.data);
      } catch (err) { console.error("Ошибка загрузки тегов:", err); }
    };
    fetchTags();
  }, []);

  const filteredTags = allTags.filter(tag =>
    tag.name.toLowerCase().includes(tagSearch.toLowerCase()) &&
    !selectedTags.find(s => s.id === tag.id)
  );

  const toggleTag = (tag) => {
    if (selectedTags.find(s => s.id === tag.id)) {
      setSelectedTags(prev => prev.filter(t => t.id !== tag.id));
    } else {
      if (selectedTags.length >= 3) return;
      setSelectedTags(prev => [...prev, tag]);
      setTagSearch('');
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Жесткое кадрирование обложки в 16:9
  const processImage = (file) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const targetWidth = 1280;
        const targetHeight = 720;
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext('2d');
        const imgRatio = img.width / img.height;
        const targetRatio = targetWidth / targetHeight;

        let sourceX = 0, sourceY = 0, sourceWidth = img.width, sourceHeight = img.height;

        if (imgRatio > targetRatio) {
          sourceWidth = img.height * targetRatio;
          sourceX = (img.width - sourceWidth) / 2;
        } else {
          sourceHeight = img.width / targetRatio;
          sourceY = (img.height - sourceHeight) / 2;
        }

        ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, targetWidth, targetHeight);

        canvas.toBlob((blob) => {
          const cropped = new File([blob], file.name, { type: file.type });
          setCoverFile(cropped);
          setCoverPreview(URL.createObjectURL(cropped));
        }, file.type, 0.9);
      };
    };
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    setError('');

    if (type === 'video') {
      const ext = file.name.split('.').pop().toLowerCase();
      if (!['mp4', 'mov', 'mkv'].includes(ext)) return setError('Разрешены только форматы MP4, MOV, MKV');
      if (file.size > MAX_SIZE_BYTES) return setError(`Превышен лимит размера файла. Вам доступно: ${MAX_SIZE_MB}МБ`);
      setVideoFile(file);
    } else {
      const ext = file.name.split('.').pop().toLowerCase();
      if (!['jpg', 'jpeg', 'png'].includes(ext)) return setError('Только графические файлы JPG/PNG');
      processImage(file);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    // Защита: публикация заблокирована, если нет хотя бы 1 тега
    if (!videoFile || !coverFile || title.length < 3 || selectedTags.length === 0) {
      return setError('Заполните обязательные поля и выберите минимум один тег');
    }

    setLoading(true);
    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('video', videoFile);
    formData.append('thumbnail', coverFile);
    formData.append('user_id', user.id);
    formData.append('title', title.trim());
    formData.append('description', description.trim());
    formData.append('tags', JSON.stringify(selectedTags.map(t => t.id)));

    try {
      await axios.post(`${API_BASE_URL}/video/upload.php`, formData, {
        onUploadProgress: (p) => setUploadProgress(Math.round((p.loaded * 100) / p.total))
      });
      navigate(`/profile/${user.id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Критическая ошибка при загрузке на сервер");
      setIsUploading(false);
    } finally { setLoading(false); }
  };

  // Валидация кнопки: Название >= 3 символов, видео есть, обложка есть, и ТЕГИ ОБЯЗАТЕЛЬНО (хотя бы 1)
  const isFormValid = title.trim().length >= 3 && videoFile && coverFile && selectedTags.length > 0;

  return (
    <div className="settings-white-wrapper">
      {/* КНОПКА НАЗАД */}
      <div className="settings-back-action" onClick={() => navigate(-1)}>
        <ChevronLeft size={16} strokeWidth={2} /> Назад
      </div>

      <div className="pl-top-bar"><h2>Создание контента</h2></div>

      <form onSubmit={handleUpload} className="studio-upload-grid" noValidate>

        <section className="settings-col-section">
          <h3>Информация о видео</h3>
          <div className="auth-body">

            {/* НАЗВАНИЕ ВИДЕО */}
            <div className="input-group">
              <label>Название видео</label>
              <input
                type="text"
                className="auth-input"
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, limits.title))}
                placeholder="Придумайте емкое название"
                required
              />
              <span className="char-counter">{title.length}/{limits.title}</span>
            </div>

            {/* ОПИСАНИЕ ВИДЕО */}
            <div className="input-group">
              <label>Описание видео</label>
              <textarea
                id="description"
                className="auth-input area"
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, limits.description))}
                placeholder="Расскажите зрителям, о чем ваш ролик"
              />
              <span className="char-counter">{description.length}/{limits.description}</span>
            </div>


            {/* КАТЕГОРИИ И ТЕГИ (ОБЯЗАТЕЛЬНО) */}
            <div className="input-group">
              <label>Теги категории (минимум 1, макс. 3)</label>
              <div className="tags-custom-select" ref={dropdownRef}>
                <div className={`select-input-wrapper ${isDropdownOpen ? 'focused' : ''}`}>
                  <div className="selected-chips-inline">
                    {selectedTags.map(tag => (
                      <span key={tag.id} className="mini-tag-chip">
                        {tag.name}
                        <button type="button" onClick={() => toggleTag(tag)}><X size={12} /></button>
                      </span>
                    ))}
                  </div>
                  {selectedTags.length < 3 && (
                    <input
                      type="text"
                      className="auth-input"
                      placeholder={selectedTags.length === 0 ? "Начните вводить для поиска тегов..." : ""}
                      value={tagSearch}
                      onFocus={() => setIsDropdownOpen(true)}
                      onChange={(e) => { setTagSearch(e.target.value); setIsDropdownOpen(true); }}
                    />
                  )}
                </div>
                {isDropdownOpen && filteredTags.length > 0 && (
                  <div className="tags-dropdown-list">
                    {filteredTags.map(tag => (
                      <div key={tag.id} className="dropdown-item" onClick={() => toggleTag(tag)}>
                        {tag.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ВЫБОР ВИДЕОФАЙЛА */}
            
            <div className="input-group">
              <h3>Видеофайл</h3>
              <label className={`studio-file-dropzone ${videoFile ? 'is-success' : ''}`}>
                <input
                  type="file"
                  accept=".mp4,.mov,.mkv"
                  onChange={(e) => handleFileChange(e, 'video')}
                  style={{ display: 'none' }}
                />
                <div className="dropzone-content-center">
                  <Video size={32} strokeWidth={1} className="dropzone-icon" />
                  <span className="studio-field-subtext">
                    {videoFile ? "Файл успешно выбран" : "Выберите файл на устройстве"}
                  </span>
                </div>
                {videoFile && (
                  <div className="studio-file-name-badge">
                    <span>{videoFile.name}</span>
                  </div>
                )}
              </label>
              <p className="studio-field-subtext" style={{ color: IS_PREMIUM ? '#00B341' : 'rgba(0,0,0,0.4)' }}>
                {IS_PREMIUM ? 'Premium аккаунт: лимит до 2 ГБ' : 'Базовый тариф: лимит файла до 100 МБ'}
              </p>
            </div>

            {/* ПРОГРЕСС БАР ЗАГРУЗКИ ФАЙЛА */}
            {isUploading && (
              <div className="upload-progress-container">
                <div className="progress-info">
                  <span>{uploadProgress < 100 ? `Загрузка пакета: ${uploadProgress}%` : 'Обработка медиа-потока сервером...'}</span>
                </div>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }}></div>
                </div>
              </div>
            )}

            {error && <p className="error-label" style={{ marginTop: '8px' }}>{error}</p>}

           

          </div>
        </section>

        <section className="settings-col-section">
          <h3>Превью</h3>
          <div className="auth-body">
            {/* ОБЛОЖКА ВИДЕО 16:9 С АВТО-КАДРИРОВАНИЕМ */}
            <div className="input-group">
              <label>Рекомендуем использовать формат 16:9</label>
              <div className="thumbnail-upload-container">
                {coverPreview ? (
                  <div className="studio-banner-preview-rectangle is-success" style={{ aspectRatio: '16 / 9' }}>
                    <img src={coverPreview} alt="Кадрированное превью обложки" />
                    <button
                      type="button"
                      className="change-cover-btn"
                      onClick={() => { setCoverFile(null); setCoverPreview(null); }}
                    >
                      Заменить фото
                    </button>
                  </div>
                ) : (
                  <label className="thumbnail-dropzone" style={{ margin: 0 }}>
                    <input type="file" accept=".jpg,.jpeg,.png" onChange={(e) => handleFileChange(e, 'thumb')} hidden />
                    <div className="dropzone-content-center">
                      <ImageIcon size={32} strokeWidth={1} className="dropzone-icon" />
                      <p className="studio-field-subtext">Загрузить изображение</p>
                    </div>
                  </label>
                )}
              </div>
              <p className="studio-field-subtext">Рекомендуется горизонтальное фото высокого разрешения. Система автоматически обрежет его под пропорции плеера.</p>
            </div>

             <button
              type="submit"
              className={`btn-auth ${isFormValid && !loading ? 'active' : ''}`}
              disabled={!isFormValid || loading}
            >
              {loading ? 'ПУБЛИКУЕМ...' : 'ОПУБЛИКОВАТЬ ВИДЕО'}
            </button>

          </div>
        </section>



        
      </form>
    </div>
  );
};

export default VideoUpload;