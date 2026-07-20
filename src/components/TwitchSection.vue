<template>
  <section class="card card-outline h-full bg-zinc-800 p-5 flex-col">
    <div class="flex items-center justify-between mb-4">
      <div>
        <div class="flex items-center gap-2">
          <p class="text-xl font-bold text-white">Twitch 直播爬蟲</p>
          <span class="rounded bg-purple-700 px-2 py-1 text-xs text-white">
            選用
          </span>
        </div>
        <p class="text-sm text-purple-300">
          連結後可設定自己的 Twitch 直播爬蟲
        </p>
      </div>
      <span class="text-sm font-bold" :class="statusClass">
        {{ statusText }}
      </span>
    </div>

    <p class="text-sm leading-6 text-zinc-300 mb-4">
      僅用於設定您自己的 Twitch 直播爬蟲，不會用於其他用途。
      完成授權後即使伺服器未滿 200 人，也可以新增您自己的 Twitch 頻道爬蟲。
    </p>
    <p class="text-sm leading-6 text-zinc-300 mb-5">
      若授權失效，系統會重新檢查設定該爬蟲的伺服器人數；未滿 200
      人時將自動移除爬蟲，Twitch
      通知會停止，但既有通知設定會保留為暫時不生效的設定。
      若頻道當下正在直播，系統會等待該場直播結束後才移除，避免遺失直播更新及關台通知。
    </p>

    <div
      v-if="account.twitchUserId && account.status !== 'unlinked'"
      class="info_card card bg-zinc-700 mb-5 mx-auto"
    >
      <img
        v-if="account.profileImageUrl"
        :src="account.profileImageUrl"
        class="w-20 h-20 object-cover"
        alt="Twitch 帳號頭像"
      />
      <div class="min-w-0 px-5 flex flex-col justify-center">
        <p class="text-white font-bold break-words">
          {{
            account.displayName || account.userLogin || '已連結的 Twitch 帳號'
          }}
        </p>
        <p v-if="account.userLogin" class="text-sm text-zinc-400 break-words">
          @{{ account.userLogin }}
        </p>
      </div>
    </div>

    <p v-if="status === 'invalid'" class="text-sm text-amber-300 mb-4">
      Twitch 授權已失效；直播爬蟲將依伺服器人數與直播狀態進行安全清理。
    </p>
    <p v-else-if="status === 'revoked'" class="text-sm text-amber-300 mb-4">
      Twitch 授權已撤銷。您可以重新連結以恢復選用功能。
    </p>
    <p v-else-if="status === 'error'" class="text-sm text-red-300 mb-4">
      無法完成 Twitch 授權或取得最新狀態，請稍後重試。
    </p>

    <div class="mt-auto flex flex-wrap justify-center gap-3">
      <button
        v-if="account.status !== 'linked'"
        class="btn bg-purple-700 active:bg-purple-600 disabled:opacity-60"
        :disabled="isPending"
        @click="emit('start')"
      >
        {{ startButtonText }}
      </button>
      <button
        v-if="account.status === 'linked' || account.status === 'invalid'"
        class="btn bg-transparent text-purple-300 outline outline-purple-500 disabled:opacity-60"
        :disabled="isPending"
        @click="showUnlinkWarning = true"
      >
        解除 Twitch 連結
      </button>
    </div>

    <div
      v-if="showUnlinkWarning"
      class="rounded bg-zinc-900 p-4 mt-5 text-sm leading-6"
    >
      <p class="font-bold text-amber-300 mb-2">解除前請確認</p>
      <p>
        解除後，未滿 200 人伺服器所設定的 Twitch
        爬蟲可能被自動移除；若頻道正在直播，會延後到該場直播結束後才清理，以保留直播更新與關台通知。爬蟲移除後，通知設定仍會保留，但會暫時停止生效。
      </p>
      <div class="flex flex-wrap justify-end gap-3 mt-4">
        <button
          class="btn bg-transparent outline outline-zinc-500"
          :disabled="isPending"
          @click="showUnlinkWarning = false"
        >
          取消
        </button>
        <button
          class="btn bg-red-700 active:bg-red-600 disabled:opacity-60"
          :disabled="isPending"
          @click="confirmUnlink"
        >
          {{ isUnlinking ? '正在解除...' : '確認解除' }}
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { TwitchAccountLink, TwitchViewStatus } from '../lib/accountLinks';

const props = defineProps<{
  account: TwitchAccountLink;
  status: TwitchViewStatus;
  isStarting: boolean;
  isUnlinking: boolean;
  isPending: boolean;
}>();

const emit = defineEmits(['start', 'unlink']);
const showUnlinkWarning = ref(false);

const statusText = computed(() => {
  const labels: Record<TwitchViewStatus, string> = {
    linked: '已連結',
    unlinked: '未連結',
    invalid: '授權失效',
    revoked: '已撤銷',
    authorizing: '正在授權',
    error: '發生錯誤'
  };

  return labels[props.status];
});

const statusClass = computed(() => ({
  'text-teal-300': props.status === 'linked',
  'text-zinc-400': props.status === 'unlinked',
  'text-amber-300':
    props.status === 'invalid' ||
    props.status === 'revoked' ||
    props.status === 'authorizing',
  'text-red-300': props.status === 'error'
}));

const startButtonText = computed(() => {
  if (props.isStarting || props.status === 'authorizing') return '正在授權...';
  if (
    props.status === 'invalid' ||
    props.status === 'revoked' ||
    props.status === 'error'
  )
    return '重新連結 Twitch';

  return '連結 Twitch';
});

const confirmUnlink = () => {
  showUnlinkWarning.value = false;
  emit('unlink');
};
</script>
