import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../assets/styles/playlist.css';
import PlaylistCard from '../components/PlaylistCard';

const API_BASE_URL = 'http://localhost/projects/community/api';

const Playlists = () => {
  const [playlists, setPlaylists] = useState([]);
  const [savedPlaylists, setSavedPlaylists] = useState([]); // Стейт для сохраненных чужих плейлистов
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
        // Устанавливаем свои плейлисты
        setPlaylists(res.data.playlists || []);
        // Устанавливаем сохраненные чужие плейлисты
        setSavedPlaylists(res.data.saved_playlists || []);
      } 
    } catch (err) { 
      console.error("Ошибка загрузки плейлистов:", err); 
    }
  };

  useEffect(() => { 
    fetchPlaylists(); 
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
      {/* ВЕРХНЯЯ ПАНЕЛЬ */}
      <div className="pl-top-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2 className="section-title">Плейлисты</h2>
        <button className="btn-create-playlist-main" onClick={() => setShowCreateModal(true)}>
          + Создать плейлист
        </button>
      </div>

      {/* СЕКЦИЯ: МОИ ПЛЕЙЛИСТЫ */}
      <section>
        <div className="video-grid">
          {playlists.map(pl => (
            <PlaylistCard 
              key={pl.id} 
              playlist={pl} 
              authUser={authUser} 
              onEdit={(p) => setEditingPlaylist(p)} 
            />
          ))}
        </div>
        {playlists.length === 0 && <p className="sub-text">У вас пока нет плейлистов</p>}
      </section>

      {/* СЕКЦИЯ: СОХРАНЕННЫЕ КОЛЛЕКЦИИ (появляется только если они есть) */}
      {savedPlaylists.length > 0 && (
        <section style={{ marginTop: '60px', borderTop: '1px solid #eee', paddingTop: '40px' }}>
          <h2 className="section-title" style={{ marginBottom: '20px', fontSize: '1.2rem', color: '#888' }}>
            СОХРАНЕННЫЕ КОЛЛЕКЦИИ
          </h2>
          <div className="video-grid">
            {savedPlaylists.map(pl => (
              <PlaylistCard 
                key={pl.id} 
                playlist={pl} 
                authUser={authUser} 
                onEdit={null} // Запрещаем редактирование чужих плейлистов
              />
            ))}
          </div>
        </section>
      )}

      {/* МОДАЛКА СОЗДАНИЯ */}
      {showCreateModal && (
        <div className="video-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="video-modal-content" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <h2>Новый плейлист</h2>
            <input type="text" className="edit-input-field" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Название" />
            <label className="checkbox-label">
              <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} /> Приватный
            </label>
            <div className="modal-btns">
              <button className="btn-edit-profile" onClick={handleCreate}>Создать</button>
              <button className="btn-cancel" onClick={() => setShowCreateModal(false)}>Отмена</button>
            </div>
          </div>
        </div>
      )}

      {/* МОДАЛКА РЕДАКТИРОВАНИЯ */}
      {editingPlaylist && (
        <div className="video-modal-overlay" onClick={() => setEditingPlaylist(null)}>
          <div className="video-modal-content" style={{ maxWidth: '420px', padding: '0' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '25px' }}>
              <h2>Настройки плейлиста</h2>
              <input 
                type="text" 
                className="edit-input-field"
                value={editingPlaylist.title}
                onChange={(e) => setEditingPlaylist({...editingPlaylist, title: e.target.value})}
              />
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={editingPlaylist.is_private == 1} 
                  onChange={(e) => setEditingPlaylist({...editingPlaylist, is_private: e.target.checked ? 1 : 0})} 
                />
                Сделать приватным
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn-edit-profile" style={{ flex: 2 }} onClick={handleUpdate}>Сохранить</button>
                <button className="btn-cancel" style={{ flex: 1 }} onClick={() => setEditingPlaylist(null)}>Отмена</button>
              </div>
            </div>

            <div className="danger-zone" style={{ background: '#fff1f1', padding: '20px 25px', borderRadius: '0 0 15px 15px' }}>
               <button className="btn-delete-simple" onClick={() => setIsDeleteConfirm(editingPlaylist)}>Удалить плейлист</button>
            </div>
          </div>
        </div>
      )}

      {/* ПОДТВЕРЖДЕНИЕ УДАЛЕНИЯ */}
      {isDeleteConfirm && (
        <div className="video-modal-overlay" style={{ zIndex: 1100 }} onClick={() => setIsDeleteConfirm(null)}>
          <div className="video-modal-content" style={{ maxWidth: '350px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <h3>Удалить плейлист?</h3>
            <p className="sub-text">"{isDeleteConfirm.title}" исчезнет навсегда.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
               <button className="btn-delete-confirm" onClick={handleDelete}>Да, удалить</button>
               <button className="btn-cancel" onClick={() => setIsDeleteConfirm(null)}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Playlists;