import { resolve } from 'path';

export const STORAGE_DIR =
  process.env.STORAGE_DIR ?? resolve(process.cwd(), '../../storage');
