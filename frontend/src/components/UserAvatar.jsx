import React from 'react';

// Выносим палитру и логику цвета наружу, чтобы не пересоздавать при каждом рендере
const getAvatarStyle = (username) => {
  const colors = [
    '#FF5733', '#26cb44', '#3357FF', '#F333FF', 
    '#FF33A1', '#33e4db', '#FF8333', '#8333FF',
    '#C20000', '#2ecc71', '#3498db', '#9b59b6'
  ];
  const name = username || "User";
  const charSum = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return colors[charSum % colors.length];
};

const UserAvatar = ({ user, sizeClass }) => {
  
  // 1. Умная проверка: есть ли реальный файл аватарки
  const hasAvatar = user?.avatar && 
                    user.avatar.trim() !== "" && 
                    user.avatar !== "null" && 
                    user.avatar !== "default.png" && // Игнорируем заглушку из базы
                    user.avatar !== null;

  // 2. Если аватарка — это реальный файл, выводим изображение
  if (hasAvatar) {
    return (
      <div className={sizeClass}>
        <img 
          src={`http://localhost/projects/community/api/uploads/avatars/${user.avatar}`} 
          alt="" 
          onError={(e) => { e.target.style.display = 'none'; }} // На случай, если файл удален с сервера
        />
      </div>
    );
  }

  // 3. Если аватарки нет (или там default.png) — рисуем круг с буквами
  const firstLetter = user?.full_name 
    ? user.full_name.charAt(0) 
    : (user?.username?.charAt(0) || '?');

  const bgColor = getAvatarStyle(user?.username);

  return (
    <div 
      className={`${sizeClass} avatar-initials`} 
      style={{ 
        backgroundColor: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        userSelect: 'none'
      }}
    >
      {firstLetter}
    </div>
  );
};

export default UserAvatar;