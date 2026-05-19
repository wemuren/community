import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus } from 'lucide-react';
import '../assets/styles/playlist.css';
import '../assets/styles/video-card.css'; // Переиспользуем .video-grid отсюда
import PlaylistCard from '../components/PlaylistCard';

import { API_BASE_URL } from '@/config/api';

const Playlists = () => {
  const [playlists, setPlaylists] = useState([]);
  const [savedPlaylists, setSavedPlaylists] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState(null);
  const [isDeleteConfirm, setIsDeleteConfirm] = useState(null);

  const [newTitle, setNewTitle] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  
  const authUser = JSON.parse(localStorage.getItem('user'));

  const fetchPlaylists = async () => {
    if (!authUser) return;
    try {
      const res = await axios.get(
        `${API_BASE_URL}/playlist/get_user_playlists.php?user_id=${authUser.id}&viewer_id=${authUser.id}`
      );
      if (res.data.status === 'success') {
        setPlaylists(res.data.playlists || []);
        setSavedPlaylists(res.data.saved_playlists || []);
      } 
    } catch (err) { 
      console.error("Ошибка загрузки плейлистов:", err);
    }
  };

  useEffect(() => { 
    fetchPlaylists(); // eslint-disable-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async () => {
    if (!newTitle.trim()) return alert("Введите название");
    try {
      const res = await axios.post(`${API_BASE_URL}/playlist/create_playlist.php`, {
        user_id: authUser.id,
        title: newTitle,
        is_private: isPrivate ? 1 : 0
      });
      if (res.data.status === 'success') {
        setShowCreateModal(false);
        setNewTitle('');
        setIsPrivate(false);
        fetchPlaylists();
      }
    } catch (err) { console.error(err); }
  };

  const handleUpdate = async () => {
    try {
      const res = await axios.post(`${API_BASE_URL}/playlist/update_playlist.php`, editingPlaylist);
      if (res.data.status === 'success') {
        setEditingPlaylist(null);
        fetchPlaylists();
      }
    } catch (err) { console.error(err); }
  };

  const handleDelete = async () => {
    try {
      await axios.post(`${API_BASE_URL}/playlist/delete_playlist.php`, { id: isDeleteConfirm.id });
      setIsDeleteConfirm(null);
      setEditingPlaylist(null);
      fetchPlaylists();
    } catch (err) { console.error(err); }
  };


  return (
    <div className="home-container">
      {/* ВЕРХНЯЯ ПАНЕЛЬ С СИСТЕМНОЙ ИКОНКОЙ PLUS */}
      <div className="pl-top-bar">
        <h2>Плейлисты</h2>
        <button className="btn-create-playlist-main" onClick={() => setShowCreateModal(true)}>
          <Plus size={16} strokeWidth={2} /> Создать плейлист
        </button>
      </div>

      {/* СЕКЦИЯ: МОИ ПЛЕЙЛИСТЫ */}
      <section style={{ marginBottom: '40px' }}>
        <div className="video-grid">
          {playlists.map(pl => (
            <PlaylistCard 
              key={pl.id} 
              playlist={pl} 
              authUser={authUser} 
              onEdit={(p) => setEditingPlaylist(p)} 
              onDeleteClick={(p) => setIsDeleteConfirm(p)}
              fetchPlaylists={fetchPlaylists} /* ИСПРАВЛЕНО: передаем функцию обновления списков */
            />
          ))}
        </div>
        {playlists.length === 0 && <p className="sub-text" style={{ color: 'var(--text-muted)' }}>У вас пока нет плейлистов</p>}
      </section>

      {/* СЕКЦИЯ: СОХРАНЕННЫЕ КОЛЛЕКЦИИ */}
      {savedPlaylists.length > 0 && (
        <section style={{ marginTop: '60px', borderTop: '2px solid var(--bg-main)', paddingTop: '40px' }}>
          <h2 className="section-title" style={{ marginBottom: '24px', fontSize: '16px', color: 'var(--text-muted)' }}>
            СОХРАНЕННЫЕ КОЛЛЕКЦИИ
          </h2>
          <div className="video-grid">
            {savedPlaylists.map(pl => (
              <PlaylistCard 
                key={pl.id} 
                playlist={pl} 
                authUser={authUser} 
                onEdit={null} 
                onDeleteClick={null}
                fetchPlaylists={fetchPlaylists} /* ИСПРАВЛЕНО: передаем функцию обновления списков */
              />
            ))}
          </div>
        </section>
      )}

      {/* МОДАЛКА СОЗДАНИЯ */}
      {showCreateModal && (
        <div className="admin-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="admin-user-card small-modal" onClick={e => e.stopPropagation()}>
            <div className="card-header">
              <h3 className="page-title" style={{ fontSize: '20px' }}>Новый плейлист</h3>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>&times;</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
              <input type="text" className="edit-input-field" style={{ padding: '12px' }} value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Название" />
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} /> Приватный плейлист
              </label>
              <div className="quick-actions-bar" style={{ marginTop: '12px' }}>
                <button className="btn-action" style={{ background: 'var(--primary-red)', color: '#fff', border: 'none' }} onClick={handleCreate}>Создать</button>
                <button className="btn-action" onClick={() => setShowCreateModal(false)}>Отмена</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* МОДАЛКА РЕДАКТИРОВАНИЯ И НАСТРОЕК */}
      {editingPlaylist && (
        <div className="admin-modal-overlay" onClick={() => setEditingPlaylist(null)}>
          <div className="admin-user-card" style={{ maxWidth: '420px', padding: '0' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '24px' }}>
              <div className="card-header" style={{ marginBottom: '16px' }}>
                <h3 className="page-title" style={{ fontSize: '20px' }}>Настройки плейлиста</h3>
                <button className="close-btn" onClick={() => setEditingPlaylist(null)}>&times;</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <input 
                  type="text" 
                  className="edit-input-field"
                  style={{ padding: '12px' }}
                  value={editingPlaylist.title}
                  onChange={(e) => setEditingPlaylist({...editingPlaylist, title: e.target.value})}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={editingPlaylist.is_private == 1}
                    onChange={(e) => setEditingPlaylist({...editingPlaylist, is_private: e.target.checked ? 1 : 0})} 
                  />
                  Сделать приватным
                </label>
                <div className="quick-actions-bar">
                  <button className="btn-action" style={{ background: 'var(--primary-red)', color: '#fff', border: 'none' }} onClick={handleUpdate}>Сохранить</button>
                  <button className="btn-action" onClick={() => setEditingPlaylist(null)}>Отмена</button>
                </div>
              </div>
            </div>

            <div style={{ background: '#fff1f1', padding: '16px 24px', borderRadius: '0 0 24px 24px', borderTop: '1px solid #ffe1e1', textAlign: 'right' }}>
               <button className="btn-action danger" style={{ width: '100%' }} onClick={() => setIsDeleteConfirm(editingPlaylist)}>Удалить плейлист</button>
            </div>
          </div>
        </div>
      )}

      {/* ПОДТВЕРЖДЕНИЕ УДАЛЕНИЯ */}
      {isDeleteConfirm && (
        <div className="admin-modal-overlay" style={{ zIndex: 1100 }} onClick={() => setIsDeleteConfirm(null)}>
          <div className="admin-user-card" style={{ maxWidth: '360px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <h3 className="page-title" style={{ fontSize: '18px', marginBottom: '8px' }}>Удалить плейлист?</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>"{isDeleteConfirm.title}" исчезнет навсегда.</p>
            <div className="quick-actions-bar" style={{ marginTop: '24px' }}>
               <button className="btn-action danger" onClick={handleDelete}>Да, удалить</button>
               <button className="btn-action" onClick={() => setIsDeleteConfirm(null)}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Playlists;