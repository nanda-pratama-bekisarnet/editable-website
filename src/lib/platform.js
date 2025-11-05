// src/lib/platform.js
export function getPlatform(event) {
  return event.platform || { env: {} };
}
