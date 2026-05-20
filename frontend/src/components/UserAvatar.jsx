import React from 'react';
import { AVATAR_URL } from '@/config/api';
import '../assets/styles/avatar.css';

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
  
  const hasAvatar = user?.avatar && 
                    user.avatar.trim() !== "" && 
                    user.avatar !== "null" && 
                    user.avatar !== "default.png" && 
                    user.avatar !== null;

  if (hasAvatar) {
    return (
      <div className={`avatar-base ${sizeClass}`}>
        <img 
          src={`${AVATAR_URL}${user.avatar}`} 
          alt="" 
          onError={(e) => { e.target.style.display = 'none'; }} 
        />
      </div>
    );
  }

  const firstLetter = user?.full_name 
    ? user.full_name.charAt(0) 
    : (user?.username?.charAt(0) || '?');

  const bgColor = getAvatarStyle(user?.username);

  return (
    <div 
      className={`avatar-base avatar-initials ${sizeClass}`} 
      style={{ backgroundColor: bgColor }} // Оставляем только динамический фоновый цвет
    >
      <span>{firstLetter}</span>
    </div>
  );
};

export default UserAvatar;