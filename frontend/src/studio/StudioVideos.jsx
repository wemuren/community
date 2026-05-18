import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../assets/styles/admin.css'; 

const API_BASE_URL = 'http://localhost/projects/community/api';
const THUMB_URL = 'http://localhost/projects/community/api/uploads/thumbnails/';

const StudioVideos = () => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const authUser = JSON.parse(localStorage.getItem('user'));

  const fetchMyVideos = async () => {
    if (!authUser?.id) return;
    try {
      // Идем в студийный эндпоинт, а не в админский
      const res = await axios.get(`${API_BASE_URL}/studio/get_videos.php?user_id=${authUser.id}`);
      setVideos(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Ошибка Студии:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMyVideos(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Удалить видео навсегда?")) return;
    try {
      await axios.post(`${API_BASE_URL}/studio/delete_video.php`, {
        user_id: authUser.id,
        video_id: id
      });
      fetchMyVideos();
    } catch (err) { 
      alert("Ошибка при удалении"); 
    }
  };

  if (loading) return <div className="admin-loader">Загрузка Студии...</div>;

  return (
    <div className="studio-container">
      <h2 className="page-title">МОЯ СТУДИЯ</h2>

      <div className="studio-video-grid">
        {videos.map(v => (
          <div key={v.id} className="studio-video-card">
            <div className="studio-thumb-wrapper">
              <img src={`${THUMB_URL}${v.thumbnail}`} alt="" />
              
              <div className="studio-video-overlay">
                <button 
                  className="edit-btn" 
                  onClick={() => navigate(`/studio/edit/${v.id}`)} 
                  title="Редактировать"
                >
                  ✏️
                </button>
                <button 
                  className="delete-btn" 
                  onClick={() => handleDelete(v.id)}
                  title="Удалить"
                >
                  🗑️
                </button>
              </div>
            </div>

            <div className="studio-video-meta">
              <span className="studio-video-title">{v.title}</span>
              
              <div className="studio-stats-row">
                <div className="stat-item">👁️ {v.views}</div>
                <div className="stat-item">❤️ {v.likes_count}</div>
                <div className="stat-item">💾 {v.saves_count}</div>
              </div>
            </div>
          </div>
        ))}
        
        {videos.length === 0 && <p className="empty-txt">У вас пока нет загруженных видео.</p>}
      </div>
    </div>
  );
};

export default StudioVideos;