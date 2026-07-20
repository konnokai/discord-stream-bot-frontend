<template>
  <section class="card card-outline h-full bg-zinc-800 p-5 flex-col">
    <div class="flex items-center justify-between mb-4">
      <div>
        <div class="flex items-center gap-2">
          <p class="text-xl font-bold text-white">Google 會員驗證</p>
          <span class="rounded bg-red-700 px-2 py-1 text-xs text-white">
            選用
          </span>
        </div>
        <p class="text-sm text-red-300">連結後可使用 YouTube 會員驗證</p>
      </div>
      <span class="text-sm font-bold" :class="statusClass">
        {{ statusText }}
      </span>
    </div>

    <p class="text-sm leading-6 text-zinc-300 mb-5">
      授權僅用於透過此帳號讀取會限影片留言，來判定是否持有該頻道的會員資格，不會修改您的影片、評價、留言或字幕，也不會用於會員認證以外的用途。
    </p>

    <div
      v-if="account.status === 'linked'"
      class="info_card card bg-zinc-700 mb-5 mx-auto"
    >
      <img
        v-if="account.profileImageUrl"
        :src="account.profileImageUrl"
        class="w-20 h-20 object-cover"
        alt="Google 帳號頭像"
      />
      <div class="p-5 min-w-0">
        <p class="text-white font-bold break-words">
          {{ account.userName || '已連結的 Google 帳號' }}
        </p>
      </div>
    </div>

    <p v-if="status === 'invalid'" class="text-sm text-amber-300 mb-4">
      Google 授權已失效；重新授權後才能繼續使用 YouTube 會員驗證。
    </p>
    <p v-else-if="status === 'error'" class="text-sm text-red-300 mb-4">
      無法完成 Google 授權或取得最新狀態，請稍後重試。
    </p>

    <div class="mt-auto flex flex-wrap justify-center gap-3">
      <button
        v-if="account.status !== 'linked'"
        class="btn bg-red-600 active:bg-red-500 disabled:opacity-60"
        :disabled="isPending"
        @click="emit('start')"
      >
        {{ startButtonText }}
      </button>
      <button
        v-if="account.status === 'linked' || account.status === 'invalid'"
        class="btn bg-transparent text-red-400 outline outline-red-500 disabled:opacity-60"
        :disabled="isPending"
        @click="emit('unlink')"
      >
        {{ isUnlinking ? '正在解除...' : '解除 Google 綁定' }}
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { GoogleAccountLink, GoogleViewStatus } from '../lib/accountLinks';

const props = defineProps<{
  account: GoogleAccountLink;
  status: GoogleViewStatus;
  isStarting: boolean;
  isUnlinking: boolean;
  isPending: boolean;
}>();

const emit = defineEmits(['start', 'unlink']);

const statusText = computed(() => {
  const labels: Record<GoogleViewStatus, string> = {
    linked: '已連結',
    unlinked: '未連結',
    invalid: '授權失效',
    authorizing: '正在授權',
    error: '發生錯誤'
  };

  return labels[props.status];
});

const statusClass = computed(() => ({
  'text-teal-300': props.status === 'linked',
  'text-zinc-400': props.status === 'unlinked',
  'text-amber-300':
    props.status === 'invalid' || props.status === 'authorizing',
  'text-red-300': props.status === 'error'
}));

const startButtonText = computed(() => {
  if (props.isStarting || props.status === 'authorizing') return '正在授權...';
  if (props.status === 'invalid' || props.status === 'error')
    return '重新授權 Google';

  return '連結 Google';
});
</script>
