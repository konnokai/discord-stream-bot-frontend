<template>
  <div class="role-mention-field">
    <label :for="fieldId">{{ label }}</label>
    <component
      :is="multiline ? 'textarea' : 'input'"
      :id="fieldId"
      ref="field"
      :value="modelValue"
      class="field"
      :class="{ 'min-h-24': multiline }"
      autocomplete="off"
      role="combobox"
      :aria-label="label"
      aria-autocomplete="list"
      :aria-expanded="menuOpen"
      :aria-controls="listboxId"
      :aria-activedescendant="activeOptionId"
      @input="handleInput"
      @click="refreshMenu"
      @keydown="handleKeydown"
      @blur="closeMenu"
    ></component>
    <div v-if="menuOpen" :id="listboxId" class="role-menu" role="listbox">
      <button
        v-for="(role, index) in filteredRoles"
        :id="`${listboxId}-${index}`"
        :key="role.id"
        type="button"
        class="role-option"
        :class="{ active: index === activeIndex }"
        role="option"
        :aria-selected="index === activeIndex"
        @mouseenter="activeIndex = index"
        @mousedown.prevent
        @click="selectRole(role)"
      >
        <span class="truncate">@{{ role.name }}</span>
        <span class="shrink-0 text-xs text-zinc-500">{{ role.id }}</span>
      </button>
      <p v-if="filteredRoles.length === 0" class="px-3 py-2 text-zinc-400">
        找不到身分組
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, useId } from 'vue';
import type { AdminRole } from '../lib/adminSettings';

const props = withDefaults(
  defineProps<{
    label: string;
    modelValue: string;
    roles: AdminRole[];
    multiline?: boolean;
  }>(),
  { multiline: false }
);
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();

const id = useId();
const fieldId = `role-mention-${id}`;
const listboxId = `${fieldId}-listbox`;
const field = ref<HTMLInputElement | HTMLTextAreaElement | null>(null);
const menuOpen = ref(false);
const query = ref('');
const mentionStart = ref(0);
const activeIndex = ref(0);
const filteredRoles = computed(() => {
  const normalized = query.value.trim().toLocaleLowerCase();
  return props.roles
    .filter(
      (role) =>
        !role.everyone && role.name.toLocaleLowerCase().includes(normalized)
    )
    .toSorted((left, right) => right.position - left.position);
});
const activeOptionId = computed(() =>
  menuOpen.value && filteredRoles.value.length > 0
    ? `${listboxId}-${activeIndex.value}`
    : undefined
);

const updateMenu = (value: string, caret: number) => {
  const match = value
    .slice(0, caret)
    .match(/(?:^|\s)@([^@<>\n]*)$/);
  if (!match) {
    closeMenu();
    return;
  }
  mentionStart.value = (match.index || 0) + match[0].lastIndexOf('@');
  query.value = match[1];
  activeIndex.value = 0;
  menuOpen.value = true;
};
const handleInput = (event: Event) => {
  const target = event.currentTarget as HTMLInputElement | HTMLTextAreaElement;
  emit('update:modelValue', target.value);
  updateMenu(target.value, target.selectionStart ?? target.value.length);
};
const refreshMenu = () => {
  const target = field.value;
  if (target)
    updateMenu(target.value, target.selectionStart ?? target.value.length);
};
const closeMenu = () => {
  menuOpen.value = false;
};
const selectRole = (role: AdminRole) => {
  const target = field.value;
  if (!target) return;
  const caret = target.selectionStart ?? target.value.length;
  const mention = `<@&${role.id}>`;
  const value = `${target.value.slice(0, mentionStart.value)}${mention} ${target.value.slice(caret)}`;
  const nextCaret = mentionStart.value + mention.length + 1;
  emit('update:modelValue', value);
  closeMenu();
  nextTick(() => {
    target.focus();
    target.setSelectionRange(nextCaret, nextCaret);
  });
};
const handleKeydown = (event: KeyboardEvent) => {
  if (!menuOpen.value) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    closeMenu();
    return;
  }
  if (filteredRoles.value.length === 0) return;
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    const direction = event.key === 'ArrowDown' ? 1 : -1;
    activeIndex.value =
      (activeIndex.value + direction + filteredRoles.value.length) %
      filteredRoles.value.length;
  } else if (event.key === 'Enter') {
    event.preventDefault();
    selectRole(filteredRoles.value[activeIndex.value]);
  }
};
</script>

<style scoped>
/* stylelint-disable-next-line at-rule-no-unknown */
@reference '../index.css';

.role-mention-field {
  @apply relative grid gap-1 text-sm font-medium text-zinc-200;
}

.field {
  @apply w-full rounded border border-zinc-600 bg-neutral-800 px-3 py-2 text-zinc-100;
  @apply focus:border-indigo-400 focus:outline-2 focus:outline-offset-2 focus:outline-indigo-300;
}

.role-menu {
  @apply absolute top-full left-0 z-50 mt-1 max-h-56 w-full min-w-64 overflow-y-auto rounded border border-zinc-600 bg-neutral-800 py-1 text-sm shadow-lg;
}

.role-option {
  @apply flex min-h-10 w-full items-center justify-between gap-3 px-3 py-2 text-left text-zinc-200;
}

.role-option.active {
  @apply bg-indigo-950 text-white;
}
</style>
