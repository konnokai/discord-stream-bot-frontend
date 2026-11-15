<template>
  <SettingsDialog :title="title" @cancel="emit('cancel')" @close="emit('close')">
    <div class="crop">
      <div ref="stage" class="crop-stage">
        <canvas
          ref="canvas"
          class="crop-canvas"
          tabindex="0"
          aria-label="拖曳調整圖片位置，方向鍵可微調"
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
          @pointerup="onPointerUp"
          @pointercancel="onPointerUp"
          @keydown="onKeyDown"
        />
      </div>
      <p v-if="failed" class="crop-error">
        這張圖片讀不進來，請換一張 JPG 或 PNG。
      </p>
      <p v-else-if="tooLarge" class="crop-error">
        壓縮後還是太大，請換一張圖片。
      </p>
      <p v-else class="crop-hint">拖曳圖片調整位置，方向鍵可微調</p>
      <div class="crop-controls">
        <label class="crop-control">
          <span>旋轉</span>
          <input
            v-model.number="rotation"
            type="range"
            min="-180"
            max="180"
            step="1"
            @input="onControl"
          />
          <span class="crop-value">{{ rotation }}°</span>
        </label>
        <label class="crop-control">
          <span>縮放</span>
          <input
            v-model.number="zoom"
            type="range"
            min="1"
            max="3"
            step="0.01"
            @input="onControl"
          />
          <span class="crop-value">{{ zoom.toFixed(2) }}×</span>
        </label>
        <div class="crop-tools">
          <button
            type="button"
            class="crop-tool"
            :aria-pressed="flipped"
            @click="toggleFlip"
          >
            <FlipHorizontal :size="16" aria-hidden="true" />
            水平翻轉
          </button>
          <button type="button" class="crop-tool" @click="reset">
            <RotateCcw :size="16" aria-hidden="true" />
            重設
          </button>
        </div>
      </div>
    </div>
    <div class="crop-actions">
      <button
        type="button"
        class="btn bg-zinc-700 active:bg-zinc-600"
        @click="emit('cancel')"
      >
        取消
      </button>
      <button
        type="button"
        class="btn bg-indigo-600 active:bg-indigo-500"
        :disabled="!ready"
        @click="apply"
      >
        套用
      </button>
    </div>
  </SettingsDialog>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { FlipHorizontal, RotateCcw } from '@lucide/vue';
import SettingsDialog from './SettingsDialog.vue';

const props = defineProps<{
  file: File;
  shape: 'circle' | 'banner';
  title: string;
  outputWidth: number;
  outputHeight: number;
}>();

const emit = defineEmits<{ apply: [dataUrl: string]; cancel: []; close: [] }>();

const stage = ref<HTMLDivElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);
const zoom = ref(1);
const rotation = ref(0);
const flipped = ref(false);
const offset = reactive({ x: 0, y: 0 });
const view = reactive({ w: 0, h: 0, cropW: 0, cropH: 0 });
const ready = ref(false);
const failed = ref(false);
const tooLarge = ref(false);

let bitmap: ImageBitmap | null = null;
let context: CanvasRenderingContext2D | null = null;
let pointer: { id: number; x: number; y: number } | null = null;
let disposed = false;

const jpegQuality = 0.86;

onMounted(async () => {
  let decoded: ImageBitmap;
  try {
    decoded = await createImageBitmap(props.file);
  } catch {
    failed.value = true;
    return;
  }
  // 解碼期間使用者可能已經取消，這時要把剛解好的圖關掉，不然沒人會回收。
  if (disposed) {
    decoded.close();
    return;
  }
  bitmap = decoded;
  resize();
  window.addEventListener('resize', resize);
  ready.value = true;
  draw();
});

onBeforeUnmount(() => {
  disposed = true;
  window.removeEventListener('resize', resize);
  bitmap?.close();
});

// 舞台比裁切框大，使用者才看得到框外的圖；框外壓暗，框內是會送出的範圍。
const resize = () => {
  if (!bitmap) return;
  const available = Math.min(
    stage.value?.clientWidth || 320,
    props.shape === 'circle' ? 360 : 560
  );
  const width = Math.max(200, available);
  view.cropW = props.shape === 'circle' ? width - 80 : width;
  view.cropH =
    props.shape === 'circle' ? view.cropW : (view.cropW * 6) / 17;
  view.w = width;
  view.h = Math.round(view.cropH + (props.shape === 'circle' ? 80 : 96));

  const element = canvas.value;
  if (!element) return;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  element.width = Math.round(view.w * ratio);
  element.height = Math.round(view.h * ratio);
  element.style.width = `${view.w}px`;
  element.style.height = `${view.h}px`;
  context = element.getContext('2d');
  context?.setTransform(ratio, 0, 0, ratio, 0, 0);

  clampOffset();
  draw();
};

