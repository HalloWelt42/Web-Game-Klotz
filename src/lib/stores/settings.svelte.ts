import { defaultSettings, loadSettings, saveSettings } from '../game/persistence';
import type { Settings } from '../game/types';

function createSettingsStore() {
  let value = $state<Settings>(defaultSettings());
  let loaded = $state(false);

  async function init() {
    value = await loadSettings();
    loaded = true;
  }

  async function update(patch: Partial<Settings>) {
    value = { ...value, ...patch };
    await saveSettings($state.snapshot(value) as Settings);
  }

  return {
    get value() {
      return value;
    },
    get loaded() {
      return loaded;
    },
    init,
    update,
  };
}

export const settings = createSettingsStore();
