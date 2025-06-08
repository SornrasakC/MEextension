import type { UnpackReducerAction } from '../types';

/**
 * Generic reducer that merges partial state updates
 */
export function unpackReducer<T>(
  state: T,
  action: UnpackReducerAction<T>
): T {
  return { ...state, ...action };
} 