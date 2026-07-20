<template>
  <div class="text-center">
    <p class="text-5xl mb-3 flex justify-center items-center">
      <img src="/DYML.png" class="w-20 h-20 mr-2" alt="直播小幫手" />
      Member Link
    </p>
    <div class="h-3"></div>
    <p>這是一個可自動驗證會員的應用程式</p>
    <p>
      請先完成
      <strong class="text-indigo-400">Discord</strong>
      登入，再依照需要選擇連結
      <strong class="text-red-400">YouTube (Google 帳戶)</strong>
      或
      <strong class="text-purple-300">Twitch</strong>
    </p>
    <p>兩個平台皆為選用，也可以同時連結</p>
    <p>
      若您的伺服器未提供說明，可
      <a
        href="https://konnokai.notion.site/e69c579dc0ae4ff69866946d7dc36b8f"
        class="text-sm text-indigo-300 underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        參考此頁面
      </a>
    </p>
    <p class="mt-2">Discord 登入後會顯示您目前的平台連結狀態</p>
  </div>

  <div class="h-6"></div>
  <div class="flex justify-center">
    <div class="w-full sm:w-1/2">
      <DiscordSection @auth="handleDiscordAuth" />
      <p
        v-if="needsDiscordRelogin"
        class="rounded bg-amber-900 p-3 text-sm text-amber-100 text-center"
      >
        Discord 登入已失效，請重新登入後再進行帳號連結。
      </p>
    </div>
  </div>

  <div v-if="hasDiscordAccessToken" class="mt-2">
    <Async
      :loading="isAccountLinksFetching"
      :remain-content="hasAccountLinksLoadError"
      class="w-full"
    >
      <div
        v-if="hasAccountLinksLoadError"
        class="mx-2 mb-3 rounded bg-amber-900 p-4 text-sm text-amber-100"
      >
        <p>
          無法取得最新的平台連結資訊。您仍可嘗試連結 Google 或
          Twitch，也可以重新向後端取得目前狀態。
        </p>
        <div class="mt-3 flex justify-center">
          <button
            class="btn bg-amber-700 active:bg-amber-600 disabled:opacity-60"
            :disabled="isAccountLinksFetching || isProviderPending"
            @click="retryAccountLinks"
          >
            {{
              isAccountLinksFetching ? '正在重新取得...' : '重新取得連結資訊'
            }}
          </button>
        </div>
      </div>
      <div class="flex flex-wrap justify-center">
        <div class="w-full lg:w-1/2 p-2">
          <GoogleSection
            :account="accountLinks.google"
            :status="googleStatus"
            :is-starting="startingProvider === 'google'"
            :is-unlinking="unlinkingProvider === 'google'"
            :is-pending="isProviderPending || isAccountLinksFetching"
            @start="startProvider('google')"
            @unlink="unlinkProvider('google')"
          />
        </div>
        <div class="w-full lg:w-1/2 p-2">
          <TwitchSection
            :account="accountLinks.twitch"
            :status="twitchStatus"
            :is-starting="startingProvider === 'twitch'"
            :is-unlinking="unlinkingProvider === 'twitch'"
            :is-pending="isProviderPending || isAccountLinksFetching"
            @start="startProvider('twitch')"
            @unlink="unlinkProvider('twitch')"
          />
        </div>
      </div>
    </Async>
  </div>

  <Teleport to="body">
    <Transition name="toast">
      <div v-if="errorText" class="toast bg-red-600">{{ errorText }}</div>
    </Transition>
  </Teleport>

  <Teleport to="body">
    <Transition name="toast">
      <div v-if="toastText" class="toast bg-teal-600">{{ toastText }}</div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, inject, provide, ref, watch } from 'vue';
import Async from '../components/Async.vue';
import DiscordSection from '../components/DiscordSection.vue';
import GoogleSection from '../components/GoogleSection.vue';
import TwitchSection from '../components/TwitchSection.vue';
import {
  AccountLinksApiError,
  getAccountLinks,
  startOAuth,
  unlinkAccount
} from '../lib/accountLinks';
import type {
  AccountLinks,
  GoogleViewStatus,
  TwitchViewStatus
} from '../lib/accountLinks';

