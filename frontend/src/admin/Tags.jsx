import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Folder, Eye, X, Plus } from 'lucide-react';
import '../assets/styles/admin.css';
import '../assets/styles/auth.css'; // База инпутов и кнопок

import { API_BASE_URL } from '@/config/api';

const Tags = () => {
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [filterQuery, setFilterQuery] = useState(''); 
  const authUser = JSON.parse(localStorage.getItem('user'));

  const fetchTags = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/manage_tags.php?sort=${sortBy}`);
      setTags(res.data);
    } catch (err) { console.error("Ошибка загрузки тегов:", err); }
  };

  useEffect(() => { fetchTags(); }, [sortBy]);

  const addTag = async (e) => {
    e.preventDefault();
    if (!newTag.trim()) return;
    try {
      await axios.post(`${API_BASE_URL}/admin/manage_tags.php`, {
        admin_id: authUser.id, name: newTag, action: 'add'
      });
      setNewTag('');
      fetchTags();
    } catch (err) { console.error("Ошибка добавления тега:", err); }
  };

  const deleteTag = async (id) => {
    if (!window.confirm("Удалить этот тег?")) return;
    try {
      await axios.post(`${API_BASE_URL}/admin/manage_tags.php`, {
        admin_id: authUser.id, id: id, action: 'delete'
      });
      fetchTags();
    } catch (err) { console.error("Ошибка удаления тега:", err); }
  };

  const filteredTags = tags.filter(t => 
    t.name.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="settings-white-wrapper">
      
      {/* ВЕРХНЯЯ СТРОКА: ЗАГЛОВАК И ЖЕСТКИЙ ПОИСК */}
      <div className="admin-toolbar-row">
        <div className="pl-top-bar">
          <h2>Теги видеоконтента</h2>
        </div>
        <div className="search-wrapper">
          <div className="search-icon"><Search size={16} color="var(--text-muted)" /></div>
          <input 
            type="text" 
            placeholder="Найти тег в списке..." 
            className="search-input"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
          />
        </div>
      </div>

      {/* ПАНЕЛЬ СОРТИРОВКИ */}
      <div className="admin-sort-toolbar">
        <span className="admin-stat-label">Сортировка:</span>
        <button className={`tag-btn ${sortBy === 'name' ? 'active' : ''}`} onClick={() => setSortBy('name')}>А-Я</button>
        <button className={`tag-btn ${sortBy === 'popular_views' ? 'active' : ''}`} onClick={() => setSortBy('popular_views')}>По просмотрам</button>
        <button className={`tag-btn ${sortBy === 'popular_videos' ? 'active' : ''}`} onClick={() => setSortBy('popular_videos')}>По количеству видео</button>
        <button className={`tag-btn ${sortBy === 'newest' ? 'active' : ''}`} onClick={() => setSortBy('newest')}>Сначала новые</button>
      </div>

      {/* ФОРМА СОЗДАНИЯ ТЕГА ПО СТИЛЮ AUTH-ИНПУТОВ */}
      <div className="admin-tag-creation-form-box">
        <form onSubmit={addTag} className="admin-tag-inline-form">
          <div className="input-group">
            <input 
              type="text" 
              placeholder="Название нового тега (без символа #)..." 
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              className="auth-input"
              required
            />
          </div>
          <button type="submit" className="tag-btn active">
            <Plus size={16} strokeWidth={2.5} style={{ marginRight: '6px' }} /> Добавить
          </button>
        </form>
      </div>

      {/* СТЕРИЛЬНАЯ СЕТКА АДМИН-ПИЛЛОВ */}
      <div className="admin-tags-pills-grid">
        {filteredTags.map(t => (
          <div key={t.id} className="admin-tag-pill-item">
             
             {/* Аналитическая группа данных тега */}
             <div className="tag-analytics-group">
                <div className="tag-stat-meta-badge" title="Количество видеороликов">
                  <Folder size={13} strokeWidth={2} />
                  <span>{t.video_count}</span>
                </div>
                <div className="tag-stat-meta-badge" title="Суммарные просмотры">
                  <Eye size={13} strokeWidth={2} />
                  <span>{t.total_views >= 1000 ? (t.total_views / 1000).toFixed(1) + 'k' : t.total_views}</span>
                </div>
             </div>

             {/* Имя самого тега */}
             <span className="tag-pill-name-text">#{t.name}</span>
             
             {/* Кнопка мгновенного удаления */}
             <button type="button" onClick={() => deleteTag(t.id)} className="tag-pill-delete-action-btn">
               <X size={14} strokeWidth={2.5} />
             </button>
          </div>
        ))}
        
        {filteredTags.length === 0 && (
          <p className="studio-field-subtext" style={{ fontSize: '15px', marginTop: '16px' }}>
            Ни одного подходящего тега не найдено.
          </p>
        )}
      </div>
    </div>
  );
};

export default Tags;