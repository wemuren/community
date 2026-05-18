import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import '../assets/styles/studio.css';
import '../assets/styles/auth.css'; // Для счетчиков и ошибок

const API_BASE_URL = 'http://localhost/projects/community/api';
const THUMB_URL = 'http://localhost/projects/community/api/uploads/thumbnails/';

const StudioEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const dropdownRef = useRef(null);

  // Данные видео
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Теги
  const [allTags, setAllTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagSearch, setTagSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Обложка
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  const limits = { title: 100, description: 1000 };

  // --- УНИВЕРСАЛЬНАЯ ОБРЕЗКА (Canvas API) ---
  const processImage = (file, targetWidth, targetHeight, callback) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');

        const imgRatio = img.width / img.height;
        const targetRatio = targetWidth / targetHeight;

        let sx = 0, sy = 0, sw = img.width, sh = img.height;

        if (imgRatio > targetRatio) {
          sw = img.height * targetRatio;
          sx = (img.width - sw) / 2;
        } else {
          sh = img.width / targetRatio;
          sy = (img.height - sh) / 2;
        }

        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);
        
        canvas.toBlob((blob) => {
          const croppedFile = new File([blob], file.name, { type: file.type });
          callback(croppedFile, URL.createObjectURL(croppedFile));
        }, file.type, 0.9);
      };
    };
  };

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
        setDescription(v.description);
        setSelectedTags(v.tags || []);
        setCoverPreview(`${THUMB_URL}${v.thumbnail}`);
      } catch (err) {
        alert("Видео не найдено или нет прав");
        navigate('/studio');
      }
    };
    fetchData();
  }, [id, user.id, navigate]);

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const ext = file.name.split('.').pop().toLowerCase();
      if (!['jpg', 'jpeg', 'png'].includes(ext)) {
        return setError('Только JPG, JPEG или PNG');
      }
      setError('');
      // Наша функция обрезки 16:9 (1280x720)
      processImage(file, 1280, 720, (blob, preview) => {
        setCoverFile(blob);
        setCoverPreview(preview);
      });
    }
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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('video_id', id);
    formData.append('user_id', user.id);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('tags', JSON.stringify(selectedTags.map(t => t.id)));
    if (coverFile) formData.append('thumbnail', coverFile);

    try {
      await axios.post(`${API_BASE_URL}/studio/update_video.php`, formData);
      alert("Изменения сохранены!");
      navigate('/studio');
    } catch (err) {
      setError("Ошибка при сохранении");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content-card studio-page">
      <h2 className="page-title">Настройки видео</h2>
      
      <form onSubmit={handleUpdate} className="admin-form">
        
        {/* НАЗВАНИЕ */}
        <div className="form-group" style={{position: 'relative'}}>
          <label>Название</label>
          <span className={`char-counter ${title.length >= limits.title ? 'limit' : ''}`}>
            {title.length}/{limits.title}
          </span>
          <input 
            type="text" 
            className="auth-input"
            value={title} 
            onChange={(e) => setTitle(e.target.value.slice(0, limits.title))} 
            required 
          />
        </div>

        {/* ОПИСАНИЕ */}
        <div className="form-group" style={{position: 'relative'}}>
          <label>Описание</label>
          <span className={`char-counter ${description.length >= limits.description ? 'limit' : ''}`}>
            {description.length}/{limits.description}
          </span>
          <input 
            className="auth-input" 
            style={{ minHeight: '120px', paddingTop: '10px' }}
            value={description} 
            onChange={(e) => setDescription(e.target.value.slice(0, limits.description))} 
          />
        </div>

        {/* ТЕГИ */}
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
                  type="text" 
                  value={tagSearch} 
                  onFocus={() => setIsDropdownOpen(true)}
                  onChange={(e) => {setTagSearch(e.target.value); setIsDropdownOpen(true)}}
                  placeholder={selectedTags.length === 0 ? "Добавить теги..." : ""}
                />
              )}
            </div>
            {isDropdownOpen && (
              <div className="tags-dropdown-list">
                {allTags
                  .filter(t => t.name.toLowerCase().includes(tagSearch.toLowerCase()))
                  .filter(t => !selectedTags.find(s => s.id === t.id))
                  .map(tag => (
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
        <label>Обложка видео (16:9)</label>
        <div className="cover-replace-container">
          <div className="cover-preview-main">
            {/* Показываем либо старую из базы, либо новую превьюшку */}
            <img src={coverPreview} alt="Превью" className="cover-img" />
            
            {/* Кнопка-оверлей поверх картинки */}
            <label className="cover-edit-label">
              <input 
                type="file" 
                accept=".jpg,.jpeg,.png" 
                onChange={handleCoverChange} 
                hidden 
              />
              <div className="edit-icon-circle">
                <span>📷 Заменить обложку</span>
              </div>
            </label>
          </div>
          <p className="sub-text">Новое фото будет автоматически обрезано под формат 16:9</p>
        </div>
      </div>

        {error && <p className="error-label">{error}</p>}

        <button type="submit" className="btn-create active" disabled={loading} style={{width: '100%', marginTop: '20px'}}>
          {loading ? 'СОХРАНЕНИЕ...' : 'СОХРАНИТЬ ИЗМЕНЕНИЯ'}
        </button>
      </form>
    </div>
  );
};

export default StudioEdit;