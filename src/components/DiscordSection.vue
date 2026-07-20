<template>
  <div class="w-full">
    <div class="flex justify-center items-center">
      <div class="relative">
        <button
          class="btn"
          :class="{
            'bg-indigo-600': !isAuthed,
            'active:bg-indigo-500': !isAuthed,
            'bg-transparent': isAuthed,
            outline: isAuthed,
            'text-indigo-500': isAuthed,
            'outline-indigo-500': isAuthed,
            'cursor-default': isAuthed
          }"
          @click="openDiscord"
        >
          {{ isAuthed ? '已驗證' : '開始驗證' }} discord
        </button>

        <svg
          v-if="isAuthed"
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5 inline absolute top-1/2 -translate-y-1/2"
          style="left: calc(100% + 8px)"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fill-rule="evenodd"
            d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clip-rule="evenodd"
          />
        </svg>
      </div>
    </div>

    <div class="flex mb-5">
      <Async :loading="isFetching" class="flex justify-center w-full">
        <div
          v-if="isAuthed"
          class="info_card card bg-zinc-900 my-3 mx-auto sm:mx-0"
        >
          <div class="w-full">
            <div
              class="discord_banner w-full"
              :class="{ got_banner: !isNoBanner(userInfo) }"
              :style="{ backgroundColor: userInfo.banner_color }"
            >
              <img
                v-if="!isNoBanner(userInfo)"
                :src="`https://cdn.discordapp.com/banners/${userInfo.id}/${userInfo.banner}?size=320`"
                class="w-full"
              />
            </div>
            <div class="p-3 relative">
              <div
                class="w-24 h-24 bg-zinc-900 p-1 absolute -top-12 rounded-full flex justify-center items-center"
              >
                <img
                  :src="`https://cdn.discordapp.com/avatars/${userInfo.id}/${userInfo.avatar}?size=96`"
                  class="rounded-full"
                />
              </div>
              <div class="h-12"></div>
              <div>
                <span class="font-bold text-white">
                  {{ userInfo.username }}
                </span>
                <span
                  v-if="isShowDiscriminator(userInfo)"
                  class="font-bold text-zinc-400"
                >
                  #{{ userInfo.discriminator }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Async>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, ref } from 'vue';
import Async from './Async.vue';

const discordClientId = inject('discordClientId');
const apiURL = inject('apiURL');

interface DiscordUser {
  accent_color: string;
  avatar: string;
  banner: string;
  banner_color: string;
  discriminator: string;
  flags: number;
  id: string;
  locale: string;
  mfa_enabled: boolean;
  premium_type: number;
  public_flags: number;
  username: string;
}

interface Toast {
  (message: string): void;
  error(message: string): void;
}

const toast = inject<Toast>('toast');
if (!toast) throw new Error('缺少通知服務設定');

const discordOAuthStateKey = 'discordOAuthState';
const emit = defineEmits(['auth']);
const userInfo = ref<DiscordUser>({} as DiscordUser);
const isFetching = ref<boolean>(false);

const isAuthed = computed<boolean>(() => !!userInfo.value.id);
const isNoBanner = (userInfo: DiscordUser): boolean =>
  userInfo.banner === null || userInfo.banner === 'null';
const isShowDiscriminator = (userInfo: DiscordUser): boolean =>
  userInfo.discriminator !== '0';

interface DiscordCallbackResponse {
  token: string;
  discordData: DiscordUser;
}

onMounted(async () => {
  const discordData = sessionStorage.getItem('DD');
  const discordToken = sessionStorage.getItem('DT');

  if (discordData && discordToken) {
    try {
      userInfo.value = JSON.parse(discordData) as DiscordUser;
    } catch {
      sessionStorage.removeItem('DT');
      sessionStorage.removeItem('DD');
    }
  } else if (discordData || discordToken) {
    sessionStorage.removeItem('DT');
    sessionStorage.removeItem('DD');
  }
  await fetchDiscordToken();

  emit('auth', !!sessionStorage.getItem('DT') && isAuthed.value);
});

interface DiscordTokenResponse {
  discordToken?: string;
  error?: unknown;
}

const fetchDiscordToken: AsyncFn<DiscordTokenResponse> = async () => {
  const currentUrl = new URL(location.href);
  const returnedState = currentUrl.searchParams.get('state');
  const discordCode = currentUrl.searchParams.get('code');

  if (!returnedState && !discordCode) return {};

  const expectedState = sessionStorage.getItem(discordOAuthStateKey);
  sessionStorage.removeItem(discordOAuthStateKey);
  if (!returnedState || !expectedState || returnedState !== expectedState) {
    currentUrl.searchParams.delete('code');
    currentUrl.searchParams.delete('state');
    window.history.replaceState(
      {},
      '',
      `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`
    );
    toast.error('Discord 登入驗證失敗，請重新嘗試。');
    return { error: 'invalid state' };
  }

  isFetching.value = true;

  try {
    if (!discordCode) throw new Error('Discord 登入回傳缺少授權碼。');

    const result = await fetch(`${apiURL}/oauth/discord/callback`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ code: discordCode })
    });

    if (!result.ok) throw result;

    const response = (await result.json()) as DiscordCallbackResponse;
    const discordToken = response.token;
    userInfo.value = response.discordData;

    sessionStorage.setItem('DT', discordToken);
    sessionStorage.setItem('DD', JSON.stringify(userInfo.value)); // DiscordData
    return { discordToken };
  } catch (error: unknown) {
    console.error(error);
    userInfo.value = {} as DiscordUser;
    sessionStorage.removeItem('DT');
    sessionStorage.removeItem('DD');
    toast.error('Discord 登入失敗，請重新嘗試。');
    return { error };
  } finally {
    currentUrl.searchParams.delete('code');
    currentUrl.searchParams.delete('state');
    window.history.replaceState(
      {},
      '',
      `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`
    );
    isFetching.value = false;
  }
};

const openDiscord = () => {
  if (isAuthed.value) return;
  const stateBytes = crypto.getRandomValues(new Uint8Array(32));
  const state = Array.from(stateBytes, (value) =>
    value.toString(16).padStart(2, '0')
  ).join('');
  sessionStorage.setItem(discordOAuthStateKey, state);

  const params = new URLSearchParams({
    client_id: String(discordClientId),
    redirect_uri: `${location.origin}/`,
    response_type: 'code',
    scope: 'identify',
    state
  });
  location.href = `https://discord.com/api/oauth2/authorize?${params}`;
};
</script>

<style lang="scss">
.discord_banner {
  min-height: 60px;
  &.got_banner {
    min-height: 120px;
  }
}
</style>
