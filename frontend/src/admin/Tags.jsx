import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../assets/styles/admin.css';

const API_BASE_URL = 'http://localhost/projects/community/api';

const Tags = () => {
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [filterQuery, setFilterQuery] = useState(''); // Для поиска по тегам
  const authUser = JSON.parse(localStorage.getItem('user'));

  const fetchTags = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/manage_tags.php?sort=${sortBy}`);
      setTags(res.data);
    } catch (err) { console.error(err); }
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
    } catch (err) { console.error(err); }
  };

  const deleteTag = async (id) => {
    if (!window.confirm("Удалить этот тег?")) return;
    await axios.post(`${API_BASE_URL}/admin/manage_tags.php`, {
      admin_id: authUser.id, id: id, action: 'delete'
    });
    fetchTags();
  };

  // Мгновенная фильтрация списка тегов
  const filteredTags = tags.filter(t => 
    t.name.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <>
      <div className="admin-header-flex">
        <h2 className="page-title">ТЕГИ ВИДЕО</h2>
        <input 
          type="text" 
          placeholder="Найти тег..." 
          className="admin-search-input"
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          style={{ width: '250px' }}
        />
      </div>

      <div className="sort-toolbar" style={{ marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        <span style={{ fontSize: '11px', fontWeight: 800, color: '#888', alignSelf: 'center' }}>СОРТИРОВКА:</span>
        <button className={`tag-btn ${sortBy === 'name' ? 'active' : ''}`} onClick={() => setSortBy('name')}>А-Я</button>
        <button className={`tag-btn ${sortBy === 'popular_views' ? 'active' : ''}`} onClick={() => setSortBy('popular_views')}>По просмотрам</button>
        <button className={`tag-btn ${sortBy === 'popular_videos' ? 'active' : ''}`} onClick={() => setSortBy('popular_videos')}>По количеству видео</button>
        <button className={`tag-btn ${sortBy === 'newest' ? 'active' : ''}`} onClick={() => setSortBy('newest')}>Сначала новые</button>
      </div>

      <div className="admin-form" style={{ marginBottom: '40px', maxWidth: '100%' }}>
        <form onSubmit={addTag} style={{ display: 'flex', gap: '12px' }}>
          <input 
            type="text" 
            placeholder="Название нового тега..." 
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            className="admin-search-input"
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn-create">Добавить тег</button>
        </form>
      </div>

      <div className="tags-grid">
        {filteredTags.map(t => (
          <div key={t.id} className="admin-tag-pill">
             <div className="tag-stats-group">
                <span className="video-count-badge" title="Количество видео">📁 {t.video_count}</span>
                <span className="video-count-badge view-badge" title="Всего просмотров">👁️ {t.total_views}</span>
             </div>
             <span className="tag-name-text">{t.name}</span>
             <button onClick={() => deleteTag(t.id)} className="tag-delete-btn">&times;</button>
          </div>
        ))}
      </div>
    </>
  );
};

export default Tags;