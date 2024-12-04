// Window dimensions
export const DEFAULT_WINDOW_WIDTH = 300;
export const DEFAULT_WINDOW_HEIGHT = 200;
export const WINDOW_PADDING = 50;
export const RESIZE_CONTROL_SIZE = 25;
export const TITLE_BAR_HEIGHT = 32;

// Animation
export const ZOOM_ANIMATION_DURATION = 800;
export const MAX_ZOOM_LEVEL = 1.2;

// Debounce delays
export const AUTOSAVE_DELAY = 1000;
export const RESIZE_DEBOUNCE_DELAY = 100;
export const DRAG_THRESHOLD = 5;

// Image processing
export const IMAGE_PADDING = 40;
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// Rate limiting
export const RATE_LIMIT_INTERVAL = 60 * 1000; // 1 minute
export const RATE_LIMIT_MAX_REQUESTS = 500;

// Local storage
export const BACKUP_PREFIX = 'backup_';
export const MAX_BACKUP_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

// Error messages
export const ERROR_MESSAGES = {
  IMAGE_TOO_LARGE: 'Image size exceeds 5MB limit',
  INVALID_IMAGE_TYPE: 'Invalid image type. Allowed types: JPEG, PNG, GIF, WebP',
  SAVE_FAILED: 'Failed to save content',
  LOAD_FAILED: 'Failed to load content',
  EXPORT_FAILED: 'Failed to export content',
} as const; 