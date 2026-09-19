export interface Preferences {
  sound: boolean;
  reducedMotion: boolean;
}
const KEY = "darkspire-2-preferences-v1";
export function loadPreferences(): Preferences {
  const defaults = {
    sound: true,
    reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
  };
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "null");
    return {
      sound: typeof saved?.sound === "boolean" ? saved.sound : defaults.sound,
      reducedMotion:
        typeof saved?.reducedMotion === "boolean"
          ? saved.reducedMotion
          : defaults.reducedMotion,
    };
  } catch {
    return defaults;
  }
}
export function savePreferences(value: Preferences): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
