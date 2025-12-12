// App versioning system
// Version follows semantic versioning: Major.Minor.Patch
// UPDATE THIS VERSION when releasing new features!
export const APP_VERSION = '1.1.0';
export const APP_NAME = 'Smart Trade Tracker';
export const BUILD_DATE = new Date().toISOString().split('T')[0];

export const getVersionString = () => `${APP_NAME} V${APP_VERSION}`;
export const getFullVersionInfo = () => ({
  name: APP_NAME,
  version: APP_VERSION,
  buildDate: BUILD_DATE,
  displayVersion: `V${APP_VERSION}`,
});
