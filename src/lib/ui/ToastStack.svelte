<script lang="ts">
  import { game } from '../stores/game.svelte';
</script>

<div class="stack" aria-live="polite" aria-label="Hinweise">
  {#each game.toasts as t (t.id)}
    <div class={`toast ${t.kind}`}>
      <i class={`fa-solid ${t.icon}`}></i>
      <span>{t.text}</span>
    </div>
  {/each}
</div>

<style>
  .stack {
    position: fixed;
    top: 80px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    gap: 8px;
    z-index: 80;
    pointer-events: none;
  }

  .toast {
    pointer-events: auto;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: 10px 16px;
    display: flex;
    align-items: center;
    gap: 10px;
    box-shadow: var(--shadow-md);
    color: var(--text);
    font-weight: 500;
    animation: slideIn 0.25s ease-out, fadeOut 0.4s ease-in 3s forwards;
  }

  .toast i {
    color: var(--accent);
  }

  .toast.achievement {
    border-color: var(--accent);
  }

  .toast.combo {
    border-color: var(--success);
  }

  .toast.combo i {
    color: var(--success);
  }

  .toast.mono {
    border-color: var(--piece-orange);
  }

  .toast.mono i {
    color: var(--piece-orange);
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeOut {
    to {
      opacity: 0;
      transform: translateY(-8px);
    }
  }
</style>
