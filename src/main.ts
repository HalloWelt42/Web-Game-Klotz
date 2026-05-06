import { mount } from 'svelte';
import App from './App.svelte';

const target = document.getElementById('app');
if (!target) throw new Error('Mount-Target #app fehlt im DOM');

const app = mount(App, { target });

export default app;
