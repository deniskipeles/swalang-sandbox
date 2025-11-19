import type { ReactNode } from 'react';

export interface SocialLink {
  name: string;
  url: string;
  description: string;
  platform: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}