// 旋轉之後，畫面上看不到的斜角會變大，所以要連旋轉角度一起算最小縮放。
const geometry = () => {
  const image = bitmap;
  if (!image) return { scale: 1, rad: 0, cos: 1, sin: 0 };
  const rad = (rotation.value * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  const { cropW, cropH } = view;
  const cover = Math.max(cropW / image.width, cropH / image.height);
  const rotated = Math.max(
    (cropW * cos + cropH * sin) / image.width,
    (cropW * sin + cropH * cos) / image.height
  );
  return {
    scale: Math.max(cover, rotated) * zoom.value,
    rad,
    cos,
    sin
  };
};

const clampOffset = () => {
  const image = bitmap;
  if (!image) return;
  const { scale, rad, cos, sin } = geometry();
  const halfX = (view.cropW * cos + view.cropH * sin) / 2;
  const halfY = (view.cropW * sin + view.cropH * cos) / 2;
  const maxX = Math.max(0, (scale * image.width) / 2 - halfX - 1);
  const maxY = Math.max(0, (scale * image.height) / 2 - halfY - 1);

  // 位移是畫面座標，上下限是圖片座標；先轉到圖片座標夾好再轉回來，
  // 直接用畫面座標夾會在旋轉時算錯，匯出的圖就露出背景。
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  const localX = offset.x * c + offset.y * s;
  const localY = -offset.x * s + offset.y * c;
  const clampedX = Math.min(maxX, Math.max(-maxX, localX));
  const clampedY = Math.min(maxY, Math.max(-maxY, localY));
  offset.x = clampedX * c - clampedY * s;
  offset.y = clampedX * s + clampedY * c;
};

const cropPath = (ctx: CanvasRenderingContext2D) => {
  const left = (view.w - view.cropW) / 2;
  const top = (view.h - view.cropH) / 2;
  ctx.beginPath();
  if (props.shape === 'circle')
    ctx.arc(view.w / 2, view.h / 2, view.cropW / 2, 0, Math.PI * 2);
  else ctx.rect(left, top, view.cropW, view.cropH);
};

const drawImage = (ctx: CanvasRenderingContext2D, scale: number, rad: number) => {
  const image = bitmap;
  if (!image) return;
  ctx.translate(view.w / 2 + offset.x, view.h / 2 + offset.y);
  ctx.rotate(rad);
  ctx.scale(flipped.value ? -1 : 1, 1);
  ctx.drawImage(
    image,
    (-image.width * scale) / 2,
    (-image.height * scale) / 2,
    image.width * scale,
    image.height * scale
  );
};

const draw = () => {
  const ctx = context;
  const image = bitmap;
  if (!ctx || !image) return;

  const { scale, rad } = geometry();
  ctx.clearRect(0, 0, view.w, view.h);
  ctx.fillStyle = '#18181b';
  ctx.fillRect(0, 0, view.w, view.h);

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, view.w, view.h);
  ctx.clip();
  drawImage(ctx, scale, rad);
  ctx.restore();

  // 裁切框外壓暗，讓使用者只看框內
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, view.w, view.h);
  cropPath(ctx);
  ctx.fillStyle = 'rgba(9, 9, 11, 0.62)';
  ctx.fill('evenodd');
  ctx.restore();

  ctx.save();
  cropPath(ctx);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  const left = (view.w - view.cropW) / 2;
  const top = (view.h - view.cropH) / 2;
  ctx.save();
  cropPath(ctx);
  ctx.clip();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 1;
  for (let i = 1; i <= 2; i += 1) {
    ctx.beginPath();
    ctx.moveTo(left + (view.cropW * i) / 3, top);
    ctx.lineTo(left + (view.cropW * i) / 3, top + view.cropH);
    ctx.moveTo(left, top + (view.cropH * i) / 3);
    ctx.lineTo(left + view.cropW, top + (view.cropH * i) / 3);
    ctx.stroke();
  }
  ctx.restore();
};

const onControl = () => {
  clampOffset();
  draw();
};

