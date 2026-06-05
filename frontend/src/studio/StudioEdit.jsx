import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Image as ImageIcon, X } from 'lucide-react';
import '../assets/styles/studio.css';
import '../assets/styles/settings.css';
import '../assets/styles/auth.css'; // Базовые инпуты, счетчики и кнопки

import { API_BASE_URL, THUMB_URL } from '@/config/api';

const StudioEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const dropdownRef = useRef(null);

  // Основные стейты данных видео
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Стейты управления тегами
  const [allTags, setAllTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagSearch, setTagSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Стейты файлов и предпросмотра обложки
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  const limits = { title: 100, description: 1000 };

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

  // Первоначальный сбор данных из API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tagsRes, videoRes] = await axios.all([
          axios.get(`${API_BASE_URL}/admin/manage_tags.php`),
          axios.get(`${API_BASE_URL}/studio/get_video_details.php?id=${id}&user_id=${user.id}`)
        ]);
        setAllTags(tagsRes.data);
        
        const v = videoRes.data;
        setTitle(v.title);
        setDescription(v.description || '');
        setSelectedTags(v.tags || []);
        setCoverPreview(`${THUMB_URL}${v.thumbnail}`);
      } catch (err) {
        alert("Видео не найдено или у вас недостаточно прав");
        navigate('/studio');
      }
    };
    if (id && user?.id) fetchData();
  }, [id, user?.id, navigate]);

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['jpg', 'jpeg', 'png'].includes(ext)) {
      return setError('Разрешены только графические форматы JPG, JPEG, PNG');
    }
    setError('');
    processImage(file);
  };

  const toggleTag = (tag) => {
    if (selectedTags.find(s => s.id === tag.id)) {
      setSelectedTags(prev => prev.filter(t => t.id !== tag.id));
    } else {
      if (selectedTags.length >= 3) return;
      setSelectedTags(prev => [...prev, tag]);
      setTagSearch('');
    }
  };

  const filteredTags = allTags.filter(tag =>
    tag.name.toLowerCase().includes(tagSearch.toLowerCase()) &&
    !selectedTags.find(s => s.id === tag.id)
  );

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (title.trim().length < 3 || selectedTags.length === 0 || loading) {
      return setError('Заполните обязательные поля и выберите минимум один тег');
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('video_id', id);
    formData.append('user_id', user.id);
    formData.append('title', title.trim());
    formData.append('description', description.trim());
    formData.append('tags', JSON.stringify(selectedTags.map(t => t.id)));
    if (coverFile) formData.append('thumbnail', coverFile);

    try {
      await axios.post(`${API_BASE_URL}/studio/update_video.php`, formData);
      alert("Изменения успешно сохранены!");
      navigate('/studio');
    } catch (err) {
      setError(err.response?.data?.message || "Ошибка при сохранении изменений");
    } finally {
      setLoading(false);
    }
  };

  // Валидация: название от 3 символов и теги ОБЯЗАТЕЛЬНО (хотя бы 1)
  const isFormValid = title.trim().length >= 3 && selectedTags.length > 0;

  return (
    <div className="settings-white-wrapper">
      {/* КНОПКА НАЗАД */}
      <div className="settings-back-action" onClick={() => navigate(-1)}>
        <ChevronLeft size={16} strokeWidth={2} /> Назад
      </div>

      <div className="pl-top-bar"><h2>Настройки видео</h2></div>

      <form onSubmit={handleUpdate} className="studio-upload-grid" noValidate>

        {/* ЛЕВАЯ КОЛОНКА: ТЕКСТОВЫЕ МЕТАДАННЫЕ */}
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
              <label>Теги категории (минимум 1, макс. 3) *</label>
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

            {error && <p className="error-label" style={{ marginTop: '8px' }}>{error}</p>}

          </div>
        </section>

        {/* ПРАВАЯ КОЛОНКА: ОБЛОЖКА И КНОПКА СХРАНЕНИЯ */}
        <section className="settings-col-section">
          <h3>Превью</h3>
          <div className="auth-body">
            
            {/* ОБЛОЖКА ВИДЕО 16:9 */}
            <div className="input-group">
              <label>Обложка видео (Формат 16:9)</label>
              <div className="thumbnail-upload-container" style={{ margin: 0 }}>
                {coverPreview ? (
                  <div className="studio-banner-preview-rectangle is-success" style={{ aspectRatio: '16 / 9' }}>
                    <img src={coverPreview} alt="Превью обложки ролика" />
                    <label className="change-cover-btn">
                      Заменить фото
                      <input type="file" accept=".jpg,.jpeg,.png" onChange={handleCoverChange} hidden />
                    </label>
                  </div>
                ) : (
                  <label className="thumbnail-dropzone" style={{ margin: 0 }}>
                    <input type="file" accept=".jpg,.jpeg,.png" onChange={handleCoverChange} hidden />
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
              style={{ marginTop: '16px' }}
            >
              {loading ? 'СОХРАНЯЕМ...' : 'СОХРАНИТЬ ИЗМЕНЕНИЯ'}
            </button>

          </div>
        </section>

      </form>
    </div>
  );
};

export default StudioEdit;