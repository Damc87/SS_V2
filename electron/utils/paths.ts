import { app } from 'electron';
import fs from 'fs';
import path from 'path';

export const getDataRoot = () => {
  const base = app.getPath('userData');
  return path.join(base, 'GradnjaStroski');
};

export const getDataFilePath = () => {
  return path.join(getDataRoot(), 'data.json');
};

export const getUploadsPath = () => {
  return path.join(getDataRoot(), 'uploads');
};

export const ensureDataDirectories = () => {
  const root = getDataRoot();
  const uploadsDir = getUploadsPath();
  [root, uploadsDir].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};
