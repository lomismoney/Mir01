import { LucideIcon } from 'lucide-react';

export type EmptyStateVariant = 'default' | 'search' | 'error' | 'permission';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  children?: React.ReactNode;
}

export interface EmptyStateConfig {
  products: {
    title: string;
    description: string;
    actionLabel: string;
    actionRoute: string;
  };
  orders: {
    title: string;
    description: string;
    actionLabel: string;
    actionRoute: string;
  };
  customers: {
    title: string;
    description: string;
    actionLabel: string;
    actionRoute: string;
  };
  categories: {
    title: string;
    description: string;
    actionLabel: string;
    actionRoute: string;
  };
  inventory: {
    title: string;
    description: string;
    actionLabel: string;
    actionRoute: string;
  };
  installations: {
    title: string;
    description: string;
    actionLabel: string;
    actionRoute: string;
  };
}