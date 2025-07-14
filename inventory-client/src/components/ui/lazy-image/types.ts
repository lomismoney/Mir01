export interface LazyImageProps {
  src: string;
  alt: string;
  fallbackSrc?: string;
  className?: string;
  containerClassName?: string;
  width?: number | string;
  height?: number | string;
  sizes?: ImageSize;
  quality?: number;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  placeholder?: 'blur' | 'empty' | 'shimmer';
  blurDataURL?: string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  threshold?: number;
  rootMargin?: string;
}

export interface ImageSize {
  thumbnail?: string;
  small?: string;
  medium?: string;
  large?: string;
  original?: string;
}

export interface IntersectionObserverOptions {
  threshold?: number | number[];
  rootMargin?: string;
  root?: Element | null;
}