type Provider = 'google' | 'twitch';
type OAuthResult = 'success' | 'error';

interface OAuthCallback {
  provider: Provider;
  result: OAuthResult;
  reason: string | null;
}

interface StoredOAuthCallback extends OAuthCallback {
  createdAt: number;
}

const apiURL = inject<string>('apiURL');
if (!apiURL) throw new Error('缺少 API 網址設定');

const emptyAccountLinks = (): AccountLinks => ({
  google: { status: 'unlinked' },
  twitch: { status: 'unlinked' }
});
const accountLinks = ref<AccountLinks>(emptyAccountLinks());
const hasDiscordAccessToken = ref(false);
const hasFetchedAccountLinks = ref(false);
const isAccountLinksFetching = ref(false);
const hasAccountLinksLoadError = ref(false);
const startingProvider = ref<Provider | null>(null);
const unlinkingProvider = ref<Provider | null>(null);
const googleStatusOverride = ref<GoogleViewStatus | null>(null);
const twitchStatusOverride = ref<TwitchViewStatus | null>(null);

const errorText = ref('');
const toastText = ref('');

const toast = (msg: string): void => {
  toastText.value = msg;
};
toast.error = (msg: string): void => {
  errorText.value = msg;
};

provide('toast', toast);

const callbackReasonMessages: Record<string, string> = {
  authorization_denied: '您已取消授權。',
  invalid_state: '授權驗證失敗，請重新開始授權。',
  state_expired: '授權流程已逾時，請重新開始授權。',
  state_not_found: '找不到授權流程，請重新開始授權。',
  token_exchange_failed: '無法完成授權交換，請稍後重試。',
  profile_fetch_failed: '無法取得帳號資料，請稍後重試。',
  invalid_client: '授權應用程式驗證失敗，請聯絡管理員。',
  invalid_scope: '授權範圍不正確，請重新開始授權。',
  account_conflict: '此帳號已連結至其他使用者。',
  save_failed: '無法保存連結資料，請稍後重試。',
  provider_unavailable: '授權服務暫時無法使用，請稍後重試。',
  provider_validation_failed: '無法驗證授權帳號，請重新開始授權。',
  missing_code: '授權服務未回傳授權碼，請重新開始授權。',
  server_error: '伺服器處理授權時發生錯誤，請稍後重試。'
};

const oauthCallbackStorageKey = 'providerOAuthCallback';
const oauthCallbackMaxAgeMs = 10 * 60 * 1000;

const readOAuthCallback = (): OAuthCallback | null => {
  const url = new URL(location.href);
  const hasCallbackQuery = ['provider', 'result', 'reason'].some((key) =>
    url.searchParams.has(key)
  );
  const provider = url.searchParams.get('provider');
  const result = url.searchParams.get('result');
  const reason = url.searchParams.get('reason');

  if (hasCallbackQuery) {
    url.searchParams.delete('provider');
    url.searchParams.delete('result');
    url.searchParams.delete('reason');
    window.history.replaceState(
      {},
      '',
      `${url.pathname}${url.search}${url.hash}`
    );

    if (
      (provider !== 'google' && provider !== 'twitch') ||
      (result !== 'success' && result !== 'error')
    ) {
      sessionStorage.removeItem(oauthCallbackStorageKey);
      return null;
    }

    const callback: StoredOAuthCallback = {
      provider,
      result,
      reason,
      createdAt: Date.now()
    };
    sessionStorage.setItem(oauthCallbackStorageKey, JSON.stringify(callback));
    return callback;
  }

  const storedCallback = sessionStorage.getItem(oauthCallbackStorageKey);
  if (!storedCallback) return null;

  try {
    const callback = JSON.parse(storedCallback) as StoredOAuthCallback;
    if (
      (callback.provider !== 'google' && callback.provider !== 'twitch') ||
      (callback.result !== 'success' && callback.result !== 'error') ||
      typeof callback.createdAt !== 'number' ||
      Date.now() - callback.createdAt > oauthCallbackMaxAgeMs
    ) {
      sessionStorage.removeItem(oauthCallbackStorageKey);
      return null;
    }

    return callback;
  } catch {
    sessionStorage.removeItem(oauthCallbackStorageKey);
    return null;
  }
};

