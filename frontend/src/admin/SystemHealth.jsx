import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../assets/styles/admin.css';

import { API_BASE_URL } from '@/config/api';

const SystemHealth = () => {
  const [health, setHealth] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const authUser = JSON.parse(localStorage.getItem('user'));

  // КНОПКА: ОБНОВИТЬ (GET запрос)
  const fetchHealth = async () => {
    setIsRefreshing(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/get_system_health.php?admin_id=${authUser.id}`);
      setHealth(res.data);
    } catch (err) { console.error("Ошибка обновления:", err); }
    finally { setIsRefreshing(false); }
  };

  // КНОПКА: ОЧИСТИТЬ (POST запрос)
  const clearLogs = async () => {
    if (!window.confirm("Вы уверены, что хотите полностью стереть логи?")) return;
    
    try {
      await axios.post(`${API_BASE_URL}/admin/get_system_health.php?admin_id=${authUser.id}`, {
        admin_id: authUser.id // Дублируем для POST body
      });
      // После очистки сразу запрашиваем пустые данные
      fetchHealth(); 
    } catch (err) { alert("Не удалось очистить логи"); }
  };

  useEffect(() => { fetchHealth(); }, []);

  if (!health) return <div className="admin-loader">Синхронизация...</div>;

  return (
    <div className="content-card">
      <div className="admin-header-flex">
        <h2 className="page-title">Состояние системы</h2>
        <div className="total-badge">Нагрузка: {health.total_weight}</div>
      </div>

      {/* STORAGE GRID */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="stat-card">
          <div className="stat-label">Видео</div>
          <div className="stat-value">{health.storage.videos}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Аватарки</div>
          <div className="stat-value">{health.storage.avatars}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Баннеры</div>
          <div className="stat-value">{health.storage.banners}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Обложки</div>
          <div className="stat-value">{health.storage.thumbs}</div>
        </div>
      </div>
      
      {/* LOGS SECTION */}
      <div className="logs-container" style={{ marginTop: '30px' }}>
        <div className="admin-header-flex">
          <h3 className="section-subtitle">Последние ошибки</h3>
          <div className="btn-group-row">
            <button 
              className={`btn-icon ${isRefreshing ? 'spin' : ''}`} 
              onClick={fetchHealth}
              title="Обновить данные"
            >
              🔄
            </button>
            <button 
              className="btn-icon danger" 
              onClick={clearLogs}
              title="Очистить файл логов"
            >
              🗑️
            </button>
          </div>
        </div>
        
        <div className="terminal-view">
          {health.logs.length > 0 ? (
            health.logs.map((log, index) => (
              <div key={index} className={`log-line ${log.toLowerCase().includes('error') ? 'error-txt' : ''}`}>
                {log}
              </div>
            ))
          ) : (
            <div className="log-line success">Лог-файл пуст. Ошибок не зафиксировано ✨</div>
          )}
        </div>
      </div>
    </div>
  );
};
export default SystemHealth;