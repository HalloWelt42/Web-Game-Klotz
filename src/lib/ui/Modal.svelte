<script lang="ts">
  type Props = {
    open: boolean;
    title: string;
    onClose?: () => void;
    closeOnBackdrop?: boolean;
    inline?: boolean;
    children?: import('svelte').Snippet;
    footer?: import('svelte').Snippet;
  };

  let {
    open,
    title,
    onClose,
    closeOnBackdrop = true,
    inline = false,
    children,
    footer,
  }: Props = $props();

  function handleBackdrop(event: PointerEvent) {
    if (event.target !== event.currentTarget) return;
    if (closeOnBackdrop && onClose) onClose();
  }

  function handleKey(event: KeyboardEvent) {
    if (!open || inline) return;
    if (event.key === 'Escape' && onClose) {
      event.preventDefault();
      event.stopPropagation();
      onClose();
    }
  }
</script>

<svelte:window onkeydown={handleKey} />

{#if open && inline}
  <section
    class="page"
    aria-labelledby="page-title"
  >
    <header class="page-header">
      {#if onClose}
        <button class="ghost back" onclick={onClose} aria-label="Zurück">
          <i class="fa-solid fa-arrow-left"></i>
        </button>
      {/if}
      <h2 id="page-title">{title}</h2>
    </header>
    <div class="page-body">{@render children?.()}</div>
    {#if footer}
      <footer class="page-footer">{@render footer()}</footer>
    {/if}
  </section>
{:else if open}
  <div
    class="backdrop"
    role="presentation"
    onpointerdown={handleBackdrop}
  >
    <div
      class="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <header>
        <h2 id="modal-title">{title}</h2>
        {#if onClose}
          <button class="ghost close" onclick={onClose} aria-label="Schließen">
            <i class="fa-solid fa-xmark"></i>
          </button>
        {/if}
      </header>
      <div class="body">{@render children?.()}</div>
      {#if footer}
        <footer>{@render footer()}</footer>
      {/if}
    </div>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.55);
    display: grid;
    place-items: center;
    padding: 16px;
    z-index: 100;
    backdrop-filter: blur(2px);
  }

  .modal {
    background: var(--surface);
    color: var(--text);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    width: min(480px, 100%);
    max-height: 90dvh;
    display: flex;
    flex-direction: column;
    border: 1px solid var(--border);
    overflow: hidden;
  }

  header {
    padding: 16px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    border-bottom: 1px solid var(--border);
  }

  h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  }

  .body {
    padding: 20px;
    overflow: auto;
    flex: 1;
  }

  footer {
    padding: 14px 20px;
    border-top: 1px solid var(--border);
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }

  .close {
    padding: 6px 8px;
  }

  /* Inline-Page-Layout */
  .page {
    width: 100%;
    max-width: 720px;
    margin: 0 auto;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-md);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .page-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 18px;
    border-bottom: 1px solid var(--border);
    background: var(--surface-strong);
  }

  .page-header h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
  }

  .back {
    padding: 6px 10px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .page-body {
    padding: 20px;
  }

  .page-footer {
    padding: 14px 20px;
    border-top: 1px solid var(--border);
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }
</style>
