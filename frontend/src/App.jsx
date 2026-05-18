import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Register from './auth/reg/Register';
import Login from './auth/log/Login';
import ForgotPassword from './auth/ForgotPassword';
import Home from './pages/Home';
import User_cabinet from './pages/User_cabinet';
import VideoUpload from './pages/VideoUpload';
import ProtectedRoute from './components/ProtectedRoute';
import UserAvatar from './components/UserAvatar';
import Subscriptions from './pages/Subscriptions';
import Playlists from './pages/Playlists';
import PlaylistDetail from './pages/PlaylistDetail';
import Settings from './pages/Settings';
import AdminLayout from './admin/AdminLayout';
import AdminDashboard from './admin/AdminDashboard';
import Channels from './admin/Channels';
import Reports from './admin/Reports';
import Tags from './admin/Tags';
import Monetization from './admin/Monetization';
import Premium from './pages/Premium';
import SystemHealth from './admin/SystemHealth';
import StudioLayout from './studio/StudioLayout';
import StudioProfile from './studio/StudioProfile';
import StudioVideos from './studio/StudioVideos';
import StudioDashboard from './studio/StudioDashboard';
import StudioEdit from './studio/StudioEdit';
import VideoCard from './components/VideoCard';
import PlaylistCard from './components/PlaylistCard';
import VideoModals from './components/VideoModals';
import { useVideoActions } from './hooks/useVideoActions';
import SearchResults from './pages/SearchResults';
import VideoPage from './pages/VideoPage';
import AdminUserModal from './admin/components/AdminUserModal';
import NotFound from './pages/NotFound';
import Landing from './auth/Landing';

import Terms from './pages/Terms';
import Privacy from './pages/Privacy';

const AdminRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user || Number(user.is_admin) !== 1) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* 1. ПУБЛИЧНЫЕ СТРАНИЦЫ */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="*" element={<NotFound />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/landing" element={<Landing />} />

        {/* 2. ЗОНА ВИДЕОПЛАТФОРМЫ (с обычным сайдбаром) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="subs" element={<Subscriptions />} />
            <Route path="playlists" element={<Playlists />} />
            <Route path="playlists/:id" element={<PlaylistDetail />} />
            <Route path="profile/:id" element={<User_cabinet />} />
            <Route path="upload" element={<VideoUpload />} />
            <Route path="settings" element={<Settings />} />
            <Route path="premium" element={<Premium />} />
            <Route path="search" element={<SearchResults />} />
            <Route path="video/:id" element={<VideoPage />} />
          </Route>
        </Route>

        {/* 3. ЗОНА АДМИНКИ (отдельный Layout, без лишних сайдбаров) */}
        <Route 
          path="/admin" 
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="channels" element={<Channels />} />
          <Route path="reports" element={<Reports />} />
          <Route path="tags" element={<Tags />} />
          <Route path="monetization" element={<Monetization />} />
          <Route path="health" element={<SystemHealth />} />
        </Route>

        {/* ГРУППА СТУДИИ */}
        <Route path="/studio" element={<StudioLayout />}>
          <Route index element={<StudioDashboard />} />
          <Route path="profile" element={<StudioProfile />} />
          <Route path="upload" element={<VideoUpload />} />
          <Route path="video" element={<StudioVideos />} />
          <Route path="edit/:id" element={<StudioEdit />} />
          <Route path="dashboard" element={<StudioDashboard />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;