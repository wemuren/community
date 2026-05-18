const trimTrailingSlash = (value) => value.replace(/\/+$/, '');

export const API_BASE_URL = trimTrailingSlash(
  import.meta.env.VITE_API_BASE_URL || '/api'
);

export const UPLOADS_BASE_URL = `${API_BASE_URL}/uploads`;
export const VIDEO_URL = `${UPLOADS_BASE_URL}/videos/`;
export const THUMB_URL = `${UPLOADS_BASE_URL}/thumbnails/`;
export const AVATAR_URL = `${UPLOADS_BASE_URL}/avatars/`;
export const BANNER_URL = `${UPLOADS_BASE_URL}/banners/`;
