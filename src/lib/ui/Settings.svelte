<script lang="ts">
  import { settings } from '../stores/settings.svelte';
  import { stats } from '../stores/stats.svelte';
  import { game } from '../stores/game.svelte';
  import { clearAll } from '../game/persistence';
  import Modal from './Modal.svelte';

  type Props = {
    open: boolean;
    onClose: () => void;
    onShowTutorial: () => void;
  };

  let { open, onClose, onShowTutorial }: Props = $props();

  let confirmReset = $state(false);

  async function resetAll() {
    await clearAll();
    await stats.reset();
    await settings.update({});
    game.startNew('endless');
    confirmReset = false;
    onClose();
  }
</script>

<Modal {open} title="Einstellungen" {onClose}>
  <div class="settings">
    <section>
      <h3>Aussehen</h3>
      <label>
        <span>Theme</span>
        <select
          value={settings.value.theme}
          onchange={(e) =>
            settings.update({ theme: (e.currentTarget as HTMLSelectElement).value as 'system' | 'light' | 'dark' })}
        >
          <option value="system">System</option>
          <option value="light">Hell</option>
          <option value="dark">Dunkel</option>
        </select>
      </label>
      <label>
        <span>Farbpalette</span>
        <select
          value={settings.value.palette}
          onchange={(e) =>
            settings.update({
              palette: (e.currentTarget as HTMLSelectElement).value as
                | 'default'
                | 'warm'
                | 'cool'
                | 'forest'
                | 'winter'
                | 'halloween',
            })}
        >
          <option value="default">Standard</option>
          <option value="warm">Warm</option>
          <option value="cool">Kuehl</option>
          <option value="forest">Wald</option>
          <option value="winter">Winter</option>
          <option value="halloween">Halloween</option>
        </select>
      </label>
      <label class="row">
        <input
          type="checkbox"
          checked={settings.value.colorblind}
          onchange={(e) =>
            settings.update({ colorblind: (e.currentTarget as HTMLInputElement).checked })}
        />
        <span>Farbblind-Modus (Steine zusaetzlich gemustert)</span>
      </label>
    </section>

    <section>
      <h3>Klang & Haptik</h3>
      <label class="row">
        <input
          type="checkbox"
          checked={settings.value.sound}
          onchange={(e) => settings.update({ sound: (e.currentTarget as HTMLInputElement).checked })}
        />
        <span>Soundeffekte</span>
      </label>
      <label class="row">
        <input
          type="checkbox"
          checked={settings.value.haptics}
          onchange={(e) => settings.update({ haptics: (e.currentTarget as HTMLInputElement).checked })}
        />
        <span>Vibration auf Mobilgeraeten</span>
      </label>
    </section>

    <section>
      <h3>Sonstiges</h3>
      <button class="ghost" onclick={onShowTutorial}>
        <i class="fa-solid fa-circle-info"></i>
        Tutorial erneut zeigen
      </button>
      {#if !confirmReset}
        <button class="ghost danger" onclick={() => (confirmReset = true)}>
          <i class="fa-solid fa-trash"></i>
          Alle Daten loeschen
        </button>
      {:else}
        <div class="confirm">
          <p>Wirklich alles loeschen? Highscore, Statistik, Einstellungen.</p>
          <div class="confirm-actions">
            <button class="ghost" onclick={() => (confirmReset = false)}>Abbrechen</button>
            <button class="primary danger" onclick={resetAll}>Ja, loeschen</button>
          </div>
        </div>
      {/if}
    </section>
  </div>
</Modal>

<style>
  .settings {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  section {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  h3 {
    margin: 0 0 4px;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted);
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 14px;
  }

  label.row {
    flex-direction: row;
    align-items: center;
    gap: 10px;
  }

  select {
    font-family: inherit;
    background: var(--surface);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: 8px 12px;
  }

  button.danger {
    color: var(--danger);
  }

  button.primary.danger {
    background: var(--danger);
    color: white;
    border-color: var(--danger);
  }

  .confirm {
    background: var(--surface-strong);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .confirm p {
    margin: 0;
    color: var(--text-muted);
  }

  .confirm-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }
</style>