const oauthCallback = ref<OAuthCallback | null>(readOAuthCallback());
const needsDiscordRelogin = ref(
  oauthCallback.value !== null && !sessionStorage.getItem('DT')
);

const googleStatus = computed<GoogleViewStatus>(() => {
  if (
    googleStatusOverride.value &&
    accountLinks.value.google.status !== 'linked'
  )
    return googleStatusOverride.value;

  return accountLinks.value.google.status;
});

const twitchStatus = computed<TwitchViewStatus>(() => {
  if (
    twitchStatusOverride.value &&
    accountLinks.value.twitch.status !== 'linked'
  )
    return twitchStatusOverride.value;

  return accountLinks.value.twitch.status;
});

const isProviderPending = computed(
  () => startingProvider.value !== null || unlinkingProvider.value !== null
);

const resetDiscordSession = () => {
  sessionStorage.removeItem('DT');
  sessionStorage.removeItem('DD');
  accountLinks.value = emptyAccountLinks();
  hasDiscordAccessToken.value = false;
  hasFetchedAccountLinks.value = false;
  isAccountLinksFetching.value = false;
  hasAccountLinksLoadError.value = false;
  startingProvider.value = null;
  unlinkingProvider.value = null;
  googleStatusOverride.value = null;
  twitchStatusOverride.value = null;

  const url = new URL(location.href);
  url.searchParams.delete('provider');
  url.searchParams.delete('result');
  url.searchParams.delete('reason');
  window.location.replace(`${url.pathname}${url.search}${url.hash}`);
};

const handleUnauthorized = (error: unknown): boolean => {
  if (!(error instanceof AccountLinksApiError) || error.status !== 401)
    return false;

  resetDiscordSession();
  return true;
};

const refreshAccountLinks = async (): Promise<boolean> => {
  if (isAccountLinksFetching.value) return false;

  const discordToken = sessionStorage.getItem('DT');
  if (!discordToken) return false;

  isAccountLinksFetching.value = true;

  try {
    accountLinks.value = await getAccountLinks(apiURL, discordToken);
    googleStatusOverride.value = null;
    twitchStatusOverride.value = null;
    hasAccountLinksLoadError.value = false;
    return true;
  } catch (error: unknown) {
    if (handleUnauthorized(error)) return false;

    googleStatusOverride.value = 'error';
    twitchStatusOverride.value = 'error';
    hasAccountLinksLoadError.value = true;
    toast.error('無法取得帳號連結狀態，請稍後重試。');
    return false;
  } finally {
    isAccountLinksFetching.value = false;
  }
};

const retryAccountLinks = async () => {
  if (isAccountLinksFetching.value || isProviderPending.value) return;

  if (await refreshAccountLinks()) {
    if (!handleOAuthCallback(true)) toast('帳號連結資訊已更新。');
  }
};

