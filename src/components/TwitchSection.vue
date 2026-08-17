<template>
  <section class="card card-outline h-full bg-zinc-800 p-5 flex-col">
    <div class="flex items-center justify-between mb-4">
      <div>
        <div class="flex items-center gap-2">
          <p class="text-xl font-bold text-white">Twitch 直播爬蟲與訂閱驗證</p>
          <span class="rounded bg-purple-700 px-2 py-1 text-xs text-white">
            選用
          </span>
        </div>
        <p class="text-sm text-purple-300">
          連結後可使用訂閱驗證，並設定自己的 Twitch 直播爬蟲
        </p>
      </div>
      <span class="text-sm font-bold" :class="statusClass">
        {{ statusText }}
      </span>
    </div>

    <p class="text-sm leading-6 text-zinc-300 mb-4">
      完成 Discord 與 Twitch 帳號連結後，伺服器管理員會在 Discord
      設定驗證頻道與共用訂閱身分組；一般成員不需進行設定
    </p>
    <p class="text-sm leading-6 text-zinc-300 mb-4">
      管理員完成設定後，一般成員請回到 Discord 執行
      <code>/twitch-subscription check</code>
      ；Bot 會查詢您目前是否訂閱該頻道及訂閱層級，並授予共用與對應層級
      的訂閱身分組
    </p>
    <p class="text-sm leading-6 text-zinc-300 mb-5">
      此授權也可用來設定您的 Twitch 直播爬蟲。完成授權後，即使伺服器未滿 200
      人，也能新增自己的 Twitch 頻道爬蟲
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
      Twitch
      授權已失效，訂閱驗證會停止，系統也可能清理驗證時授予的身分組。若伺服器未滿
      200 人，系統也可能移除直播爬蟲；如果頻道正在直播，會等到直播結束後再移除
    </p>
    <p v-else-if="status === 'revoked'" class="text-sm text-amber-300 mb-4">
      Twitch
      授權已撤銷，訂閱驗證會停止，系統也可能清理驗證時授予的身分組。若要繼續使用訂閱驗證或直播爬蟲，請重新連結
      Twitch。伺服器未滿 200
      人時，系統也可能移除直播爬蟲；若頻道正在直播，會延後至關台後處理
    </p>
    <p v-else-if="status === 'error'" class="text-sm text-red-300 mb-4">
      無法完成 Twitch 授權或取得最新狀態，請稍後重試
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
        解除連結後，訂閱驗證會停止，系統可能清理驗證時授予的身分組。伺服器未滿
        200 人時，也可能自動移除 Twitch
        爬蟲；若頻道正在直播，會等到關台後再移除，以免漏掉直播更新與關台通知。原有通知設定仍會保留，但暫時不會生效
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
          {{ isUnlinking ? '解除中…' : '確認解除' }}
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
  if (props.isStarting || props.status === 'authorizing') return '授權中…';
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
