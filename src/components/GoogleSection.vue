<template>
  <section class="card card-outline h-full bg-zinc-800 p-5 flex-col">
    <div class="flex items-start justify-between gap-3 mb-4">
      <div class="min-w-0">
        <div class="flex items-center gap-2">
          <p class="text-xl font-bold text-white break-words">
            Google 會員驗證
          </p>
          <span
            class="shrink-0 rounded bg-red-700 px-2 py-1 text-xs text-white"
          >
            選用
          </span>
        </div>
        <p class="text-sm text-red-300">連結後可使用 YouTube 會員驗證</p>
      </div>
      <span class="shrink-0 text-sm font-bold" :class="statusClass">
        {{ statusText }}
      </span>
    </div>

    <p class="sr-only" role="status" aria-live="polite" aria-atomic="true">
      {{ liveStatusText }}
    </p>

    <p class="text-sm leading-6 text-zinc-300 mb-5">
      授權只用來讀取 YouTube
      頻道資料，以及此帳號在會員限定影片中的留言，以確認您是否具有該頻道的會員資格。系統不會修改您的影片、評價、留言或字幕，也不會將授權用於其他用途
    </p>
    <p class="text-sm leading-6 text-zinc-300 mb-5">
      伺服器管理員完成設定後，請回到 Discord 執行
      <code>/youtube-member check</code>
      確認會員資格
    </p>

    <div
      v-if="account.status === 'linked'"
      class="info_card card bg-zinc-700 mb-5 mx-auto"
    >
      <img
        v-if="account.profileImageUrl"
        :src="account.profileImageUrl"
        class="w-20 h-20 object-cover"
        alt="YouTube 頻道頭像"
      />
      <div class="p-5 min-w-0">
        <p class="text-sm text-zinc-400">YouTube 頻道</p>
        <p class="text-white font-bold break-words">
          {{ account.userName || '已連結的 YouTube 頻道' }}
        </p>
      </div>
    </div>

    <div
      v-if="account.cleanupPending"
      class="rounded bg-amber-900 p-3 text-sm leading-6 text-amber-100 mb-4"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <p class="font-bold">身分組清理中</p>
      <p>Discord 身分組仍在背景清理，請稍後手動重新取得資訊確認進度</p>
    </div>

    <p v-if="status === 'invalid'" class="text-sm text-amber-300 mb-4">
      Google 授權已失效，重新授權後才能繼續使用 YouTube 會員驗證
    </p>
    <p v-else-if="status === 'error'" class="text-sm text-red-300 mb-4">
      無法完成 Google 授權或取得最新狀態，請稍後重試
    </p>

    <div class="mt-auto flex flex-wrap justify-center gap-3">
      <button
        class="btn bg-zinc-700 active:bg-zinc-600 disabled:opacity-60"
        :disabled="isPending"
        @click="emit('refresh')"
      >
        {{ account.cleanupPending ? '重新取得清理狀態' : '重新取得狀態' }}
      </button>
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
        {{ isUnlinking ? '解除中…' : '解除 Google 連結' }}
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
  operationStatus: string;
}>();

const emit = defineEmits(['start', 'unlink', 'refresh']);

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

const liveStatusText = computed(() =>
  props.operationStatus
    ? `${statusText.value}。${props.operationStatus}`
    : statusText.value
);

const startButtonText = computed(() => {
  if (props.isStarting || props.status === 'authorizing') return '授權中…';
  if (props.status === 'invalid' || props.status === 'error')
    return '重新授權 Google';

  return '連結 Google';
});
</script>
