export const unpackReducer = (state, newState) => ({ ...state, ...newState });

export const timeout = (time) => new Promise((r) => setTimeout(r, time));