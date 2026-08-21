import { createWebStorage } from './webStorage.ts';

const store = createWebStorage('localStorage');

export const readLocalStorage = store.read;
export const writeLocalStorage = store.write;
export const clearLocalStorage = store.clear;
