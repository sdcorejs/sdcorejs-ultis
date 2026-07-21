import './style.css';
import { mountDocsSite } from './app/docs-shell';

const root = document.getElementById('app');
if (!(root instanceof HTMLElement)) {
  throw new Error('Missing #app mount element.');
}

const site = mountDocsSite({
  root,
  version: '1.2.0',
});

if (import.meta.hot) {
  import.meta.hot.dispose(() => site.destroy());
}
