import React, { useState } from 'react';

// Color palettes deterministically picked based on string hash
const AVATAR_PALETTES = [
  'from-cyan-600 to-blue-600 text-cyan-50 border-cyan-400/40',
  'from-emerald-600 to-teal-600 text-emerald-50 border-emerald-400/40',
  'from-indigo-600 to-violet-600 text-indigo-50 border-indigo-400/40',
  'from-amber-600 to-orange-600 text-amber-50 border-amber-400/40',
  'from-rose-600 to-pink-600 text-rose-50 border-rose-400/40',
  'from-sky-600 to-cyan-600 text-sky-50 border-sky-400/40',
  'from-purple-600 to-fuchsia-600 text-purple-50 border-purple-400/40',
];

const getInitials = (name, email) => {
  if (name && typeof name === 'string' && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (email && typeof email === 'string' && email.trim()) {
    return email.trim().slice(0, 2).toUpperCase();
  }
  return 'FS';
};

const getPalette = (str = '') => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[index];
};

export default function UserAvatar({
  user,
  name,
  email,
  avatar,
  size = 'md',
  className = '',
  rounded = 'rounded-lg',
}) {
  const [imageError, setImageError] = useState(false);

  const displayName = name || user?.name || '';
  const displayEmail = email || user?.email || '';
  const avatarUrl = avatar || user?.avatar || '';
  const initials = getInitials(displayName, displayEmail);
  const palette = getPalette(displayName || displayEmail || 'User');

  const sizeClasses = {
    sm: 'w-7 h-7 text-[10px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-12 h-12 text-sm',
    xl: 'w-20 h-20 sm:w-24 sm:h-24 text-2xl sm:text-3xl',
  }[size] || 'w-8 h-8 text-xs';

  if (avatarUrl && !imageError) {
    return (
      <img
        src={avatarUrl}
        alt={displayName || 'User'}
        onError={() => setImageError(true)}
        className={`${sizeClasses} ${rounded} object-cover ring-1 ring-[var(--brand-border)] ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses} ${rounded} bg-gradient-to-tr ${palette} border flex items-center justify-center font-mono font-bold tracking-wider select-none shadow-md ${className}`}
      title={displayName || displayEmail}
    >
      {initials}
    </div>
  );
}
