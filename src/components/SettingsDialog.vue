<template>
  <dialog
    ref="dialog"
    class="settings-dialog"
    tabindex="-1"
    :aria-labelledby="titleId"
    @cancel="onCancel"
    @close="emit('close')"
  >
    <header class="dialog-header">
      <h2 :id="titleId">{{ title }}</h2>
      <button
        type="button"
        class="dialog-close"
        aria-label="關閉"
        @click="emit('cancel')"
      >
        <X :size="20" aria-hidden="true" />
      </button>
    </header>
    <div class="dialog-body">
      <slot />
    </div>
  </dialog>
</template>

<script setup lang="ts">
import { onMounted, ref, useId } from 'vue';
import { X } from '@lucide/vue';

defineProps<{ title: string }>();
// cancel：使用者想關（Esc、叉叉），由父層決定要不要關；close：瀏覽器已經關掉了，父層只能跟著卸載
const emit = defineEmits<{ cancel: []; close: [] }>();

const dialog = ref<HTMLDialogElement | null>(null);
const titleId = useId();
// 連按 Esc 中間沒有其他操作時，瀏覽器不准擋，對話框一定會關；這時問「要不要關」沒有意義
const onCancel = (event: Event) => {
  if (!event.cancelable) return;
  event.preventDefault();
  emit('cancel');
};

// 由父層用 v-if 控制顯示；掛載就開啟
onMounted(() => {
  dialog.value?.showModal();
  // showModal 會把焦點給叉叉，iOS 會替它畫焦點框，看起來像按鈕卡在按下的狀態；改給對話框本身
  dialog.value?.focus();
});
</script>

<style scoped>
/* stylelint-disable-next-line at-rule-no-unknown */
@reference '../index.css';

.settings-dialog {
  @apply m-auto w-full max-w-2xl rounded-lg border border-zinc-700 bg-zinc-900 p-0 text-zinc-200 shadow-2xl;

  max-height: calc(100dvh - 4rem);
}

/* 開啟時焦點在對話框本身，外框沒有意義 */
.settings-dialog:focus {
  outline: none;
}

.settings-dialog[open] {
  @apply flex flex-col;
}

.settings-dialog::backdrop {
  background: rgb(0 0 0 / 70%);
}

.dialog-header {
  @apply flex items-center justify-between gap-3 border-b border-zinc-700 px-5 py-3;
}

.dialog-header h2 {
  @apply text-lg font-bold text-white;
}

.dialog-close {
  @apply flex h-11 w-11 shrink-0 items-center justify-center rounded text-zinc-400 hover:bg-zinc-800 hover:text-white focus-visible:outline-2 focus-visible:outline-indigo-300;
}

.dialog-body {
  @apply min-h-0 overflow-y-auto p-5;
}

@media (width < 48rem) {
  .settings-dialog {
    @apply h-dvh max-h-dvh max-w-none rounded-none border-0;
  }
}
</style>