const handleOAuthCallback = (statusLoaded: boolean): boolean => {
  const callback = oauthCallback.value;
  if (!callback) return false;

  if (!statusLoaded) {
    if (callback.provider === 'google') googleStatusOverride.value = 'error';
    else twitchStatusOverride.value = 'error';

    toast.error('目前無法確認授權結果，請重新取得連結資訊。');
    return true;
  }

  if (callback.result === 'success') {
    const isLinked = accountLinks.value[callback.provider].status === 'linked';

    if (!isLinked) {
      if (callback.provider === 'google') googleStatusOverride.value = 'error';
      else twitchStatusOverride.value = 'error';
      toast.error('授權狀態未同步或連結失敗，請重新嘗試。');
    } else
      toast(
        callback.provider === 'google'
          ? 'Google 已成功連結，可使用 YouTube 會員驗證功能。'
          : 'Twitch 已成功連結，可使用自己的 Twitch 直播爬蟲功能。'
      );
  } else {
    if (
      callback.provider === 'google' &&
      accountLinks.value.google.status !== 'linked'
    )
      googleStatusOverride.value = 'error';
    if (
      callback.provider === 'twitch' &&
      accountLinks.value.twitch.status !== 'linked'
    )
      twitchStatusOverride.value = 'error';

    toast.error(
      callbackReasonMessages[callback.reason || ''] ||
        '授權流程發生錯誤，請重新嘗試。'
    );
  }

  sessionStorage.removeItem(oauthCallbackStorageKey);
  oauthCallback.value = null;
  return true;
};

const handleDiscordAuth = async (isAuthed: boolean) => {
  hasDiscordAccessToken.value = isAuthed;
  if (isAuthed) needsDiscordRelogin.value = false;
  else if (oauthCallback.value) needsDiscordRelogin.value = true;
  if (!isAuthed || hasFetchedAccountLinks.value) return;

  hasFetchedAccountLinks.value = true;
  const statusLoaded = await refreshAccountLinks();
  handleOAuthCallback(statusLoaded);
};

const startProvider = async (provider: Provider) => {
  if (isProviderPending.value || isAccountLinksFetching.value) return;

  const discordToken = sessionStorage.getItem('DT');
  if (!discordToken) {
    toast.error('請先完成 Discord 登入。');
    return;
  }

  startingProvider.value = provider;
  if (provider === 'google') googleStatusOverride.value = 'authorizing';
  else twitchStatusOverride.value = 'authorizing';

  try {
    const { authorizationUrl } = await startOAuth(
      apiURL,
      discordToken,
      provider
    );
    const targetUrl = new URL(authorizationUrl);
    if (targetUrl.protocol !== 'https:' && targetUrl.protocol !== 'http:')
      throw new Error('invalid_authorization_url');

    window.location.assign(targetUrl.href);
  } catch (error: unknown) {
    startingProvider.value = null;
    if (handleUnauthorized(error)) return;

    if (provider === 'google') googleStatusOverride.value = 'error';
    else twitchStatusOverride.value = 'error';
    toast.error(
      provider === 'google'
        ? '無法開始 Google 授權，請稍後重試。'
        : '無法開始 Twitch 授權，請稍後重試。'
    );
  }
};

const unlinkProvider = async (provider: Provider) => {
  if (isProviderPending.value || isAccountLinksFetching.value) return;

  const discordToken = sessionStorage.getItem('DT');
  if (!discordToken) {
    toast.error('請先完成 Discord 登入。');
    return;
  }

  unlinkingProvider.value = provider;

  try {
    await unlinkAccount(apiURL, discordToken, provider);
  } catch (error: unknown) {
    if (handleUnauthorized(error)) return;

    toast.error(
      provider === 'google'
        ? '無法解除 Google 綁定，請稍後重試。'
        : '無法解除 Twitch 連結，請稍後重試。'
    );
    unlinkingProvider.value = null;
    return;
  }

  if (provider === 'google') {
    accountLinks.value = {
      ...accountLinks.value,
      google: { status: 'unlinked' }
    };
    toast('Google 已解除連結，YouTube 會員驗證功能將無法使用。');
  } else {
    accountLinks.value = {
      ...accountLinks.value,
      twitch: { ...accountLinks.value.twitch, status: 'revoked' }
    };
    toast('Twitch 已解除連結，後續將依直播與伺服器狀態安全清理。');
  }

  unlinkingProvider.value = null;
  await refreshAccountLinks();
};

watch(errorText, () => {
  setTimeout(() => {
    errorText.value = '';
  }, 3000);
});

watch(toastText, () => {
  setTimeout(() => {
    toastText.value = '';
  }, 3000);
});
</script>
