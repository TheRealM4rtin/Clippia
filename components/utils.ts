import DOMPurify from 'dompurify';
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE, ERROR_MESSAGES } from './constants';

// Security utilities
export const sanitizeHtml = (content: string): string => {
  const config = {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'a', 'img',
      'span', 'div', 'table', 'tr', 'td', 'th'
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'class', 'style',
      'data-latex', 'data-formula', 'data-display-mode'
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|data|blob):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    ADD_TAGS: ['latex-node'],
    ADD_ATTR: ['formula', 'display-mode']
  };

  return DOMPurify.sanitize(content, config);
};

// URL validation
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Image validation
export const validateImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      reject(new Error(ERROR_MESSAGES.INVALID_IMAGE_TYPE));
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      reject(new Error(ERROR_MESSAGES.IMAGE_TOO_LARGE));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
};

// Debounce utility
export const debounce = <T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Content comparison
export const hasContentChanged = (oldContent: string, newContent: string): boolean => {
  const normalize = (content: string) => 
    content.replace(/\s+/g, ' ').trim();
  return normalize(oldContent) !== normalize(newContent);
};

// Local storage utilities
export const saveToLocalStorage = (key: string, value: unknown): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
};

export const loadFromLocalStorage = <T>(key: string): T | null => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    return null;
  }
};

// Error reporting
export const reportError = (error: Error, context: Record<string, unknown> = {}): void => {
  console.error('Error:', error.message, 'Context:', context);
  // Add your error reporting service here (e.g., Sentry)
};

// Rate limiting
export class RateLimit {
  private timestamps: number[] = [];
  private readonly interval: number;
  private readonly maxRequests: number;

  constructor(interval: number, maxRequests: number) {
    this.interval = interval;
    this.maxRequests = maxRequests;
  }

  canProceed(): boolean {
    const now = Date.now();
    this.timestamps = this.timestamps.filter(t => now - t < this.interval);
    
    if (this.timestamps.length >= this.maxRequests) {
      return false;
    }
    
    this.timestamps.push(now);
    return true;
  }
}

// Image processing
export const processImage = (
  imgSrc: string,
  maxWidth: number
): Promise<{ width: number; height: number }> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const ratio = maxWidth / img.width;
      resolve({
        width: Math.floor(img.width * ratio),
        height: Math.floor(img.height * ratio)
      });
    };
    img.src = imgSrc;
  });
}; 