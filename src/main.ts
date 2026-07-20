import { createApp } from 'vue';
import App from './App.vue';
import './index.css';

const app = createApp(App);

app.provide('discordClientId', '758222559392432160');
app.provide(
  'apiURL',
  import.meta.env.DEV
    ? 'https://dev-api.konnokai.me'
    : 'https://api.konnokai.me'
);

app.mount('#app');
