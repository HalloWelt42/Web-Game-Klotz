<script lang="ts">
  import Modal from './Modal.svelte';
  import { withBase } from '../router.svelte';

  type Props = {
    open: boolean;
    onClose: () => void;
  };

  let { open, onClose }: Props = $props();

  const KOFI = 'https://ko-fi.com/HalloWelt42';

  type CryptoKind = 'btc' | 'doge' | 'eth';

  const COINS: Record<CryptoKind, { label: string; symbol: string; address: string; qr: string; color: string }> = {
    btc: {
      label: 'Bitcoin (BTC)',
      symbol: '₿',
      address: 'bc1qnd599khdkv3v3npmj9ufxzf6h4fzanny2acwqr',
      qr: withBase('icons/btc-qr.svg'),
      color: '#f7931a',
    },
    doge: {
      label: 'Dogecoin (DOGE)',
      symbol: 'Ð',
      address: 'DL7tuiYCqm3xQjMDXChdxeQxqUGMACn1ZV',
      qr: withBase('icons/doge-qr.svg'),
      color: '#c2a633',
    },
    eth: {
      label: 'Ethereum (ETH)',
      symbol: 'Ξ',
      address: '0x8A28fc47bFFFA03C8f685fa0836E2dBe1CA14F27',
      qr: withBase('icons/eth-qr.svg'),
      color: '#627eea',
    },
  };

  let active = $state<CryptoKind>('btc');
  let copied = $state<CryptoKind | 'failed' | null>(null);

  async function copyAddress(kind: CryptoKind) {
    try {
      await navigator.clipboard.writeText(COINS[kind].address);
      copied = kind;
      setTimeout(() => {
        if (copied === kind) copied = null;
      }, 1800);
    } catch {
      copied = 'failed';
    }
  }
</script>

<Modal {open} title="Mit Liebe gemacht" {onClose}>
  <div class="donate">
    <div class="hero">
      <i class="fa-solid fa-heart heart"></i>
      <p>
        Klotz ist ein Hobby-Projekt -- lokal, ohne Tracker, ohne Werbung. Wenn dir das
        Spiel Freude macht, freue ich mich ueber einen virtuellen Kaffee oder eine
        Krypto-Spende.
      </p>
    </div>

    <a class="kofi" href={KOFI} target="_blank" rel="noopener noreferrer">
      <i class="fa-solid fa-mug-hot"></i>
      <span>Ko-fi -- Kauf mir einen Kaffee</span>
    </a>

    <p class="crypto-label">Oder per Kryptowaehrung:</p>

    <div class="tabs" role="tablist">
      {#each Object.entries(COINS) as [kind, coin] (kind)}
        <button
          type="button"
          role="tab"
          class="tab"
          class:active={active === kind}
          aria-selected={active === kind}
          style:--coin-color={coin.color}
          onclick={() => (active = kind as CryptoKind)}
        >
          <span class="symbol">{coin.symbol}</span>
          {coin.label.split(' ')[0]}
        </button>
      {/each}
    </div>

    <div class="content">
      {#each Object.entries(COINS) as [kind, coin] (kind)}
        {#if active === (kind as CryptoKind)}
          <div class="box">
            <div class="qr" style:--coin-color={coin.color}>
              <img src={coin.qr} alt={`QR-Code fuer ${coin.label}`} />
            </div>
            <div class="details">
              <p class="name">{coin.label}</p>
              <code class="address">{coin.address}</code>
              <button
                type="button"
                class="copy"
                onclick={() => copyAddress(kind as CryptoKind)}
              >
                <i class={`fa-solid ${copied === kind ? 'fa-check' : 'fa-copy'}`}></i>
                {copied === kind
                  ? 'Kopiert!'
                  : copied === 'failed'
                  ? 'Fehler'
                  : 'Adresse kopieren'}
              </button>
            </div>
          </div>
        {/if}
      {/each}
    </div>

    <p class="thanks">Danke fuer deine Unterstuetzung!</p>
  </div>
</Modal>

<style>
  .donate {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    text-align: center;
  }

  .heart {
    font-size: 38px;
    color: #ff4d6d;
    text-shadow: 0 0 18px rgba(255, 77, 109, 0.5);
    animation: heartbeat 1.6s ease-in-out infinite;
  }

  @keyframes heartbeat {
    0%, 100% {
      transform: scale(1);
    }
    20% {
      transform: scale(1.18);
    }
    40% {
      transform: scale(0.95);
    }
    60% {
      transform: scale(1.1);
    }
  }

  .hero p {
    margin: 0;
    color: var(--text-muted);
    line-height: 1.5;
  }

  .kofi {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 14px 18px;
    background: linear-gradient(135deg, #ff5e5b, #ff4442);
    color: white;
    border-radius: var(--radius-md);
    text-decoration: none;
    font-weight: 700;
    font-size: 16px;
    box-shadow: 0 6px 18px rgba(255, 94, 91, 0.32);
    transition: transform var(--transition-fast), box-shadow var(--transition-fast);
  }

  .kofi:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 28px rgba(255, 94, 91, 0.45);
  }

  .crypto-label {
    margin: 0;
    color: var(--text-muted);
    font-size: 13px;
  }

  .tabs {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .tab {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 10px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    color: var(--text-muted);
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    transition: border-color var(--transition-fast), background var(--transition-fast);
  }

  .tab:hover {
    border-color: var(--coin-color);
    color: var(--text);
  }

  .tab.active {
    border-color: var(--coin-color);
    color: var(--text);
    background: color-mix(in srgb, var(--coin-color) 18%, transparent);
  }

  .symbol {
    color: var(--coin-color);
    font-size: 16px;
    font-weight: 800;
  }

  .box {
    display: grid;
    grid-template-columns: 130px 1fr;
    gap: 16px;
    padding: 14px;
    background: var(--surface-strong);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
  }

  .qr {
    width: 130px;
    height: 130px;
    background: white;
    padding: 8px;
    border-radius: var(--radius-md);
    display: grid;
    place-items: center;
    border: 2px solid var(--coin-color);
  }

  .qr img {
    width: 100%;
    height: 100%;
  }

  .details {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }

  .name {
    margin: 0;
    font-weight: 700;
    color: var(--text);
  }

  .address {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 11px;
    word-break: break-all;
    background: var(--surface);
    color: var(--text-muted);
    padding: 8px 10px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    line-height: 1.4;
  }

  .copy {
    align-self: flex-start;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--text);
    padding: 6px 12px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
  }

  .copy:hover {
    background: var(--accent);
    color: white;
    border-color: var(--accent);
  }

  .thanks {
    margin: 0;
    text-align: center;
    color: var(--text-muted);
    font-size: 13px;
  }

  @media (max-width: 420px) {
    .box {
      grid-template-columns: 1fr;
    }

    .qr {
      width: 140px;
      height: 140px;
      margin: 0 auto;
    }
  }
</style>
