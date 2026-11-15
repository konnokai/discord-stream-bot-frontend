<template>
  <div class="drop-zone-wrap">
    <button
      ref="zone"
      type="button"
      class="drop-zone"
      :class="{ 'is-dragover': dragging, 'is-disabled': disabled }"
      :aria-disabled="disabled || undefined"
      @click="openPicker"
      @dragenter.prevent="onDragEnter"
      @dragover.prevent="onDragOver"
      @dragleave="onDragLeave"
      @drop.prevent="onDrop"
    >
      <Upload class="drop-icon" :size="22" aria-hidden="true" />
      <span class="drop-title">拖曳檔案到這裡</span>
      <span class="drop-hint">或點擊選擇 JPG／PNG</span>
    </button>

    <input
      ref="picker"
      class="sr-only"
      type="file"
      accept="image/jpeg,image/png"
      tabindex="-1"
      aria-hidden="true"
      @change="onPick"
    />

    <p v-if="hint" class="drop-note" role="status">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Upload } from '@lucide/vue';

const props = defineProps<{ disabled?: boolean }>();
const emit = defineEmits<{ file: [file: File] }>();

const maxBytes = 20 * 1024 * 1024;

const zone = ref<HTMLButtonElement | null>(null);
const picker = ref<HTMLInputElement | null>(null);
const dragging = ref(false);
const hint = ref('');
const animating = ref(false);
let dragDepth = 0;
let hintTimer: ReturnType<typeof setTimeout> | undefined;

const showHint = (text: string) => {
  hint.value = text;
  clearTimeout(hintTimer);
  hintTimer = setTimeout(() => (hint.value = ''), 2400);
};

const openPicker = () => {
  if (props.disabled) return;
  picker.value?.click();
};

// 手機原圖可能幾十 MB，解碼後更可觀，先擋掉比較安全
const accept = (file: File) => {
  const error = validate(file);
  if (error) {
    showHint(error);
    return;
  }
  emit('file', file);
};

const validate = (file: File): string | null => {
  if (!['image/jpeg', 'image/png'].includes(file.type))
    return '只支援 JPG 或 PNG';
  if (file.size > maxBytes) return '檔案太大，請選 20MB 以下的圖片';
  return null;
};

const onPick = () => {
  const file = picker.value?.files?.[0];
  if (picker.value) picker.value.value = '';
  if (file) accept(file);
};

const onDragEnter = () => {
  if (props.disabled) return;
  dragDepth += 1;
  dragging.value = true;
};

const onDragOver = () => {
  if (!props.disabled) dragging.value = true;
};

const onDragLeave = () => {
  dragDepth = Math.max(0, dragDepth - 1);
  if (dragDepth === 0) dragging.value = false;
};

const onDrop = (event: DragEvent) => {
  dragDepth = 0;
  dragging.value = false;
  if (props.disabled) return;

  const file = event.dataTransfer?.files?.[0];
  if (!file) return;

  // 先檢查再播動畫，不然被拒絕的檔案也會看起來像收到了
  const error = validate(file);
  if (error) {
    showHint(error);
    return;
  }
  bounceThenEmit(file);
};

// 放下時輕彈一下再開裁切，動畫只是收到檔案的確認。
const bounceThenEmit = (file: File) => {
  const element = zone.value;
  if (
    animating.value ||
    !element ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    if (!animating.value) accept(file);
    return;
  }

  animating.value = true;
  element
    .animate(
      [
        { transform: 'scale(1)' },
        { transform: 'scale(0.985)' },
        { transform: 'scale(1)' }
      ],
      { duration: 180, easing: 'ease-out' }
    )
    .finished.then(
      () => {
        animating.value = false;
        accept(file);
      },
      () => {
        animating.value = false;
      }
    );
};
</script>

<style scoped>
/* stylelint-disable-next-line at-rule-no-unknown */
@reference '../index.css';

.drop-zone {
  @apply flex w-full flex-col items-center justify-center gap-1 rounded border border-dashed border-zinc-600 bg-zinc-900/40 px-4 py-5 text-center text-zinc-400 transition-colors hover:border-indigo-400 hover:text-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300;
}

.drop-zone.is-dragover {
  @apply border-solid border-indigo-400 bg-indigo-500/10 text-zinc-100;
}

.drop-zone.is-disabled {
  @apply cursor-not-allowed opacity-60;
}

.drop-icon {
  @apply transition-transform duration-200;
}

.drop-zone.is-dragover .drop-icon {
  @apply -translate-y-1 text-indigo-300;
}

.drop-title {
  @apply text-sm font-medium;
}

.drop-hint {
  @apply text-xs text-zinc-500;
}

.drop-zone.is-dragover .drop-hint {
  @apply text-indigo-200;
}

.drop-note {
  @apply mt-2 text-xs text-amber-200;
}
</style>
