/** what a url driven join sends until the panel that owns the name mounts and renames */
export const UNNAMED_DISPLAY_NAME = '[Unknown]';

/**
 * Marks a transaction as coming from the room, so the outbound handler doesn't re-broadcast it
 */
export const REMOTE_ORIGIN = Symbol('multiplayer/remote');
