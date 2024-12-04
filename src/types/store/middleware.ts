import { AppState } from './state';
import { StoreActions } from './actions';

export type Middleware = (
  state: AppState,
  previousState: AppState,
  action: keyof StoreActions,
  args: unknown[]
) => void;

export interface MiddlewareConfig {
  logging?: boolean;
  persistence?: boolean;
  devtools?: boolean;
} 