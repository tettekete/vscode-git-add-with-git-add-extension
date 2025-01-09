import { EventEmitter } from 'node:events';

export const kGitStatusUpdated = 'GitStatusUpdated';
export const gitEventBus = new EventEmitter();
