<template>
  <Header />
  <div class="h-14"></div>
  <div class="container mx-auto p-4">
    <PrivacyPage v-if="currentPath === '/privacy'" />
    <TermsPage v-else-if="currentPath === '/terms'" />
    <Page404 v-else-if="currentPath !== '/'" />
    <template v-else>
      <HomePage />
      <div class="my-12 border-t border-zinc-700 pt-12">
        <VerifyWindow />
      </div>
    </template>
  </div>
  <Footer />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

import VerifyWindow from './page/VerifyWindow.vue';
import HomePage from './page/HomePage.vue';
import PrivacyPage from './page/PrivacyPage.vue';
import TermsPage from './page/TermsPage.vue';
import Footer from './components/Footer.vue';
import Header from './components/Header.vue';
import Page404 from './page/Page404.vue';

const normalizePath = (path: string) =>
  path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
const currentPath = ref(normalizePath(window.location.pathname));

const syncRoute = () => {
  currentPath.value = normalizePath(window.location.pathname);
};

const handleNavigation = (event: MouseEvent) => {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  )
    return;

  const element = event.target instanceof Element ? event.target : null;
  const anchor = element?.closest<HTMLAnchorElement>('a[data-spa-link]');
  if (!anchor || anchor.target || anchor.hasAttribute('download')) return;

  const target = new URL(anchor.href);
  if (target.origin !== window.location.origin) return;

  event.preventDefault();
  window.history.pushState(
    {},
    '',
    `${target.pathname}${target.search}${target.hash}`
  );
  syncRoute();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

watch(
  currentPath,
  (path) => {
    document.title =
      path === '/privacy'
        ? '直播小幫手帳號連結隱私權政策'
        : path === '/terms'
          ? '直播小幫手帳號連結使用條款'
          : path === '/'
            ? '直播小幫手'
            : '找不到頁面 | 直播小幫手';
  },
  { immediate: true }
);

onMounted(() => {
  window.addEventListener('popstate', syncRoute);
  document.addEventListener('click', handleNavigation);
});

onBeforeUnmount(() => {
  window.removeEventListener('popstate', syncRoute);
  document.removeEventListener('click', handleNavigation);
});
</script>

<style scoped>
.container {
  min-height: calc(100vh - 112px);
}
</style>
