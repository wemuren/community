import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, RefreshCw, Trash, HardDrive, User, Image as ImageIcon, Video, Terminal } from 'lucide-react';
import '../assets/styles/admin.css'; // Наша основная админ-система
import '../assets/styles/auth.css'; 

import { API_BASE_URL } from '@/config/api';

const SystemHealth = () => {
  const navigate = useNavigate();
  const [health, setHealth] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const authUser = JSON.parse(localStorage.getItem('user'));

  const fetchHealth = async () => {
    setIsRefreshing(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/get_system_health.php?admin_id=${authUser.id}`);
      setHealth(res.data);
    } catch (err) { 
      console.error("Ошибка обновления состояния системы:", err); 
    } finally { 
      setIsRefreshing(false); 
    }
  };

  const clearLogs = async () => {
    if (!window.confirm("Вы уверены, что хотите полностью стереть логи сервера?")) return;
    try {
      await axios.post(`${API_BASE_URL}/admin/get_system_health.php?admin_id=${authUser.id}`, {
        admin_id: authUser.id
      });
      fetchHealth(); 
    } catch (err) { 
      alert("Не удалось очистить лог-файл"); 
    }
  };

  useEffect(() => { 
    if (authUser?.id) fetchHealth(); 
  }, [authUser?.id]);

  if (!health) return <div className="admin-loader">Синхронизация данных...</div>;

  return (
    <div className="settings-white-wrapper">

      <div className="pl-top-bar">
        <h2>Состояние системы</h2>
        <div className="admin-wire-tag" style={{ background: 'var(--bg-card)', padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}>
          Общая нагрузка: {health.total_weight}
        </div>
      </div>

      {/* РОДНАЯ СЕТКА АДМИНКИ ДЛЯ КАРТОЧЕК ХРАНИЛИЩА */}
      <div className="admin-stats-grid">
        
        <div className="admin-stat-card">
          <div className="admin-stat-card-header">
            <span className="admin-stat-label">Видео</span>
            <Video size={16} strokeWidth={2} className="admin-stat-icon-views" />
          </div>
          <h2 className="admin-stat-value">{health.storage.videos}</h2>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card-header">
            <span className="admin-stat-label">Аватарки</span>
            <User size={16} strokeWidth={2} className="admin-stat-icon-subs" />
          </div>
          <h2 className="admin-stat-value">{health.storage.avatars}</h2>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card-header">
            <span className="admin-stat-label">Баннеры каналов</span>
            <ImageIcon size={16} strokeWidth={2} className="admin-stat-icon-comments" />
          </div>
          <h2 className="admin-stat-value">{health.storage.banners}</h2>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card-header">
            <span className="admin-stat-label">Обложки (16:9)</span>
            <HardDrive size={16} strokeWidth={2} className="admin-stat-icon-comments" />
          </div>
          <h2 className="admin-stat-value">{health.storage.thumbs}</h2>
        </div>

      </div>
      
      {/* СВЕТЛЫЙ ИНДАСТРИАЛ-ТЕРМИНАЛ ОШИБОК */}
      <div className="system-logs-layout-block">
        <div className="system-logs-toolbar-header">
          <div className="system-logs-title-flex">
            <h3>Последние ошибки сервера</h3>
          </div>
          
          <div className="admin-col-actions" style={{ width: 'auto' }}>
            <button 
              type="button"
              className={`tag-btn ${isRefreshing ? 'is-spinning-action' : ''}`} 
              onClick={fetchHealth}
              title="Обновить данные логов"
              style={{ padding: '8px 12px' }}
            >
              <RefreshCw size={14} strokeWidth={2.5} />
            </button>
            <button 
              type="button"
              className="admin-action-btn-circle ban-toggle banned" 
              onClick={clearLogs}
              title="Очистить файл логов навсегда"
              style={{ width: '32px', height: '32px' }}
            >
              <Trash size={14} strokeWidth={2} />
            </button>
          </div>
        </div>
        
        {/* СВЕТЛЫЙ ВЬЮПОРТ ЛОГОВ */}
        <div className="system-light-terminal-viewport">
          {health.logs.length > 0 ? (
            health.logs.map((log, index) => (
              <div 
                key={index} 
                className={`terminal-light-log-line ${log.toLowerCase().includes('error') ? 'is-light-critical-error' : ''}`}
              >
                <span className="terminal-light-line-counter">{(index + 1).toString().padStart(2, '0')}</span>
                <p className="terminal-light-line-text">{log}</p>
              </div>
            ))
          ) : (
            <div className="terminal-light-empty-state">
              <span>Системный лог-файл пуст. Ошибок ядра не зафиксировано ✨</span>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default SystemHealth;