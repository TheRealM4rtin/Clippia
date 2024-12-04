import React from 'react';
import { createPortal } from 'react-dom';
import AssistantChat from './AssistantChat';
import { useAppStore } from '@/lib/store';

const AssistantChatPortal: React.FC = () => {
  const { assistant } = useAppStore();

  if (!assistant.isChatOpen) return null;

  // Create portal to render chat at root level
  return createPortal(
    <AssistantChat />,
    document.body
  );
};

export default AssistantChatPortal; 