import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  // В будущем тут будет проверка JWT-токена или запрос к PHP.
  // Пока сделаем простую проверку через localStorage.
  const isAuthenticated = localStorage.getItem('isLoggedIn') === 'true';

  // Если не залогинен — редирект на регистрацию или логин
  if (!isAuthenticated) {
    return <Navigate to="/landing" replace />;
  }

  // Если всё ок — показываем дочерние элементы (Outlet)
  return <Outlet />;
};

export default ProtectedRoute;