import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import styles from './AssistantChat.module.css';

const AssistantChat: React.FC = () => {
  const { assistant, updateAssistantState, addMessage, user, handleAuthResponse } = useAppStore();
  const [input, setInput] = useState('');
  const [showCommands, setShowCommands] = useState(false);
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Ensure the chat window stays within viewport bounds
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let x = assistant.position?.x || 0;
      let y = assistant.position?.y || 0;

      // Adjust x position if it would go off screen
      if (x + rect.width > viewportWidth) {
        x = viewportWidth - rect.width - 20;
      }
      if (x < 20) {
        x = 20;
      }

      // Adjust y position if it would go off screen
      if (y + rect.height > viewportHeight) {
        y = viewportHeight - rect.height - 20;
      }
      if (y < 20) {
        y = 20;
      }

      containerRef.current.style.left = `${x}px`;
      containerRef.current.style.top = `${y}px`;
    }
  }, [assistant.position]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [assistant.messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);
    if (!assistant.authState) {
      setShowCommands(value.startsWith('/'));
      if (value.startsWith('/')) {
        setSelectedCommandIndex(0);
      }
    }
  };

  const findExactCommand = (commandText: string) => {
    return assistant.availableCommands.find(cmd => cmd.command === commandText);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (assistant.authState) {
      if (e.key === 'Enter') {
        e.preventDefault();
        const value = input.trim();
        if (value) {
          addMessage({
            content: value,
            type: 'user'
          });
          handleAuthResponse(value);
          setInput('');
        }
      }
    } else if (showCommands) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedCommandIndex((prev) => 
          Math.min(prev + 1, filteredCommands.length - 1)
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedCommandIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const value = input.trim();
        
        // Check for exact command match first
        const exactCommand = findExactCommand(value);
        if (exactCommand) {
          executeCommand(exactCommand);
        } else if (filteredCommands.length > 0) {
          // If no exact match, use the selected command from filtered list
          executeCommand(filteredCommands[selectedCommandIndex]);
        }
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const value = input.trim();
      
      // Check if it's a command
      if (value.startsWith('/')) {
        const exactCommand = findExactCommand(value);
        if (exactCommand) {
          executeCommand(exactCommand);
          return;
        }
      }
      
      handleSubmit();
    }
  };

  const executeCommand = (command: typeof assistant.availableCommands[0]) => {
    addMessage({
      content: command.command,
      type: 'user',
    });
    command.action();
    setInput('');
    setShowCommands(false);
  };

  const handleSubmit = () => {
    if (!input.trim()) return;

    addMessage({
      content: input,
      type: 'user',
    });

    // Add assistant response
    if (user.user) {
      addMessage({
        content: `How can I help you today?`,
        type: 'assistant'
      });
    } else {
      addMessage({
        content: 'Please sign in to get personalized assistance. Type /login to get started.',
        type: 'assistant'
      });
    }

    setInput('');
  };

  const filteredCommands = assistant.availableCommands.filter(cmd =>
    cmd.command.toLowerCase().includes(input.toLowerCase())
  );

  const getInputPlaceholder = () => {
    if (assistant.authState) {
      switch (assistant.authState.step) {
        case 'initial':
          return 'Type "yes" if you have an account, "no" to create one...';
        case 'login_email':
        case 'register_email':
          return 'Enter your email...';
        case 'login_password':
        case 'register_password':
          return 'Enter your password...';
        case 'register_confirm':
          return 'Confirm your password...';
        default:
          return 'Type your message...';
      }
    }
    return user.user 
      ? "Type a message or / for commands..." 
      : "Sign in with /login to get started...";
  };

  return (
    <div 
      ref={containerRef}
      className={styles.chatContainer}
      style={{
        position: 'fixed',
        left: assistant.position?.x || 0,
        top: assistant.position?.y || 0,
      }}
    >
      <div className={styles.header}>
        <h3>
          {user.user ? `Clippia Assistant - ${user.user.email}` : 'Clippia Assistant'}
        </h3>
        <button 
          onClick={() => updateAssistantState({ isChatOpen: false })} 
          className={styles.closeButton}
        >×</button>
      </div>
      
      <div className={styles.messagesContainer}>
        {assistant.messages.map((msg) => (
          <div
            key={msg.id}
            className={`${styles.message} ${styles[msg.type]}`}
          >
            {msg.content}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className={styles.inputContainer}>
        {!assistant.authState && showCommands && filteredCommands.length > 0 && (
          <div className={styles.commandsList}>
            {filteredCommands.map((cmd, index) => (
              <div
                key={cmd.command}
                className={`${styles.commandItem} ${
                  index === selectedCommandIndex ? styles.selected : ''
                }`}
                onClick={() => executeCommand(cmd)}
              >
                <strong>{cmd.command}</strong>
                <span>{cmd.description}</span>
              </div>
            ))}
          </div>
        )}
        <input
          ref={inputRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={getInputPlaceholder()}
          className={styles.input}
          type={assistant.authState?.step.includes('password') ? 'password' : 'text'}
          autoFocus
        />
      </div>
    </div>
  );
};

export default AssistantChat; 