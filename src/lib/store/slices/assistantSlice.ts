import { StateCreator } from 'zustand';
import { AppState } from '@/types/store/state';
import { AssistantActions, StoreActions } from '@/types/store/actions';
import { AssistantState } from '@/types/store';
import { z } from 'zod';
import { createClient } from '@/lib/utils/supabase/client';

const supabase = createClient();

const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

const emailSchema = z.string().email('Invalid email address');

export interface ChatCommand {
  title: string;
  command: string;
  description: string;
  action: () => void;
}

export interface ChatMessage {
  id: string;
  content: string;
  timestamp: number;
  type: 'user' | 'assistant' | 'system';
}

export interface AuthState {
  step: 'initial' | 'login_email' | 'login_password' | 'register_email' | 'register_password' | 'register_confirm';
  email?: string;
  password?: string;
}

const getBaseCommands = (get: () => AppState & StoreActions): ChatCommand[] => [
  {
    title: 'About',
    command: '/about',
    description: 'Show information about Clippia',
    action: () => {
      const { addMessage } = get();
      addMessage({
        content: 'Clippia is a modern cloud-based operating system that brings your desktop to the web. Built with cutting-edge technology, it provides a seamless and intuitive experience for managing your digital life.',
        type: 'assistant'
      });
    },
  },
  {
    title: 'Help',
    command: '/help',
    description: 'Show available commands',
    action: () => {
      const { addMessage, assistant } = get();
      const commandsList = assistant.availableCommands
        .map(cmd => `${cmd.command} - ${cmd.description}`)
        .join('\n');
      
      addMessage({
        content: `Available commands:\n${commandsList}`,
        type: 'assistant'
      });
    },
  },
  {
    title: 'Clear',
    command: '/clear',
    description: 'Clear chat history',
    action: () => {
      const { updateAssistantState } = get();
      updateAssistantState({ 
        messages: [],
        authState: null 
      });
      
      // Add welcome message
      get().addMessage({
        content: 'Chat history cleared. Type /help to see available commands.',
        type: 'system'
      });
    },
  }
];

const getAuthCommands = (get: () => AppState & StoreActions): ChatCommand[] => {
  const { user } = get();

  if (user.user) {
    return [{
      title: 'Sign Out',
      command: '/signout',
      description: 'Sign out from Clippia Cloud',
      action: () => {
        const { addMessage, setUser, updateAssistantState } = get();
        
        addMessage({
          content: 'Signing out...',
          type: 'system'
        });

        setUser(null);
        updateAssistantState({ 
          authState: null,
          messages: [] // Clear chat history on logout
        });
        
        // Add welcome message after logout
        get().addMessage({
          content: 'You have been signed out successfully. Type /login to sign in again.',
          type: 'system'
        });
      },
    }];
  }

  return [{
    title: 'Login',
    command: '/login',
    description: 'Connect to Clippia Cloud',
    action: () => {
      const { addMessage, updateAssistantState } = get();
      
      // Add system message
      addMessage({
        content: 'Starting login process...',
        type: 'system'
      });

      // Initialize auth state
      updateAssistantState({ 
        authState: { step: 'initial' } 
      });

      // Ask if user has an account
      addMessage({
        content: 'Do you have an account? (yes/no)',
        type: 'assistant'
      });
    },
  }];
};

export const createAssistantSlice: StateCreator<
  AppState & StoreActions,
  [],
  [],
  AssistantActions