const onPointerDown = (event: PointerEvent) => {
  if (!ready.value) return;
  event.preventDefault();
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
};

const onPointerMove = (event: PointerEvent) => {
  if (!pointer || pointer.id !== event.pointerId) return;
  offset.x += event.clientX - pointer.x;
  offset.y += event.clientY - pointer.y;
  pointer = { id: pointer.id, x: event.clientX, y: event.clientY };
  clampOffset();
  draw();
};

const onPointerUp = () => {
  pointer = null;
};

// 拖曳只有滑鼠和觸控吃得到，鍵盤用方向鍵微調
const onKeyDown = (event: KeyboardEvent) => {
  const step = event.shiftKey ? 24 : 8;
  const moves: Record<string, [number, number]> = {
    ArrowLeft: [-step, 0],
    ArrowRight: [step, 0],
    ArrowUp: [0, -step],
    ArrowDown: [0, step]
  };
  const move = moves[event.key];
  if (!move) return;
  event.preventDefault();
  offset.x += move[0];
  offset.y += move[1];
  clampOffset();
  draw();
};

const toggleFlip = () => {
  flipped.value = !flipped.value;
  draw();
};

const reset = () => {
  zoom.value = 1;
  rotation.value = 0;
  flipped.value = false;
  offset.x = 0;
  offset.y = 0;
  clampOffset();
  draw();
};

const apply = () => {
  const image = bitmap;
  if (!image) return;
  const output = document.createElement('canvas');
  output.width = props.outputWidth;
  output.height = props.outputHeight;
  const ctx = output.getContext('2d');
  if (!ctx) return;

  const ratio = props.outputWidth / view.cropW;
  const { scale, rad } = geometry();
  const drawScale = scale * ratio;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, output.width, output.height);
  ctx.translate(
    output.width / 2 + offset.x * ratio,
    output.height / 2 + offset.y * ratio
  );
  ctx.rotate(rad);
  ctx.scale(flipped.value ? -1 : 1, 1);
  ctx.drawImage(
    image,
    (-image.width * drawScale) / 2,
    (-image.height * drawScale) / 2,
    image.width * drawScale,
    image.height * drawScale
  );

  // 前端先壓在 256KB 以下，bot 端上限 512KB。
  tooLarge.value = false;
  let dataUrl = output.toDataURL('image/jpeg', jpegQuality);
  for (const quality of [0.7, 0.55]) {
    if (base64Size(dataUrl) <= 256 * 1024) break;
    dataUrl = output.toDataURL('image/jpeg', quality);
  }
  if (base64Size(dataUrl) > 512 * 1024) {
    tooLarge.value = true;
    return;
  }
  emit('apply', dataUrl);
};

const base64Size = (dataUrl: string) =>
  Math.round(((dataUrl.length - dataUrl.indexOf(',') - 1) * 3) / 4);
</script>

<style scoped>
/* stylelint-disable-next-line at-rule-no-unknown */
@reference '../index.css';

.crop-stage {
  @apply flex justify-center;
}

.crop-canvas {
  @apply block cursor-grab rounded bg-zinc-950;

  touch-action: none;
}

.crop-canvas:active {
  @apply cursor-grabbing;
}

.crop-canvas:focus-visible {
  @apply outline-2 outline-offset-2 outline-indigo-300;
}

.crop-error {
  @apply mt-3 text-sm text-red-300;
}

.crop-hint {
  @apply mt-2 text-center text-xs text-zinc-500;
}

.crop-controls {
  @apply mt-4 grid gap-3 text-sm text-zinc-300;
}

.crop-control {
  @apply grid grid-cols-[3rem_minmax(0,1fr)_3.5rem] items-center gap-3;
}

.crop-control input[type='range'] {
  @apply w-full accent-indigo-400;
}

.crop-value {
  @apply text-right text-xs text-zinc-400;

  font-variant-numeric: tabular-nums;
}

.crop-tools {
  @apply flex flex-wrap gap-2;
}

.crop-tool {
  @apply inline-flex min-h-11 items-center gap-2 rounded border border-zinc-600 px-3 text-sm text-zinc-300 hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-indigo-300;
}

.crop-tool[aria-pressed='true'] {
  @apply border-indigo-400 bg-indigo-500/15 text-white;
}

.crop-actions {
  @apply mt-5 flex justify-end gap-3 border-t border-zinc-700 pt-4;
}
</style>
