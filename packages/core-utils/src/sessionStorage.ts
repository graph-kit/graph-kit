import { createWebStorage } from './webStorage.ts';

/**
 * scoped to the tab rather than the browser, which is the point wherever two tabs on the
 * same thing have to stay two of something rather than fight over one
 */
const store = createWebStorage('sessionStorage');

export const readSessionStorage = store.read;
export const writeSessionStorage = store.write;
export const clearSessionStorage = store.clear;
