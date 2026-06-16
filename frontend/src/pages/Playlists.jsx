import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus } from 'lucide-react';
import '../assets/styles/playlist.css';
import '../assets/styles/modals.css';
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
    <div className="home-container playlists-page">
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
          <div className="pl-top-bar">
            <h2>Сохраненные коллекции</h2>
          </div>
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
          <div className="playlist-modal-content" onClick={e => e.stopPropagation()}>
            <div className="admin-header-flex" style={{ marginBottom: '20px' }}>
              <h3 className="page-title" style={{ fontSize: '20px' }}>Новый плейлист</h3>
              <button className="close-btn" onClick={() => setShowCreateModal(false)} style={{ fontSize: '24px' }}>&times;</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <input 
                type="text" 
                className="edit-input-field" 
                style={{ padding: '12px' }} 
                value={newTitle} 
                onChange={(e) => setNewTitle(e.target.value)} 
                placeholder="Название плейлиста" 
              />
              
              <label className="modal-checkbox-label">
                <input 
                  type="checkbox" 
                  checked={isPrivate} 
                  onChange={(e) => setIsPrivate(e.target.checked)} 
                /> 
                <span>Приватный плейлист</span>
              </label>
              
              <div className="modal-action-buttons">
                <button className="modal-btn-main" onClick={handleCreate}>Создать</button>
                <button className="modal-btn-sub" onClick={() => setShowCreateModal(false)}>Отмена</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* МОДАЛКА РЕДАКТИРОВАНИЯ И НАСТРОЕК */}
      {editingPlaylist && (
        <div className="admin-modal-overlay" onClick={() => setEditingPlaylist(null)}>
          <div className="playlist-modal-content" style={{ padding: '0', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '24px 24px 12px' }}>
              <div className="admin-header-flex" style={{ marginBottom: '20px' }}>
                <h3 className="page-title" style={{ fontSize: '20px' }}>Настройки</h3>
                <button className="close-btn" onClick={() => setEditingPlaylist(null)} style={{ fontSize: '24px' }}>&times;</button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <input 
                  type="text" 
                  className="edit-input-field"
                  style={{ padding: '12px' }}
                  value={editingPlaylist.title}
                  onChange={(e) => setEditingPlaylist({...editingPlaylist, title: e.target.value})}
                />
                
                <label className="modal-checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={editingPlaylist.is_private == 1}
                    onChange={(e) => setEditingPlaylist({...editingPlaylist, is_private: e.target.checked ? 1 : 0})} 
                  />
                  <span>Сделать приватным</span>
                </label>
                
                <div className="modal-action-buttons">
                  <button className="modal-btn-main" onClick={handleUpdate}>Сохранить</button>
                  <button className="modal-btn-sub" onClick={() => setEditingPlaylist(null)}>Отмена</button>
                </div>
              </div>
            </div>

            <div style={{ background: '#fff1f1', padding: '16px 24px', borderTop: '1px solid #ffe1e1', marginTop: '12px' }}>
               <button className="modal-btn-danger" onClick={() => setIsDeleteConfirm(editingPlaylist)}>Удалить плейлист</button>
            </div>
          </div>
        </div>
      )}

      {/* ПОДТВЕРЖДЕНИЕ УДАЛЕНИЯ */}
      {isDeleteConfirm && (
        <div className="admin-modal-overlay" style={{ zIndex: 1100 }} onClick={() => setIsDeleteConfirm(null)}>
          <div className="playlist-modal-content" style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <h3 className="page-title" style={{ fontSize: '18px', marginBottom: '8px', alignSelf: 'center' }}>Удалить плейлист?</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '0 0 24px 0', lineHeight: 1.4 }}>
              "{isDeleteConfirm.title}" исчезнет навсегда. Видео внутри плейлиста не удалятся.
            </p>
            <div className="modal-action-buttons" style={{ flexDirection: 'column', gap: '8px' }}>
               <button className="modal-btn-danger" style={{ width: '100%' }} onClick={handleDelete}>Да, удалить</button>
               <button className="modal-btn-sub" style={{ width: '100%' }} onClick={() => setIsDeleteConfirm(null)}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Playlists;