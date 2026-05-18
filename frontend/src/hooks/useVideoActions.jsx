import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://localhost/projects/community/api';

export const useVideoActions = (refreshCallback) => {
  const navigate = useNavigate();
  const authUser = JSON.parse(localStorage.getItem('user'));

  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  // Теперь храним массив ID, даже если видео одно
  const [activeVideo, setActiveVideo] = useState(null);
  const [selectedVideoIds, setSelectedVideoIds] = useState([]); 
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('');
  const [playlists, setPlaylists] = useState([]);

  const fetchMyPlaylists = async () => {
    if (!authUser) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/playlist/get_user_playlists.php?user_id=${authUser.id}&viewer_id=${authUser.id}`);
      
      if (res.data && res.data.playlists) {
        // Фильтруем: убираем системную историю из списка для выбора
        const filtered = res.data.playlists.filter(pl => pl.type !== 'history');
        setPlaylists(filtered);
      }
      
    } catch (err) { 
      console.error("Ошибка загрузки плейлистов:", err); 
    }
  };

  useEffect(() => { fetchMyPlaylists(); }, []);

  // Универсальное открытие: принимает либо ID, либо массив ID
  const openPlaylistModal = (e, ids) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!authUser) return alert("Войдите в аккаунт");
    
    const idsArray = Array.isArray(ids) ? ids : [ids];
    setSelectedVideoIds(idsArray);
    setShowPlaylistModal(true);
  };

  const handleDismissNotice = async (userId) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/user/clear_reset_flag.php`, { 
        user_id: userId 
      });
      if (res.data.status === 'success') {
        if (refreshCallback) refreshCallback(); // Обновляем профиль, чтобы плашка исчезла
      }
    } catch (err) { console.error("Ошибка при скрытии уведомления:", err); }
  };

  // Универсальное сохранение (циклом по массиву)
  // Внутри useVideoActions.js добавь/обнови функцию handleSaveToAny

const handleSaveToAny = async (playlist, sourcePlaylistId = null) => {
  if (selectedVideoIds.length === 0) return;
  
  try {
    // Если мы переносим видео из одного плейлиста в другой (bulk move)
    if (sourcePlaylistId && playlist.type === 'custom') {
      await axios.post(`${API_BASE_URL}/playlist/move_videos_bulk.php`, {
        source_id: sourcePlaylistId,
        target_id: playlist.id,
        video_ids: selectedVideoIds
      });
    } else {
      // Обычное добавление (как было раньше)
      const isSystem = playlist.type !== 'custom';
      const url = isSystem ? '/playlist/toggle_system_playlist.php' : '/playlist/add_to_playlist.php';

      const promises = selectedVideoIds.map(vid => {
        const body = isSystem 
          ? { user_id: authUser.id, video_id: vid, type: playlist.type }
          : { playlist_id: playlist.id, video_id: vid };
        return axios.post(`${API_BASE_URL}${url}`, body);
      });
      await Promise.all(promises);
    }
    
    setShowPlaylistModal(false);
    setSelectedVideoIds([]); 
    if (refreshCallback) refreshCallback();
    alert("Готово!");
  } catch (err) { 
    alert("Ошибка при операции с видео"); 
  }
};

  // Быстрое создание + массовое добавление
  const handleQuickCreate = async () => {
    if (!newPlaylistTitle.trim() || selectedVideoIds.length === 0) return;
    try {
      const res = await axios.post(`${API_BASE_URL}/playlist/create_playlist.php`, {
        user_id: authUser.id, title: newPlaylistTitle, is_private: 0
      });
      
      if (res.data.status === 'success') {
        const newPlId = res.data.playlist_id;
        
        const promises = selectedVideoIds.map(vid => 
          axios.post(`${API_BASE_URL}/playlist/add_to_playlist.php`, {
            playlist_id: newPlId, video_id: vid
          })
        );
        
        await Promise.all(promises);

        setNewPlaylistTitle('');
        setShowPlaylistModal(false);
        setSelectedVideoIds([]);
        if (refreshCallback) refreshCallback();
        fetchMyPlaylists();
      }
    } catch (err) { console.error(err); }
  };

  // Остальное без изменений...
  const handleToggleSystem = async (e, type, videoId) => {
    if (e) e.stopPropagation();
    if (!authUser) return alert("Войдите в аккаунт");
    try {
      await axios.post(`${API_BASE_URL}/playlist/toggle_system_playlist.php`, {
        user_id: authUser.id, video_id: videoId, type: type
      });
      if (refreshCallback) refreshCallback();
    } catch (err) { console.error(err); }
  };

  const handleReport = async (e, targetId, type) => {
    if (e) e.stopPropagation();
    const reason = window.prompt("Причина жалобы:");
    if (!reason) return;
    try {
      await axios.post(`${API_BASE_URL}/report/add_report.php`, {
        reporter_id: authUser?.id, target_id: targetId, target_type: type, reason: reason
      });
      alert("Жалоба отправлена");
    } catch (err) { console.error(err); }
  };

  const handleVideoClick = (video) => navigate(`/video/${video.id}`);

  return {
    showPlaylistModal, setShowPlaylistModal,
    playlists,
    activeVideo, setActiveVideo,
    newPlaylistTitle, setNewPlaylistTitle,
    openPlaylistModal, handleSaveToAny, handleQuickCreate, 
    handleToggleSystem, handleReport, handleVideoClick,
    handleDismissNotice,
    selectedVideoIds // прокидываем наружу на всякий случай
  };
};