> = (set, get) => ({
  assistant: {
    position: { x: 0, y: 0 },
    targetPosition: null,
    isMoving: false,
    lastMoveTime: 0,
    isChatOpen: false,
    messages: [],
    authState: null as AuthState | null,
    get availableCommands() {
      return [...getBaseCommands(get), ...getAuthCommands(get)];
    },
  },
  updateAssistantState: (updates: Partial<AssistantState>) =>
    set((state) => ({
      assistant: {
        ...state.assistant,
        ...updates,
      },
    })),
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) =>
    set((state) => ({
      assistant: {
        ...state.assistant,
        messages: [
          ...state.assistant.messages,
          {
            ...message,
            id: Math.random().toString(36).substr(2, 9),
            timestamp: Date.now(),
          },
        ],
      },
    })),
  handleAuthResponse: async (response: string) => {
    const { assistant, addMessage, updateAssistantState, setUser } = get();
    const authState = assistant.authState;

    if (!authState) return;

    const normalizedResponse = response.toLowerCase().trim();

    switch (authState.step) {
      case 'initial':
        if (normalizedResponse === 'yes') {
          updateAssistantState({
            authState: { ...authState, step: 'login_email' }
          });
          addMessage({
            content: 'Please enter your email:',
            type: 'assistant'
          });
        } else if (normalizedResponse === 'no') {
          updateAssistantState({
            authState: { ...authState, step: 'register_email' }
          });
          addMessage({
            content: 'Let\'s create an account! Please enter your email:',
            type: 'assistant'
          });
        } else {
          addMessage({
            content: 'Please answer with "yes" or "no"',
            type: 'assistant'
          });
        }
        break;

      case 'login_email':
        if (response.includes('@')) {
          updateAssistantState({
            authState: { ...authState, step: 'login_password', email: response }
          });
          addMessage({
            content: 'Please enter your password:',
            type: 'assistant'
          });
        } else {
          addMessage({
            content: 'Please enter a valid email address.',
            type: 'assistant'
          });
        }
        break;

      case 'login_password':
        try {
          const { data, error: signInError } = await supabase.auth.signInWithPassword({
            email: authState.email!,
            password: response
          });

          if (signInError) {
            addMessage({
              content: signInError.message,
              type: 'assistant'
            });
            return;
          }

          setUser(data.user);
          updateAssistantState({ 
            authState: null,
            messages: [] // Clear chat history on login
          });
          addMessage({
            content: `Welcome back, ${authState.email}! You are now signed in. How can I help you today?`,
            type: 'system'
          });
        } catch (error) {
          addMessage({
            content: error instanceof Error ? error.message : 'An unexpected error occurred',
            type: 'assistant'
          });
        }
        break;

      case 'register_email':
        try {
          emailSchema.parse(response);
          updateAssistantState({
            authState: { ...authState, step: 'register_password', email: response }
          });
          addMessage({
            content: 'Please choose a password (minimum 8 characters, one uppercase letter, and one number):',
            type: 'assistant'
          });
        } catch (error) {
          addMessage({
            content: error instanceof z.ZodError ? error.errors[0].message : 'Invalid email address',
            type: 'assistant'
          });
        }
        break;

      case 'register_password':
        try {
          passwordSchema.parse(response);
          updateAssistantState({
            authState: { ...authState, step: 'register_confirm', password: response }
          });
          addMessage({
            content: 'Please confirm your password:',
            type: 'assistant'
          });
        } catch (error) {
          addMessage({
            content: error instanceof z.ZodError ? error.errors[0].message : 'Invalid password',
            type: 'assistant'
          });
        }
        break;

      case 'register_confirm':
        if (response === authState.password) {
          try {
            const { error: signUpError } = await supabase.auth.signUp({
              email: authState.email!,
              password: authState.password!,
              options: {
                emailRedirectTo: 'https://www.clippia.io/auth/callback',
                data: {
                  email_confirmed: false,
                }
              }
            });

            if (signUpError) {
              addMessage({
                content: signUpError.message,
                type: 'assistant'
              });
              return;
            }

            updateAssistantState({ 
              authState: null,
              messages: [] // Clear chat history on registration
            });
            addMessage({
              content: `✉️ Please check your email to verify your account.`,
              type: 'system'
            });
          } catch (error) {
            addMessage({
              content: error instanceof Error ? error.message : 'An unexpected error occurred',
              type: 'assistant'
            });
          }
        } else {
          addMessage({
            content: 'Passwords do not match. Please try again:',
            type: 'assistant'
          });
        }
        break;
    }
  }
}); 