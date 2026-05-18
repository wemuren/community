import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../assets/styles/studio.css';
import '../assets/styles/auth.css'; // Для счетчиков и ошибок

import { API_BASE_URL } from '@/config/api';

const VideoUpload = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const dropdownRef = useRef(null);

  // Состояния для полей и прогресса
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Состояния для ТЕГОВ
  const [allTags, setAllTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagSearch, setTagSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const limits = { title: 100, description: 1000 };
  const IS_PREMIUM = user && parseInt(user.is_paid) === 1;
  const MAX_SIZE_MB = IS_PREMIUM ? 2048 : 100;
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

  // --- ЛОГИКА ТЕГОВ ---
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/admin/manage_tags.php`);
        setAllTags(res.data);
      } catch (err) { console.error("Ошибка тегов:", err); }
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

  // --- ОБРЕЗКА ФОТО В КВАДРАТ ---
  // --- ЛОГИКА ОБРЕЗКИ ФОТО 16:9 ---
  const processImage = (file) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const targetWidth = 1280; // HD стандарт
        const targetHeight = 720;
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext('2d');

        // Вычисляем коэффициенты, чтобы вырезать центр без искажений
        const imgRatio = img.width / img.height;
        const targetRatio = targetWidth / targetHeight;

        let sourceX = 0, sourceY = 0, sourceWidth = img.width, sourceHeight = img.height;

        if (imgRatio > targetRatio) {
          // Исходник шире — режем бока
          sourceWidth = img.height * targetRatio;
          sourceX = (img.width - sourceWidth) / 2;
        } else {
          // Исходник выше — режем верх/низ
          sourceHeight = img.width / targetRatio;
          sourceY = (img.height - sourceHeight) / 2;
        }

        ctx.drawImage(
          img, 
          sourceX, sourceY, sourceWidth, sourceHeight, 
          0, 0, targetWidth, targetHeight
        );

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
      if (!['mp4', 'mov', 'mkv'].includes(ext)) return setError('Только MP4, MOV, MKV');
      if (file.size > MAX_SIZE_BYTES) return setError(`Лимит превышен. Доступно: ${MAX_SIZE_MB}МБ`);
      setVideoFile(file);
    } else {
      const ext = file.name.split('.').pop().toLowerCase();
      if (!['jpg', 'jpeg', 'png'].includes(ext)) return setError('Только JPG/PNG');
      processImage(file);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!videoFile || !coverFile || title.length < 3) return setError('Заполните данные');

    setLoading(true);
    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('video', videoFile);
    formData.append('thumbnail', coverFile);
    formData.append('user_id', user.id);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('tags', JSON.stringify(selectedTags.map(t => t.id)));

    try {
      await axios.post(`${API_BASE_URL}/video/upload.php`, formData, {
        onUploadProgress: (p) => setUploadProgress(Math.round((p.loaded * 100) / p.total))
      });
      navigate(`/profile/${user.id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Ошибка загрузки");
      setIsUploading(false);
    } finally { setLoading(false); }
  };

  return (
    <div className="content-card studio-page">
      <h2 className="page-title">Создание контента</h2>
      
      <form onSubmit={handleUpload} className="admin-form">
        <div className="form-group" style={{position:'relative'}}>
          <label>Название видео</label>
          <span className={`char-counter ${title.length >= limits.title ? 'limit' : ''}`}>
            {title.length}/{limits.title}
          </span>
          <input 
            type="text" className="auth-input" value={title} 
            onChange={(e) => setTitle(e.target.value.slice(0, limits.title))} required 
          />
        </div>

        <div className="form-group" style={{position:'relative'}}>
          <label>Описание</label>
          <span className={`char-counter ${description.length >= limits.description ? 'limit' : ''}`}>
            {description.length}/{limits.description}
          </span>
          <input 
            className="auth-input" style={{minHeight:'100px', paddingTop:'10px'}}
            value={description} onChange={(e) => setDescription(e.target.value.slice(0, limits.description))}
          />
        </div>

        {/* ВЫПАДАШКА ТЕГОВ */}
        <div className="form-group">
          <label>Теги (макс. 3)</label>
          <div className="tags-custom-select" ref={dropdownRef}>
            <div className={`select-input-wrapper ${isDropdownOpen ? 'focused' : ''}`}>
              <div className="selected-chips-inline">
                {selectedTags.map(tag => (
                  <span key={tag.id} className="mini-tag-chip">
                    {tag.name} <button type="button" onClick={() => toggleTag(tag)}>&times;</button>
                  </span>
                ))}
              </div>
              {selectedTags.length < 3 && (
                <input 
                  type="text" placeholder={selectedTags.length === 0 ? "Найти теги..." : ""}
                  value={tagSearch} onFocus={() => setIsDropdownOpen(true)}
                  onChange={(e) => { setTagSearch(e.target.value); setIsDropdownOpen(true); }}
                />
              )}
            </div>
            {isDropdownOpen && filteredTags.length > 0 && (
              <div className="tags-dropdown-list">
                {filteredTags.map(tag => (
                  <div key={tag.id} className="dropdown-item" onClick={() => toggleTag(tag)}>
                    <span className="plus-icon">+</span> {tag.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ОБЛОЖКА */}
        <div className="form-group">
          <label>Обложка</label>
          <div className="thumbnail-upload-container">
            {coverPreview ? (
              <div className="thumbnail-preview-wrapper square">
                <img src={coverPreview} alt="Превью" className="thumbnail-preview-img" />
                <button type="button" className="change-cover-btn" onClick={() => setCoverPreview(null)}>Заменить</button>
              </div>
            ) : (
              <label className="thumbnail-dropzone">
                <input type="file" accept=".jpg,.jpeg,.png" onChange={(e) => handleFileChange(e, 'thumb')} hidden />
                <div className="dropzone-content"><p>🖼️ Выберите фото</p></div>
              </label>
            )}
          </div>
        </div>

        {/* ВИДЕО */}
        <div className="form-group">
          <label>Файл (MP4, MOV, MKV)</label>
          <div className="file-upload-wrapper">
            <input type="file" accept=".mp4,.mov,.mkv" onChange={(e) => handleFileChange(e, 'video')} required />
          </div>
          <p className="sub-text" style={{color: IS_PREMIUM ? '#28a745' : '#888'}}>
            {IS_PREMIUM ? '💎 Premium: до 2ГБ' : '💡 Базовый: до 100МБ'}
          </p>
        </div>

        {/* PROGRESS BAR */}
        {isUploading && (
          <div className="upload-progress-container">
            <div className="progress-info">
              <span>{uploadProgress < 100 ? `Загрузка: ${uploadProgress}%` : 'Обработка...'}</span>
            </div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }}></div>
            </div>
          </div>
        )}

        {error && <p className="error-label">{error}</p>}

        <button type="submit" className={`btn-create ${!loading ? 'active' : ''}`} disabled={loading}>
          {loading ? 'ПОДОЖДИТЕ...' : 'ОПУБЛИКОВАТЬ'}
        </button>
      </form>
    </div>
  );
};

export default VideoUpload;