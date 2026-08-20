<template>
  <section class="settings-page">
    <div
      v-if="!hasDiscordToken"
      class="mb-6 flex flex-wrap items-end justify-between gap-3"
    >
      <div>
        <h1 class="text-2xl font-bold text-white">伺服器設定</h1>
        <p class="mt-1 text-sm text-zinc-400">
          選擇要管理的伺服器，就能更新各項設定
        </p>
      </div>
      <a href="/" data-spa-link class="text-sm text-indigo-300 underline">
        返回帳號連結
      </a>
    </div>

    <div
      v-if="!hasDiscordToken"
      class="rounded bg-amber-900/70 p-4 text-amber-100"
    >
      <p>請先登入 Discord，才能查看可管理的伺服器。</p>
      <a
        href="/"
        class="mt-3 inline-block underline"
        @click.prevent="openDiscord"
      >
        前往 Discord 登入
      </a>
    </div>

    <template v-else>
      <div class="settings-layout">
        <aside class="settings-sidebar">
          <div class="sidebar-heading">
            <h1 class="text-xl font-bold text-white">伺服器設定</h1>
            <p class="mt-1 text-xs text-zinc-400">選擇要管理的伺服器</p>
            <a
              href="/"
              data-spa-link
              class="mt-3 inline-block text-sm text-indigo-300 underline"
            >
              返回帳號連結
            </a>
          </div>
          <div
            v-if="guildsLoading"
            class="rounded bg-zinc-900 p-5 text-zinc-400"
            role="status"
            aria-live="polite"
          >
            <p>正在載入伺服器…</p>
            <div
              class="loading-progress-track mt-4"
              role="progressbar"
              aria-label="正在載入伺服器"
            >
              <span class="loading-progress-value"></span>
            </div>
          </div>
          <div
            v-else-if="guildsError"
            class="rounded bg-red-950 p-5 text-red-100"
          >
            <p>{{ guildsError }}</p>
            <button
              class="btn mt-3 bg-red-700 active:bg-red-600"
              @click="loadGuilds"
            >
              重新載入伺服器
            </button>
          </div>
          <div v-else-if="guilds.length === 0" class="rounded bg-zinc-900 p-5">
            目前沒有可管理的伺服器
          </div>
          <div v-else class="guild-list-wrap">
            <div
              ref="guildList"
              class="guild-list"
              @pointerdown="startGuildDrag"
              @pointermove="dragGuildList"
              @pointerup="stopGuildDrag"
              @pointercancel="stopGuildDrag"
              @lostpointercapture="stopGuildDrag"
              @click.capture="cancelGuildClick"
              @scroll="updateGuildScrollHints"
              @wheel="scrollGuildList"
            >
              <button
                v-for="guild in sortedGuilds"
                :key="guild.id"
                type="button"
                class="guild-card rounded border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                :class="
                  selectedGuild?.id === guild.id
                    ? 'border-indigo-400 bg-indigo-950/50'
                    : 'border-zinc-700 bg-zinc-900 hover:border-zinc-500'
                "
                :aria-pressed="selectedGuild?.id === guild.id"
                @click="selectGuild(guild)"
              >
                <div class="flex items-center gap-3">
                  <img
                    v-if="guild.icon"
                    :src="`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=64`"
                    :alt="`${guild.name} 圖示`"
                    class="h-10 w-10 rounded-full"
                  />
                  <div
                    v-else
                    class="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-700 font-bold text-zinc-200"
                    aria-hidden="true"
                  >
                    {{ guild.name.slice(0, 1) }}
                  </div>
                  <div class="min-w-0">
                    <p class="truncate font-bold text-white">
                      {{ guild.name }}
                    </p>
                    <p class="text-xs text-zinc-400">
                      {{ guild.owner ? '伺服器擁有者' : '伺服器管理員' }}
                    </p>
                  </div>
                </div>
                <p
                  class="mt-3 text-sm"
                  :class="
                    guild.botInstalled ? 'text-teal-300' : 'text-amber-300'
                  "
                >
                  {{ guild.botInstalled ? '機器人已安裝' : '尚未安裝機器人' }}
                </p>
              </button>
            </div>
            <div
              v-if="canScrollBackward"
              class="guild-scroll-hint guild-scroll-hint-back"
              title="拖曳或使用滾輪捲動"
              aria-label="拖曳或使用滾輪捲動伺服器清單"
            >
              <span class="lg:hidden">←</span>
              <span class="hidden lg:inline">↑</span>
            </div>
            <div
              v-if="canScrollForward"
              class="guild-scroll-hint guild-scroll-hint-forward"
              title="拖曳或使用滾輪捲動"
              aria-label="拖曳或使用滾輪捲動伺服器清單"
            >
              <span class="lg:hidden">→</span>
              <span class="hidden lg:inline">↓</span>
            </div>
          </div>
        </aside>

        <main class="settings-content">
          <div
            v-if="selectedGuild && !selectedGuild.botInstalled"
            class="mt-6 rounded bg-amber-900/70 p-5 text-amber-100"
          >
            <h2 class="text-lg font-bold">請先邀請機器人</h2>
            <p class="mt-1 text-sm">
              先將直播小幫手加入「{{
                selectedGuild.name
              }}」，再重新選擇這個伺服器，即可設定通知
            </p>
            <div class="mt-4 flex flex-wrap gap-3">
              <a
                :href="inviteUrl"
                class="btn bg-indigo-600 active:bg-indigo-500"
              >
                邀請機器人
              </a>
              <a
                href="https://konnokai.notion.site/a4fff40bd95c4bec9edca5b78cdd5d37"
                target="_blank"
                rel="noopener noreferrer"
                class="btn bg-amber-800 active:bg-amber-700"
              >
                查看設定教學
              </a>
            </div>
          </div>

          <div
            v-if="selectedGuild?.botInstalled"
            class="mt-6"
            :aria-busy="settingsLoading"
          >
            <div
              v-if="settingsLoading && !settings"
              class="rounded bg-zinc-900 p-5 text-zinc-400"
              role="status"
              aria-live="polite"
            >
              <p>正在載入「{{ selectedGuild.name }}」的設定…</p>
              <div
                class="loading-progress-track mt-4 max-w-xl"
                role="progressbar"
                aria-label="正在載入伺服器設定"
              >
                <span class="loading-progress-value"></span>
              </div>
            </div>
            <div
              v-else-if="settingsError"
              class="rounded bg-red-950 p-5 text-red-100"
            >
              <p>{{ settingsError }}</p>
              <button
                class="btn mt-3 bg-red-700 active:bg-red-600"
                @click="loadSettings"
              >
                重新載入設定
              </button>
            </div>

            <template v-else-if="settings">
              <div class="mb-5 rounded bg-zinc-900 p-4">
                <div
                  class="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <h2 class="font-bold text-white">
                      {{ settings.guild.name }}
                    </h2>
                    <p class="mt-1 text-sm text-zinc-400">
                      <template v-if="settings.guild.memberCount !== undefined">
                        成員 {{ settings.guild.memberCount }} 人 ·
                      </template>
                      機器人{{
                        settings.health.botConnected === true
                          ? '已連線'
                          : settings.health.botConnected === false
                            ? '未連線'
                            : '狀態未知'
                      }}
                    </p>
                  </div>
                  <button
                    class="btn gap-2 bg-zinc-700 active:bg-zinc-600"
                    :disabled="settingsLoading || hasPendingMutations"
                    @click="loadSettings"
                  >
                    <LoadingSpinner v-if="settingsLoading" />
                    {{ settingsLoading ? '重新載入中…' : '重新載入設定' }}
                  </button>
                </div>
              </div>

              <nav
                class="settings-main-tabs"
                :class="{ 'mb-5': activeFeature === 'general' }"
                aria-label="設定功能"
              >
                <button
                  v-if="hasCapability('guild.common')"
                  type="button"
                  :class="{ active: activeFeature === 'general' }"
                  :aria-pressed="activeFeature === 'general'"
                  @click="activeFeature = 'general'"
                >
                  一般設定
                </button>
                <button
                  type="button"
                  :class="{ active: activeFeature === 'notification' }"
                  :aria-pressed="activeFeature === 'notification'"
                  @click="activeFeature = 'notification'"
                >
                  直播通知
                </button>
                <button
                  type="button"
                  :class="{ active: activeFeature === 'crawler' }"
                  :aria-pressed="activeFeature === 'crawler'"
                  @click="activeFeature = 'crawler'"
                >
                  爬蟲
                </button>
                <button
                  type="button"
                  :class="{ active: activeFeature === 'verification' }"
                  :aria-pressed="activeFeature === 'verification'"
                  @click="activeFeature = 'verification'"
                >
                  會員驗證
                </button>
              </nav>

              <nav
                v-if="activeFeature !== 'general'"
                class="settings-sub-tabs"
                :aria-label="`${activeFeatureLabel}平台`"
              >
                <button
                  v-for="platform in availablePlatforms"
                  :key="platform.id"
                  type="button"
                  :class="{ active: activePlatform === platform.id }"
                  :aria-pressed="activePlatform === platform.id"
                  @click="activePlatform = platform.id"
                >
                  {{ platform.label }}
                </button>
              </nav>

              <Transition name="settings-toast">
                <div
                  v-if="mutationReply"
                  class="settings-toast rounded p-4"
                  :class="replyClass"
                  role="status"
                  aria-live="polite"
                >
                  <p>{{ replyText }}</p>
                  <button
                    v-if="
                      mutationReply.state === 'unknown' ||
                      mutationReply.state === 'timeout'
                    "
                    class="btn mt-3 gap-2 bg-zinc-700 active:bg-zinc-600"
                    :disabled="settingsLoading"
                    @click="reloadAfterUnknown"
                  >
                    <LoadingSpinner v-if="settingsLoading" />
                    {{ settingsLoading ? '重新載入中…' : '重新載入設定' }}
                  </button>
                </div>
              </Transition>

              <section
                v-if="
                  activeFeature === 'general' && hasCapability('guild.common')
                "
                class="settings-section"
              >
                <h2>一般設定</h2>
                <form class="settings-grid" @submit.prevent="saveGeneral">
                  <label>
                    語系
                    <select v-model="commonForm.locale" class="field">
                      <option value="zh-TW">繁體中文</option>
                      <option value="en-US">English</option>
                      <option value="ja">日本語</option>
                    </select>
                  </label>
                  <label>
                    全域通知頻道
                    <select
                      v-model="commonForm.globalNoticeChannelId"
                      class="field"
                    >
                      <option value="">不設定</option>
                      <option
                        v-for="channel in writableChannels"
                        :key="channel.id"
                        :value="channel.id"
                      >
                        # {{ channel.name }}
                      </option>
                    </select>
                  </label>
                  <label>
                    驗證紀錄頻道
                    <select
                      v-model="commonForm.verificationLogChannelId"
                      class="field"
                    >
                      <option value="">不設定</option>
                      <option
                        v-for="channel in writableChannels"
                        :key="channel.id"
                        :value="channel.id"
                      >
                        # {{ channel.name }}
                      </option>
                    </select>
                  </label>
                  <button
                    class="btn mt-3 gap-2 bg-indigo-600 active:bg-indigo-500"
                    :disabled="isFormLoading('general')"
                  >
                    <LoadingSpinner v-if="isFormLoading('general')" />
                    {{ isFormLoading('general') ? '儲存中…' : '儲存設定' }}
                  </button>
                </form>
              </section>

              <section
                v-if="
                  activeFeature === 'notification' &&
                  activePlatform === 'youtube' &&
                  hasCapability('youtube-notification')
                "
                class="settings-section"
              >
                <h2>YouTube 通知</h2>
                <p class="section-help">
                  沒有設定影片通知頻道時，通知會發到直播通知頻道
                </p>
                <form
                  v-for="item in youtubeForms"
                  :key="item.source"
                  class="notification-form"
                  @submit.prevent="saveYouTube(item)"
                >
                  <div class="settings-grid">
                    <label>
                      YouTube 頻道
                      <input :value="item.sourceName" class="field" readonly />
                    </label>
                    <label>
                      直播通知頻道
                      <select
                        v-model="item.streamChannelId"
                        class="field"
                        required
                      >
                        <option value="" disabled>請選擇頻道</option>
                        <option
                          v-for="channel in writableChannels"
                          :key="channel.id"
                          :value="channel.id"
                        >
                          # {{ channel.name }}
                        </option>
                      </select>
                    </label>
                    <label>
                      影片通知頻道
                      <select v-model="item.videoChannelId" class="field">
                        <option value="">未設定（沿用直播通知頻道）</option>
                        <option
                          v-for="channel in writableChannels"
                          :key="channel.id"
                          :value="channel.id"
                        >
                          # {{ channel.name }}
                        </option>
                      </select>
                    </label>
                    <RoleMentionField
                      v-model="item.messages.newStream"
                      label="新直播訊息"
                      :roles="mentionRoles"
                    />
                    <RoleMentionField
                      v-model="item.messages.newVideo"
                      label="新影片訊息"
                      :roles="mentionRoles"
                    />
                    <RoleMentionField
                      v-model="item.messages.start"
                      label="直播開始訊息"
                      :roles="mentionRoles"
                    />
                    <RoleMentionField
                      v-model="item.messages.end"
                      label="直播結束訊息"
                      :roles="mentionRoles"
                    />
                    <RoleMentionField
                      v-model="item.messages.changeTime"
                      label="時間變更訊息"
                      :roles="mentionRoles"
                    />
                    <RoleMentionField
                      v-model="item.messages.delete"
                      label="直播刪除訊息"
                      :roles="mentionRoles"
                    />
                    <label class="checkbox-label">
                      <input v-model="item.createEvent" type="checkbox" />
                      當有新直播時，自動建立 Discord 活動
                    </label>
                  </div>
                  <p
                    v-if="item.detectionEnabled === false"
                    class="mt-3 text-sm text-amber-300"
                  >
                    設定已儲存，但目前尚未建立爬蟲，通知不會送出
                    <button
                      type="button"
                      class="ml-2 font-medium underline underline-offset-2"
                      @click="openCrawler('youtube', item.source)"
                    >
                      新增 YouTube 爬蟲
                    </button>
                  </p>
                  <div class="mt-3 flex flex-wrap gap-3">
                    <button
                      class="btn gap-2 bg-indigo-600 active:bg-indigo-500"
                      :disabled="isFormLoading(`youtube:${item.source}`)"
                    >
                      <LoadingSpinner
                        v-if="
                          isMutationLoading(
                            `youtube:${item.source}`,
                            'youtube-notification.upsert'
                          )
                        "
                      />
                      {{
                        isMutationLoading(
                          `youtube:${item.source}`,
                          'youtube-notification.upsert'
                        )
                          ? '儲存中…'
                          : '儲存'
                      }}
                    </button>
                    <button
                      type="button"
                      class="btn gap-2 bg-red-800 active:bg-red-700"
                      :disabled="isFormLoading(`youtube:${item.source}`)"
                      @click="removeYouTube(item.source)"
                    >
                      <LoadingSpinner
                        v-if="
                          isMutationLoading(
                            `youtube:${item.source}`,
                            'youtube-notification.remove'
                          )
                        "
                      />
                      {{
                        isMutationLoading(
                          `youtube:${item.source}`,
                          'youtube-notification.remove'
                        )
                          ? '移除中…'
                          : '移除'
                      }}
                    </button>
                  </div>
                </form>
                <form
                  class="notification-form"
                  @submit.prevent="saveYouTube(newYouTube)"
                >
                  <h3>新增 YouTube 通知</h3>
                  <div class="settings-grid">
                    <label>
                      來源 ID
                      <input
                        v-model.trim="newYouTube.source"
                        class="field"
                        required
                        autocomplete="off"
                      />
                    </label>
                    <label>
                      直播通知頻道
                      <select
                        v-model="newYouTube.streamChannelId"
                        class="field"
                        required
                      >
                        <option value="" disabled>請選擇頻道</option>
                        <option
                          v-for="channel in writableChannels"
                          :key="channel.id"
                          :value="channel.id"
                        >
                          # {{ channel.name }}
                        </option>
                      </select>
                    </label>
                    <label>
                      影片通知頻道
                      <select v-model="newYouTube.videoChannelId" class="field">
                        <option value="">未設定（沿用直播通知頻道）</option>
                        <option
                          v-for="channel in writableChannels"
                          :key="channel.id"
                          :value="channel.id"
                        >
                          # {{ channel.name }}
                        </option>
                      </select>
                    </label>
                    <RoleMentionField
                      v-model="newYouTube.messages.newStream"
                      label="新直播訊息"
                      :roles="mentionRoles"
                    />
                    <RoleMentionField
                      v-model="newYouTube.messages.newVideo"
                      label="新影片訊息"
                      :roles="mentionRoles"
                    />
                    <RoleMentionField
                      v-model="newYouTube.messages.start"
                      label="直播開始訊息"
                      :roles="mentionRoles"
                    />
                    <RoleMentionField
                      v-model="newYouTube.messages.end"
                      label="直播結束訊息"
                      :roles="mentionRoles"
                    />
                    <RoleMentionField
                      v-model="newYouTube.messages.changeTime"
                      label="時間變更訊息"
                      :roles="mentionRoles"
                    />
                    <RoleMentionField
                      v-model="newYouTube.messages.delete"
                      label="直播刪除訊息"
                      :roles="mentionRoles"
                    />
                    <label class="checkbox-label">
                      <input v-model="newYouTube.createEvent" type="checkbox" />
                      當有新直播時，自動建立 Discord 活動
                    </label>
                  </div>
                  <button
                    class="btn mt-3 gap-2 bg-indigo-600 active:bg-indigo-500"
                    :disabled="isFormLoading('youtube:new')"
                  >
                    <LoadingSpinner
                      v-if="
                        isMutationLoading(
                          'youtube:new',
                          'youtube-notification.upsert'
                        )
                      "
                    />
                    {{ isFormLoading('youtube:new') ? '新增中…' : '新增通知' }}
                  </button>
                </form>
              </section>

              <section
                v-if="
                  activeFeature === 'notification' &&
                  activePlatform === 'twitch' &&
                  hasCapability('twitch-notification')
                "
                class="settings-section"
              >
                <h2>Twitch 通知</h2>
                <form
                  v-for="item in twitchForms"
                  :key="item.source"
                  class="notification-form"
                  @submit.prevent="saveTwitch(item)"
                >
                  <div class="settings-grid">
                    <label>
                      Twitch 頻道
                      <input :value="item.sourceName" class="field" readonly />
                    </label>
                    <label>
                      通知頻道
                      <select v-model="item.channelId" class="field" required>
                        <option value="" disabled>請選擇頻道</option>
                        <option
                          v-for="channel in writableChannels"
                          :key="channel.id"
                          :value="channel.id"
                        >
                          # {{ channel.name }}
                        </option>
                      </select>
                    </label>
                    <RoleMentionField
                      v-model="item.startMessage"
                      label="開播訊息"
                      :roles="mentionRoles"
                    />
                    <RoleMentionField
                      v-model="item.endMessage"
                      label="結束訊息"
                      :roles="mentionRoles"
                    />
                    <RoleMentionField
                      v-model="item.changeMessage"
                      label="變更訊息"
                      :roles="mentionRoles"
                    />
                  </div>
                  <p
                    v-if="item.detectionEnabled === false"
                    class="mt-3 text-sm text-amber-300"
                  >
                    設定已儲存，但目前尚未建立爬蟲，通知不會送出
                    <button
                      type="button"
                      class="ml-2 font-medium underline underline-offset-2"
                      @click="openCrawler('twitch', item.source)"
                    >
                      新增 Twitch 爬蟲
                    </button>
                  </p>
                  <div class="mt-3 flex flex-wrap gap-3">
                    <button
                      class="btn gap-2 bg-indigo-600 active:bg-indigo-500"
                      :disabled="isFormLoading(`twitch:${item.source}`)"
                    >
                      <LoadingSpinner
                        v-if="
                          isMutationLoading(
                            `twitch:${item.source}`,
                            'twitch-notification.upsert'
                          )
                        "
                      />
                      {{
                        isMutationLoading(
                          `twitch:${item.source}`,
                          'twitch-notification.upsert'
                        )
                          ? '儲存中…'
                          : '儲存'
                      }}
                    </button>
                    <button
                      type="button"
                      class="btn gap-2 bg-red-800 active:bg-red-700"
                      :disabled="isFormLoading(`twitch:${item.source}`)"
                      @click="removeTwitch(item.source)"
                    >
                      <LoadingSpinner
                        v-if="
                          isMutationLoading(
                            `twitch:${item.source}`,
                            'twitch-notification.remove'
                          )
                        "
                      />
                      {{
                        isMutationLoading(
                          `twitch:${item.source}`,
                          'twitch-notification.remove'
                        )
                          ? '移除中…'
                          : '移除'
                      }}
                    </button>
                  </div>
                </form>
                <form
                  class="notification-form"
                  @submit.prevent="saveTwitch(newTwitch)"
                >
                  <h3>新增 Twitch 通知</h3>
                  <div class="settings-grid">
                    <label>
                      來源 ID
                      <input
                        v-model.trim="newTwitch.source"
                        class="field"
                        required
                        autocomplete="off"
                      />
                    </label>
                    <label>
                      通知頻道
                      <select
                        v-model="newTwitch.channelId"
                        class="field"
                        required
                      >
                        <option value="" disabled>請選擇頻道</option>
                        <option
                          v-for="channel in writableChannels"
                          :key="channel.id"
                          :value="channel.id"
                        >
                          # {{ channel.name }}
                        </option>
                      </select>
                    </label>
                    <RoleMentionField
                      v-model="newTwitch.startMessage"
                      label="開播訊息"
                      :roles="mentionRoles"
                    />
                    <RoleMentionField
                      v-model="newTwitch.endMessage"
                      label="結束訊息"
                      :roles="mentionRoles"
                    />
                    <RoleMentionField
                      v-model="newTwitch.changeMessage"
                      label="變更訊息"
                      :roles="mentionRoles"
                    />
                  </div>
                  <button
                    class="btn mt-3 gap-2 bg-indigo-600 active:bg-indigo-500"
                    :disabled="isFormLoading('twitch:new')"
                  >
                    <LoadingSpinner
                      v-if="
                        isMutationLoading(
                          'twitch:new',
                          'twitch-notification.upsert'
                        )
                      "
                    />
                    {{ isFormLoading('twitch:new') ? '新增中…' : '新增通知' }}
                  </button>
                </form>
              </section>

              <section
                v-if="
                  activeFeature === 'notification' &&
                  activePlatform === 'twitcasting' &&
                  hasCapability('twitcasting-notification')
                "
                class="settings-section"
              >
                <h2>TwitCasting 通知</h2>
                <form
                  v-for="item in twitcastingForms"
                  :key="item.source"
                  class="notification-form"
                  @submit.prevent="saveTwitCasting(item)"
                >
                  <div class="settings-grid">
                    <label>
                      TwitCasting 頻道
                      <input :value="item.sourceName" class="field" readonly />
                    </label>
                    <label>
                      通知頻道
                      <select v-model="item.channelId" class="field" required>
                        <option value="" disabled>請選擇頻道</option>
                        <option
                          v-for="channel in writableChannels"
                          :key="channel.id"
                          :value="channel.id"
                        >
                          # {{ channel.name }}
                        </option>
                      </select>
                    </label>
                    <RoleMentionField
                      v-model="item.startMessage"
                      class="wide"
                      label="開播訊息"
                      :roles="mentionRoles"
                      multiline
                    />
                  </div>
                  <p
                    v-if="item.detectionEnabled === false"
                    class="mt-3 text-sm text-amber-300"
                  >
                    設定已儲存，但目前尚未建立爬蟲，通知不會送出
                    <button
                      type="button"
                      class="ml-2 font-medium underline underline-offset-2"
                      @click="openCrawler('twitcasting', item.source)"
                    >
                      新增 TwitCasting 爬蟲
                    </button>
                  </p>
                  <div class="mt-3 flex flex-wrap gap-3">
                    <button
                      class="btn gap-2 bg-indigo-600 active:bg-indigo-500"
                      :disabled="isFormLoading(`twitcasting:${item.source}`)"
                    >
                      <LoadingSpinner
                        v-if="
                          isMutationLoading(
                            `twitcasting:${item.source}`,
                            'twitcasting-notification.upsert'
                          )
                        "
                      />
                      {{
                        isMutationLoading(
                          `twitcasting:${item.source}`,
                          'twitcasting-notification.upsert'
                        )
                          ? '儲存中…'
                          : '儲存'
                      }}
                    </button>
                    <button
                      type="button"
                      class="btn gap-2 bg-red-800 active:bg-red-700"
                      :disabled="isFormLoading(`twitcasting:${item.source}`)"
                      @click="removeTwitCasting(item.source)"
                    >
                      <LoadingSpinner
                        v-if="
                          isMutationLoading(
                            `twitcasting:${item.source}`,
                            'twitcasting-notification.remove'
                          )
                        "
                      />
                      {{
                        isMutationLoading(
                          `twitcasting:${item.source}`,
                          'twitcasting-notification.remove'
                        )
                          ? '移除中…'
                          : '移除'
                      }}
                    </button>
                  </div>
                </form>
                <form
                  class="notification-form"
                  @submit.prevent="saveTwitCasting(newTwitCasting)"
                >
                  <h3>新增 TwitCasting 通知</h3>
                  <div class="settings-grid">
                    <label>
                      來源 ID
                      <input
                        v-model.trim="newTwitCasting.source"
                        class="field"
                        required
                        autocomplete="off"
                      />
                    </label>
                    <label>
                      通知頻道
                      <select
                        v-model="newTwitCasting.channelId"
                        class="field"
                        required
                      >
                        <option value="" disabled>請選擇頻道</option>
                        <option
                          v-for="channel in writableChannels"
                          :key="channel.id"
                          :value="channel.id"
                        >
                          # {{ channel.name }}
                        </option>
                      </select>
                    </label>
                    <RoleMentionField
                      v-model="newTwitCasting.startMessage"
                      class="wide"
                      label="開播訊息"
                      :roles="mentionRoles"
                      multiline
                    />
                  </div>
                  <button
                    class="btn mt-3 gap-2 bg-indigo-600 active:bg-indigo-500"
                    :disabled="isFormLoading('twitcasting:new')"
                  >
                    <LoadingSpinner
                      v-if="
                        isMutationLoading(
                          'twitcasting:new',
                          'twitcasting-notification.upsert'
                        )
                      "
                    />
                    {{
                      isFormLoading('twitcasting:new') ? '新增中…' : '新增通知'
                    }}
                  </button>
                </form>
              </section>

              <section
                v-if="
                  activeFeature === 'crawler' &&
                  hasCapability(`${activePlatform}-crawler`)
                "
                class="settings-section"
              >
                <div>
                  <h2>{{ activePlatformLabel }} 爬蟲</h2>
                  <p class="section-help">
                    目前使用 {{ activeCrawler.count }} 個來源（上限
                    {{ activeCrawler.limit }} 個）
                  </p>
                </div>
                <div
                  v-for="item in activeCrawler.items"
                  :key="item.sourceId"
                  class="settings-row"
                >
                  <div>
                    <strong>{{ item.sourceName || item.sourceId }}</strong>
                    <p>{{ item.sourceId }}</p>
                  </div>
                  <button
                    type="button"
                    class="btn gap-2 bg-red-800 active:bg-red-700"
                    :disabled="
                      isFormLoading(
                        `crawler:${activePlatform}:${item.sourceId}`
                      )
                    "
                    @click="removeCrawler(item.sourceId)"
                  >
                    <LoadingSpinner
                      v-if="
                        isMutationLoading(
                          `crawler:${activePlatform}:${item.sourceId}`,
                          `${activePlatform}-crawler.remove`
                        )
                      "
                    />
                    {{
                      isMutationLoading(
                        `crawler:${activePlatform}:${item.sourceId}`,
                        `${activePlatform}-crawler.remove`
                      )
                        ? '移除中…'
                        : '移除'
                    }}
                  </button>
                </div>
                <p v-if="activeCrawler.items.length === 0" class="empty-note">
                  目前還沒有 {{ activePlatformLabel }} 爬蟲來源
                </p>
                <form class="settings-grid" @submit.prevent="addCrawler">
                  <label>
                    頻道網址、登入名稱（login）或 ID
                    <input
                      v-model.trim="newCrawlerSources[activePlatform]"
                      class="field"
                      required
                      autocomplete="off"
                      :disabled="!activeCrawler.enabled"
                    />
                  </label>
                  <button
                    class="btn mt-3 gap-2 bg-indigo-600 active:bg-indigo-500"
                    :disabled="
                      !activeCrawler.enabled ||
                      activeCrawler.count >= activeCrawler.limit ||
                      isFormLoading(`crawler:${activePlatform}:new`)
                    "
                  >
                    <LoadingSpinner
                      v-if="
                        isMutationLoading(
                          `crawler:${activePlatform}:new`,
                          `${activePlatform}-crawler.add`
                        )
                      "
                    />
                    {{
                      isMutationLoading(
                        `crawler:${activePlatform}:new`,
                        `${activePlatform}-crawler.add`
                      )
                        ? '新增中…'
                        : activeCrawler.enabled
                          ? '新增爬蟲'
                          : '平台目前已停用'
                    }}
                  </button>
                </form>
              </section>

              <section
                v-if="
                  activeFeature === 'verification' &&
                  hasCapability(`${activePlatform}-verification`)
                "
                class="settings-section"
              >
                <div>
                  <h2>{{ activePlatformLabel }} {{ verificationName }}</h2>
                  <p class="section-help">
                    設定驗證來源、Discord 身分組和驗證紀錄
                  </p>
                </div>
                <div
                  v-for="item in activeVerification"
                  :key="item.sourceId"
                  class="verification-card"
                >
                  <div>
                    <strong>{{ item.sourceName || item.sourceId }}</strong>
                    <p>
                      已有 {{ item.verifiedMemberCount }} 人完成驗證，還有
                      {{ item.pendingRoleRemovalCount }} 人的身分組待移除
                    </p>
                  </div>
                  <p v-if="item.previousRoleId" class="text-amber-300">
                    舊身分組 {{ roleName(item.previousRoleId) }} 仍在遷移中
                  </p>
                  <p v-if="item.deletionPending" class="text-amber-300">
                    正在清理，暫時無法更新
                  </p>
                  <form
                    class="settings-grid"
                    @submit.prevent="saveVerification(item)"
                  >
                    <label>
                      Discord 身分組
                      <select
                        v-model="item.roleId"
                        class="field"
                        required
                        :disabled="item.deletionPending"
                      >
                        <option
                          v-for="role in settings?.resources.roles"
                          :key="role.id"
                          :value="role.id"
                          :disabled="!role.botCanManage"
                        >
                          {{ role.name
                          }}{{ role.botCanManage ? '' : '（小幫手無法管理）' }}
                        </option>
                      </select>
                    </label>
                    <button
                      class="btn mt-3 gap-2 bg-indigo-600 active:bg-indigo-500"
                      :disabled="
                        item.deletionPending ||
                        isFormLoading(
                          `verification:${activePlatform}:${item.sourceId}`
                        )
                      "
                    >
                      <LoadingSpinner
                        v-if="
                          isMutationLoading(
                            `verification:${activePlatform}:${item.sourceId}`,
                            `${activePlatform}-verification.upsert`
                          )
                        "
                      />
                      {{
                        isMutationLoading(
                          `verification:${activePlatform}:${item.sourceId}`,
                          `${activePlatform}-verification.upsert`
                        )
                          ? '儲存中…'
                          : '儲存'
                      }}
                    </button>
                  </form>
                  <template v-if="activePlatform === 'youtube'">
                    <p>
                      會員限定影片偵測模式：
                      {{ item.probeMode === 'manual' ? '手動' : '自動' }}（{{
                        item.probeVideoId
                      }}）
                    </p>
                    <form
                      class="settings-grid"
                      @submit.prevent="setProbeVideo(item)"
                    >
                      <label>
                        手動偵測影片網址或 ID
                        <input
                          v-model.trim="probeVideos[item.sourceId]"
                          class="field"
                          required
                        />
                      </label>
                      <button
                        class="btn mt-3 gap-2 bg-zinc-700 active:bg-zinc-600"
                        :disabled="
                          isFormLoading(`verification:youtube:${item.sourceId}`)
                        "
                      >
                        <LoadingSpinner
                          v-if="
                            isMutationLoading(
                              `verification:youtube:${item.sourceId}`,
                              'youtube-verification.set-probe-video'
                            )
                          "
                        />
                        {{
                          isMutationLoading(
                            `verification:youtube:${item.sourceId}`,
                            'youtube-verification.set-probe-video'
                          )
                            ? '指定中…'
                            : '指定影片'
                        }}
                      </button>
                      <button
                        type="button"
                        class="btn mt-3 gap-2 bg-zinc-700 active:bg-zinc-600"
                        :disabled="
                          isFormLoading(`verification:youtube:${item.sourceId}`)
                        "
                        @click="useAutomaticProbe(item.sourceId)"
                      >
                        <LoadingSpinner
                          v-if="
                            isMutationLoading(
                              `verification:youtube:${item.sourceId}`,
                              'youtube-verification.use-automatic-probe'
                            )
                          "
                        />
                        {{
                          isMutationLoading(
                            `verification:youtube:${item.sourceId}`,
                            'youtube-verification.use-automatic-probe'
                          )
                            ? '恢復中…'
                            : '改回自動探索'
                        }}
                      </button>
                    </form>
                  </template>
                  <div v-else class="tier-role-list">
                    <p>層級身分組：</p>
                    <p v-for="tierRole in tierRoleNames(item)" :key="tierRole">
                      {{ tierRole }}
                    </p>
                  </div>
                  <button
                    type="button"
                    class="btn mt-3 gap-2 bg-red-800 active:bg-red-700"
                    :disabled="
                      item.deletionPending ||
                      isFormLoading(
                        `verification:${activePlatform}:${item.sourceId}`
                      )
                    "
                    @click="removeVerification(item.sourceId)"
                  >
                    <LoadingSpinner
                      v-if="
                        isMutationLoading(
                          `verification:${activePlatform}:${item.sourceId}`,
                          `${activePlatform}-verification.remove`
                        )
                      "
                    />
                    {{
                      isMutationLoading(
                        `verification:${activePlatform}:${item.sourceId}`,
                        `${activePlatform}-verification.remove`
                      )
                        ? '移除中…'
                        : '移除設定'
                    }}
                  </button>
                </div>
                <p v-if="activeVerification.length === 0" class="empty-note">
                  目前還沒有 {{ activePlatformLabel }} 驗證設定
                </p>
                <form class="settings-grid" @submit.prevent="addVerification">
                  <label>
                    頻道網址或 ID
                    <input
                      v-model.trim="newVerification.source"
                      class="field"
                      required
                      autocomplete="off"
                    />
                  </label>
                  <label>
                    Discord 身分組
                    <select
                      v-model="newVerification.roleId"
                      class="field"
                      required
                    >
                      <option value="" disabled>請選擇身分組</option>
                      <option
                        v-for="role in settings?.resources.roles"
                        :key="role.id"
                        :value="role.id"
                        :disabled="!role.botCanManage"
                      >
                        {{ role.name
                        }}{{ role.botCanManage ? '' : '（小幫手無法管理）' }}
                      </option>
                    </select>
                  </label>
                  <button
                    class="btn mt-3 gap-2 bg-indigo-600 active:bg-indigo-500"
                    :disabled="
                      isFormLoading(`verification:${activePlatform}:new`)
                    "
                  >
                    <LoadingSpinner
                      v-if="
                        isMutationLoading(
                          `verification:${activePlatform}:new`,
                          `${activePlatform}-verification.upsert`
                        )
                      "
                    />
                    {{
                      isMutationLoading(
                        `verification:${activePlatform}:new`,
                        `${activePlatform}-verification.upsert`
                      )
                        ? '新增中…'
                        : '新增驗證設定'
                    }}
                  </button>
                </form>
              </section>
            </template>
          </div>
        </main>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, inject, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import LoadingSpinner from '../components/LoadingSpinner.vue';
import RoleMentionField from '../components/RoleMentionField.vue';
import { startDiscordOAuth } from '../lib/discordOAuth';
import {
  AdminSettingsApiError,
  getAdminGuilds,
  getGuildSettings,
  mutateGuildSettings
} from '../lib/adminSettings';
import type {
  AdminGuild,
  AdminMutationAction,
  AdminMutationReply,
  GuildSettingsSnapshot
} from '../lib/adminSettings';

interface CommonForm {
  locale: string;
  globalNoticeChannelId: string;
  verificationLogChannelId: string;
}

interface YouTubeForm {
  source: string;
  sourceName: string;
  streamChannelId: string;
  videoChannelId: string;
  createEvent: boolean;
  messages: Record<keyof typeof emptyYouTubeMessages, string>;
  detectionEnabled?: boolean;
}

interface TwitchForm {
  source: string;
  sourceName: string;
  channelId: string;
  startMessage: string;
  endMessage: string;
  changeMessage: string;
  detectionEnabled?: boolean;
}

interface TwitCastingForm {
  source: string;
  sourceName: string;
  channelId: string;
  startMessage: string;
  detectionEnabled?: boolean;
}

type Feature = 'general' | 'notification' | 'crawler' | 'verification';
type Platform = 'youtube' | 'twitch' | 'twitcasting';

const apiURL = inject<string>('apiURL');
if (!apiURL) throw new Error('缺少 API 網址設定');
const discordClientId = inject<string>('discordClientId');
if (!discordClientId) throw new Error('缺少 Discord Client ID 設定');

const hasDiscordToken = ref(!!sessionStorage.getItem('DT'));
const openDiscord = () => startDiscordOAuth(discordClientId);
const guilds = ref<AdminGuild[]>([]);
const selectedGuild = ref<AdminGuild | null>(null);
const activeFeature = ref<Feature>('general');
const activePlatform = ref<Platform>('youtube');
const settings = ref<GuildSettingsSnapshot | null>(null);
const guildsLoading = ref(false);
const settingsLoading = ref(false);
let settingsRequest: AbortController | null = null;
const guildsError = ref('');
const settingsError = ref('');
const pendingMutations = ref(new Set<string>());
const pendingMutationActions = ref<Record<string, AdminMutationAction>>({});
const mutationReply = ref<AdminMutationReply | null>(null);
const guildList = ref<HTMLElement | null>(null);
const canScrollBackward = ref(false);
const canScrollForward = ref(false);
let toastTimer: ReturnType<typeof setTimeout> | undefined;
let dragStart: { x: number; y: number; left: number; top: number } | null =
  null;
let guildDragged = false;
let dragPointerId: number | null = null;
let guildSelectionVersion = 0;
const commonForm = ref<CommonForm>({
  locale: 'zh-TW',
  globalNoticeChannelId: '',
  verificationLogChannelId: ''
});
const youtubeForms = ref<YouTubeForm[]>([]);
const twitchForms = ref<TwitchForm[]>([]);
const twitcastingForms = ref<TwitCastingForm[]>([]);
const newCrawlerSources = ref<Record<Platform, string>>({
  youtube: '',
  twitch: '',
  twitcasting: ''
});
const newVerification = ref({ source: '', roleId: '' });
const probeVideos = ref<Record<string, string>>({});

const emptyYouTubeMessages = {
  newStream: '',
  newVideo: '',
  start: '',
  end: '',
  changeTime: '',
  delete: ''
};

const emptyYouTube = (): YouTubeForm => ({
  source: '',
  sourceName: '',
  streamChannelId: '',
  videoChannelId: '',
  createEvent: false,
  messages: { ...emptyYouTubeMessages }
});
const emptyTwitch = (): TwitchForm => ({
  source: '',
  sourceName: '',
  channelId: '',
  startMessage: '',
  endMessage: '',
  changeMessage: ''
});
const emptyTwitCasting = (): TwitCastingForm => ({
  source: '',
  sourceName: '',
  channelId: '',
  startMessage: ''
});
const newYouTube = ref(emptyYouTube());
const newTwitch = ref(emptyTwitch());
const newTwitCasting = ref(emptyTwitCasting());

const writableChannels = computed(() =>
  (settings.value?.resources.channels || []).filter(
    (channel) => channel.canView && channel.canSendMessages
  )
);
const mentionRoles = computed(() => settings.value?.resources.roles || []);
const platformLabels: Record<Platform, string> = {
  youtube: 'YouTube',
  twitch: 'Twitch',
  twitcasting: 'TwitCasting'
};
const platformsByFeature: Record<Exclude<Feature, 'general'>, Platform[]> = {
  notification: ['youtube', 'twitch', 'twitcasting'],
  crawler: ['youtube', 'twitch', 'twitcasting'],
  verification: ['youtube', 'twitch']
};
const availablePlatforms = computed(() => {
  if (activeFeature.value === 'general') return [];
  return platformsByFeature[activeFeature.value]
    .filter((platform) =>
      activeFeature.value === 'notification'
        ? hasCapability(`${platform}-notification`)
        : hasCapability(`${platform}-${activeFeature.value}`)
    )
    .map((id) => ({ id, label: platformLabels[id] }));
});
const activeFeatureLabel = computed(
  () =>
    ({
      general: '',
      notification: '直播通知',
      crawler: '爬蟲',
      verification: '會員驗證'
    })[activeFeature.value]
);
const activePlatformLabel = computed(
  () => platformLabels[activePlatform.value]
);
const verificationName = computed(() =>
  activePlatform.value === 'twitch' ? '訂閱驗證' : '會員驗證'
);
const emptyCrawler = () => ({ enabled: false, count: 0, limit: 0, items: [] });
const activeCrawler = computed(
  () => settings.value?.crawlers[activePlatform.value] || emptyCrawler()
);
type VerificationItem = {
  sourceId: string;
  sourceName: string;
  roleId: string;
  previousRoleId: string | null;
  deletionPending: boolean;
  verifiedMemberCount: number;
  pendingRoleRemovalCount: number;
  probeMode?: 'automatic' | 'manual';
  probeVideoId?: string;
  tierRoleIds?: Record<string, string>;
};
const activeVerification = computed<VerificationItem[]>(() => {
  if (!settings.value) return [];
  if (activePlatform.value === 'youtube')
    return settings.value.verification.youtube;
  return settings.value.verification.twitch.map((item) => {
    const form = item as typeof item & VerificationItem;
    form.roleId ??= item.subscriberRoleId;
    form.previousRoleId ??= item.previousSubscriberRoleId;
    return form;
  });
});
const roleName = (roleId?: string | null) =>
  settings.value?.resources.roles.find((role) => role.id === roleId)?.name ||
  roleId ||
  '未建立';
const tierRoleNames = (item: VerificationItem) =>
  Object.entries(item.tierRoleIds || {}).map(
    ([tier, roleId]) => `層級 ${Number(tier) / 1000}：${roleName(roleId)}`
  );
const sortedGuilds = computed(() =>
  guilds.value.toSorted(
    (left, right) =>
      Number(right.botInstalled) - Number(left.botInstalled) ||
      left.name.localeCompare(right.name)
  )
);
const hasPendingMutations = computed(() =>
  Array.from(pendingMutations.value).some((key) =>
    key.startsWith(`${selectedGuild.value?.id}:`)
  )
);
const mutationKey = (formKey: string, guildId = selectedGuild.value?.id) =>
  `${guildId}:${formKey}`;
const isFormLoading = (formKey: string): boolean =>
  pendingMutations.value.has(mutationKey(formKey));
const isMutationLoading = (formKey: string, action: string): boolean =>
  pendingMutationActions.value[mutationKey(formKey)] === action;
const setFormLoading = (
  guildId: string,
  formKey: string,
  loading: boolean,
  action?: AdminMutationAction
) => {
  const key = mutationKey(formKey, guildId);
  const next = new Set(pendingMutations.value);
  if (loading) next.add(key);
  else next.delete(key);
  pendingMutations.value = next;
  const actions = { ...pendingMutationActions.value };
  if (loading && action) actions[key] = action;
  else delete actions[key];
  pendingMutationActions.value = actions;
};
const inviteUrl = computed(() => {
  const guildId = selectedGuild.value?.id || '';
  return `https://discordapp.com/api/oauth2/authorize?client_id=758222559392432160&permissions=2416143425&scope=bot%20applications.commands&guild_id=${encodeURIComponent(guildId)}&disable_guild_select=true`;
});
const replyClass = computed(() => {
  switch (mutationReply.value?.state) {
    case 'applied':
      return 'bg-teal-950 text-teal-100';
    case 'pending':
      return 'bg-amber-900/70 text-amber-100';
    case 'rejected':
      return 'bg-red-950 text-red-100';
    case 'timeout':
      return 'bg-orange-950 text-orange-100';
    default:
      return 'bg-zinc-700 text-zinc-100';
  }
});
const replyText = computed(() => {
  const reply = mutationReply.value;
  if (!reply) return '';
  if (reply.message) return reply.message;
  const codeMessages: Record<string, string> = {
    'crawler.already-exists': '這個爬蟲已經在此伺服器中。',
    'crawler.not-configured': '找不到此爬蟲來源。',
    'crawler.not-owned': '此爬蟲不屬於目前伺服器。',
    'crawler.source-owned': '其他伺服器或 Bot 擁有者已設定此爬蟲。',
    'crawler.source-ineligible':
      '這個爬蟲已有平台內建功能監測，不需要另外新增。',
    'crawler.limit-reached':
      '已達此伺服器的爬蟲數量上限，若有需要請聯絡 Bot 擁有者。',
    'crawler.guild-member-requirement': '此伺服器人數未達使用門檻。',
    'crawler.oauth-eligibility-required':
      '此伺服器人數不足，請先用目前登入的 Discord 帳號連結這個 Twitch 頻道，然後再試一次。',
    'crawler.platform-disabled': '平台 API 目前停用，暫時無法新增爬蟲。',
    'verification.log-channel-required': '請先到「一般設定」選擇驗證紀錄頻道。',
    'verification.log-channel-missing': '驗證紀錄頻道已不存在，請重新設定。',
    'verification.configured': '驗證設定已套用。',
    'verification.removed': '驗證設定已移除。',
    'verification.cleanup-pending':
      '設定已標記為待移除，相關身分組會在背景清理。',
    'verification.not-configured': '找不到此驗證設定。',
    'verification.limit-reached':
      '已達此伺服器的驗證頻道數量上限，若有需要請聯絡 Bot 擁有者。',
    'verification.guild-member-requirement':
      '此伺服器人數未達驗證功能的使用門檻，若有需要請聯絡 Bot 擁有者。。',
    'verification.manage-roles-required': 'Bot 沒有管理身分組的權限。',
    'verification.role-invalid': '無法使用所選的身分組。',
    'verification.role-too-high': '所選身分組的位置高於 Bot 可管理的最高位置。',
    'verification.role-collision': '這個身分組已被另一個驗證平台使用。',
    'verification.deletion-pending': '設定正在清理，暫時無法更新。',
    'verification.source-not-found':
      '找不到這個平台頻道，請確認網址或 ID 是否正確。',
    'verification.source-ineligible':
      '此 Twitch 頻道不是實況盟友或合作夥伴，無法使用訂閱驗證。',
    'verification.probe-video-set': '已改用手動探測影片。',
    'verification.probe-automatic': '已改回自動尋找驗證影片。',
    'verification.probe-video-invalid':
      '影片不存在、留言已停用，或不是可用的會員限定影片。',
    'verification.platform-disabled': '驗證平台目前已停用。'
  };
  if (reply.code && codeMessages[reply.code]) return codeMessages[reply.code];
  return {
    applied: '設定已套用。',
    pending: '設定正在處理，完成後請重新載入確認。',
    rejected: '伺服器拒絕了這項設定，請確認內容和權限。',
    timeout: '設定請求逾時，請重新載入設定後再繼續操作。',
    unknown: '無法確認設定是否已套用。請重新載入設定後再繼續操作。'
  }[reply.state];
});

const discordToken = (): string | null => sessionStorage.getItem('DT');
const hasCapability = (capability: string): boolean =>
  settings.value?.capabilities.includes(capability) || false;

const normalizeSnapshot = (
  snapshot: GuildSettingsSnapshot
): GuildSettingsSnapshot => ({
  ...snapshot,
  capabilities: Array.isArray(snapshot.capabilities)
    ? snapshot.capabilities
    : [],
  guild: snapshot.guild || {
    id: selectedGuild.value?.id || '',
    name: selectedGuild.value?.name || ''
  },
  health: snapshot.health || {},
  resources: {
    channels: snapshot.resources?.channels || [],
    roles: snapshot.resources?.roles || []
  },
  common: snapshot.common || {},
  notifications: {
    youtube: snapshot.notifications?.youtube || [],
    twitch: snapshot.notifications?.twitch || [],
    twitcasting: snapshot.notifications?.twitcasting || []
  },
  crawlers: {
    youtube: snapshot.crawlers?.youtube || emptyCrawler(),
    twitch: snapshot.crawlers?.twitch || emptyCrawler(),
    twitcasting: snapshot.crawlers?.twitcasting || emptyCrawler()
  },
  verification: {
    youtube: snapshot.verification?.youtube || [],
    twitch: snapshot.verification?.twitch || []
  }
});

const useSnapshot = (snapshot: GuildSettingsSnapshot) => {
  settings.value = normalizeSnapshot(snapshot);
  commonForm.value = {
    locale: settings.value.common.locale || 'zh-TW',
    globalNoticeChannelId: settings.value.common.globalNoticeChannelId || '',
    verificationLogChannelId:
      settings.value.common.verificationLogChannelId || ''
  };
  youtubeForms.value = settings.value.notifications.youtube.map((item) => ({
    source: item.sourceId,
    sourceName: item.sourceName || item.sourceId,
    streamChannelId: item.streamChannelId,
    videoChannelId: item.videoChannelId,
    createEvent: item.createEvent,
    messages: { ...emptyYouTubeMessages, ...item.messages },
    detectionEnabled: item.detectionEnabled
  }));
  twitchForms.value = settings.value.notifications.twitch.map((item) => ({
    source: item.sourceId,
    sourceName: item.sourceName || item.sourceId,
    channelId: item.channelId,
    startMessage: item.messages?.start || '',
    endMessage: item.messages?.end || '',
    changeMessage: item.messages?.change || '',
    detectionEnabled: item.detectionEnabled
  }));
  twitcastingForms.value = settings.value.notifications.twitcasting.map(
    (item) => ({
      source: item.sourceId,
      sourceName: item.sourceName || item.sourceId,
      channelId: item.channelId,
      startMessage: item.startMessage || '',
      detectionEnabled: item.detectionEnabled
    })
  );
  newYouTube.value = emptyYouTube();
  newTwitch.value = emptyTwitch();
  newTwitCasting.value = emptyTwitCasting();
  newCrawlerSources.value = { youtube: '', twitch: '', twitcasting: '' };
  newVerification.value = { source: '', roleId: '' };
  probeVideos.value = {};
};

const loadGuilds = async () => {
  const token = discordToken();
  if (!token) {
    hasDiscordToken.value = false;
    return;
  }

  guildsLoading.value = true;
  guildsError.value = '';
  try {
    guilds.value = await getAdminGuilds(apiURL, token);
    requestAnimationFrame(updateGuildScrollHints);
  } catch {
    guildsError.value = '無法載入可管理的伺服器，請重新登入或稍後再試。';
  } finally {
    guildsLoading.value = false;
  }
};

const loadSettings = async () => {
  const token = discordToken();
  const guild = selectedGuild.value;
  if (!token || !guild || !guild.botInstalled) return;
  const selectionVersion = guildSelectionVersion;

  settingsRequest?.abort();
  const request = new AbortController();
  settingsRequest = request;
  settingsLoading.value = true;
  settingsError.value = '';
  try {
    const snapshot = await getGuildSettings(
      apiURL,
      token,
      guild.id,
      request.signal
    );
    if (
      selectionVersion !== guildSelectionVersion ||
      selectedGuild.value?.id !== guild.id
    )
      return;
    useSnapshot(snapshot);
  } catch (error) {
    if (request.signal.aborted || settingsRequest !== request) return;
    settingsError.value =
      error instanceof AdminSettingsApiError &&
      (error.status === 504 || error.code === 'settings.timeout')
        ? '載入伺服器設定逾時，請重新載入設定後再繼續操作。'
        : '無法載入伺服器設定。請稍後再試，或回到 Discord 使用機器人的設定指令。';
  } finally {
    if (settingsRequest === request) {
      settingsRequest = null;
      settingsLoading.value = false;
    }
  }
};

const selectGuild = async (guild: AdminGuild) => {
  if (selectedGuild.value?.id === guild.id) return;
  guildSelectionVersion += 1;
  settingsRequest?.abort();
  settingsRequest = null;
  settingsLoading.value = false;
  selectedGuild.value = guild;
  activeFeature.value = 'general';
  activePlatform.value = 'youtube';
  settings.value = null;
  settingsError.value = '';
  mutationReply.value = null;
  if (guild.botInstalled) await loadSettings();
};

const runMutation = async (
  formKey: string,
  action: AdminMutationAction,
  payload: Record<string, unknown>,
  keepLoading = false
): Promise<AdminMutationReply | null> => {
  const token = discordToken();
  const guild = selectedGuild.value;
  if (!token || !guild || isFormLoading(formKey)) return null;
  const selectionVersion = guildSelectionVersion;
  const isCurrentGuild = () =>
    selectionVersion === guildSelectionVersion &&
    selectedGuild.value?.id === guild.id;

  setFormLoading(guild.id, formKey, true, action);
  mutationReply.value = null;
  try {
    const reply = await mutateGuildSettings(
      apiURL,
      token,
      guild.id,
      action,
      payload
    );
    if (!isCurrentGuild()) return null;
    mutationReply.value = reply;
    return reply;
  } catch (error) {
    if (!isCurrentGuild()) return null;
    mutationReply.value = {
      state:
        error instanceof AdminSettingsApiError &&
        (error.status === 504 || error.code === 'settings.timeout')
          ? 'timeout'
          : 'unknown'
    };
    return mutationReply.value;
  } finally {
    if (!keepLoading) setFormLoading(guild.id, formKey, false);
  }
};

const saveGeneral = async () => {
  if (!settings.value) return;
  const submitted = { ...commonForm.value };
  const changes: Array<
    [AdminMutationAction, Record<string, unknown>, keyof CommonForm]
  > = [];
  if ((settings.value.common.locale || 'zh-TW') !== submitted.locale)
    changes.push(['guild.set-locale', { locale: submitted.locale }, 'locale']);
  if (
    (settings.value.common.globalNoticeChannelId || '') !==
    submitted.globalNoticeChannelId
  )
    changes.push([
      'guild.set-global-notice-channel',
      { channelId: submitted.globalNoticeChannelId },
      'globalNoticeChannelId'
    ]);
  if (
    (settings.value.common.verificationLogChannelId || '') !==
    submitted.verificationLogChannelId
  )
    changes.push([
      'guild.set-verification-log-channel',
      { channelId: submitted.verificationLogChannelId },
      'verificationLogChannelId'
    ]);

  if (changes.length === 0) {
    mutationReply.value = { state: 'applied', message: '設定未變更。' };
    return;
  }

  let pending = false;
  for (const [action, payload, field] of changes) {
    const reply = await runMutation('general', action, payload);
    if (!reply || (reply.state !== 'applied' && reply.state !== 'pending'))
      return;
    pending ||= reply.state === 'pending';
    if (reply.state === 'applied' && settings.value)
      settings.value.common[field] = submitted[field];
  }
  mutationReply.value = { state: pending ? 'pending' : 'applied' };
};

const reloadAfterMutation = async (reply: AdminMutationReply | null) => {
  if (reply?.state === 'applied' || reply?.state === 'pending')
    await loadSettings();
};

const openCrawler = (platform: Platform, source: string) => {
  activePlatform.value = platform;
  activeFeature.value = 'crawler';
  newCrawlerSources.value[platform] = source;
};

const addCrawler = async () => {
  const platform = activePlatform.value;
  const key = `crawler:${platform}:new`;
  const source = newCrawlerSources.value[platform];
  const reply = await runMutation(
    key,
    `${platform}-crawler.add` as AdminMutationAction,
    { source }
  );
  if (reply?.state === 'applied' || reply?.state === 'pending')
    newCrawlerSources.value[platform] = '';
  await reloadAfterMutation(reply);
};

const removeCrawler = async (sourceId: string) => {
  if (!window.confirm(`確定要移除 ${activePlatformLabel.value} 爬蟲來源？`))
    return;
  const platform = activePlatform.value;
  const reply = await runMutation(
    `crawler:${platform}:${sourceId}`,
    `${platform}-crawler.remove` as AdminMutationAction,
    { sourceId }
  );
  await reloadAfterMutation(reply);
};

const addVerification = async () => {
  const platform = activePlatform.value as 'youtube' | 'twitch';
  const reply = await runMutation(
    `verification:${platform}:new`,
    `${platform}-verification.upsert` as AdminMutationAction,
    { ...newVerification.value }
  );
  await reloadAfterMutation(reply);
};

const saveVerification = async (item: VerificationItem) => {
  const platform = activePlatform.value as 'youtube' | 'twitch';
  const reply = await runMutation(
    `verification:${platform}:${item.sourceId}`,
    `${platform}-verification.upsert` as AdminMutationAction,
    { source: item.sourceId, roleId: item.roleId }
  );
  await reloadAfterMutation(reply);
};

const removeVerification = async (sourceId: string) => {
  if (!window.confirm(`確定要移除 ${activePlatformLabel.value} 驗證設定？`))
    return;
  const platform = activePlatform.value as 'youtube' | 'twitch';
  const reply = await runMutation(
    `verification:${platform}:${sourceId}`,
    `${platform}-verification.remove` as AdminMutationAction,
    { sourceId }
  );
  if (reply?.state === 'pending' && settings.value) {
    const item = settings.value.verification[platform].find(
      (entry) => entry.sourceId === sourceId
    );
    if (item) item.deletionPending = true;
    return;
  }
  await reloadAfterMutation(reply);
};

const setProbeVideo = async (item: VerificationItem) => {
  const reply = await runMutation(
    `verification:youtube:${item.sourceId}`,
    'youtube-verification.set-probe-video',
    { sourceId: item.sourceId, video: probeVideos.value[item.sourceId] }
  );
  await reloadAfterMutation(reply);
};

const useAutomaticProbe = async (sourceId: string) => {
  const reply = await runMutation(
    `verification:youtube:${sourceId}`,
    'youtube-verification.use-automatic-probe',
    { sourceId }
  );
  await reloadAfterMutation(reply);
};

const refreshAddedNotification = async (
  platform: 'youtube' | 'twitch' | 'twitcasting',
  source: string,
  selectionVersion: number,
  submitted: YouTubeForm | TwitchForm | TwitCastingForm
) => {
  const token = discordToken();
  const guild = selectedGuild.value;
  if (!token || !guild) return;
  try {
    const snapshot = normalizeSnapshot(
      await getGuildSettings(apiURL, token, guild.id)
    );
    if (
      selectionVersion !== guildSelectionVersion ||
      selectedGuild.value?.id !== guild.id
    )
      return;
    const notification = snapshot.notifications[platform].find(
      (item) => item.sourceId === source
    );
    if (!notification) return;
    if (platform === 'youtube') {
      const item =
        notification as GuildSettingsSnapshot['notifications']['youtube'][number];
      youtubeForms.value = youtubeForms.value.filter(
        (entry) => entry.source !== source
      );
      youtubeForms.value.push({
        source: item.sourceId,
        sourceName: item.sourceName || item.sourceId,
        streamChannelId: item.streamChannelId,
        videoChannelId: item.videoChannelId,
        createEvent: item.createEvent,
        messages: { ...emptyYouTubeMessages, ...item.messages },
        detectionEnabled: item.detectionEnabled
      });
      if (settings.value) {
        settings.value.notifications.youtube =
          settings.value.notifications.youtube.filter(
            (entry) => entry.sourceId !== source
          );
        settings.value.notifications.youtube.push(item);
      }
      if (JSON.stringify(newYouTube.value) === JSON.stringify(submitted))
        newYouTube.value = emptyYouTube();
    } else if (platform === 'twitch') {
      const item =
        notification as GuildSettingsSnapshot['notifications']['twitch'][number];
      twitchForms.value = twitchForms.value.filter(
        (entry) => entry.source !== source
      );
      twitchForms.value.push({
        source: item.sourceId,
        sourceName: item.sourceName || item.sourceId,
        channelId: item.channelId,
        startMessage: item.messages?.start || '',
        endMessage: item.messages?.end || '',
        changeMessage: item.messages?.change || '',
        detectionEnabled: item.detectionEnabled
      });
      if (settings.value) {
        settings.value.notifications.twitch =
          settings.value.notifications.twitch.filter(
            (entry) => entry.sourceId !== source
          );
        settings.value.notifications.twitch.push(item);
      }
      if (JSON.stringify(newTwitch.value) === JSON.stringify(submitted))
        newTwitch.value = emptyTwitch();
    } else {
      const item =
        notification as GuildSettingsSnapshot['notifications']['twitcasting'][number];
      twitcastingForms.value = twitcastingForms.value.filter(
        (entry) => entry.source !== source
      );
      twitcastingForms.value.push({
        source: item.sourceId,
        sourceName: item.sourceName || item.sourceId,
        channelId: item.channelId,
        startMessage: item.startMessage || '',
        detectionEnabled: item.detectionEnabled
      });
      if (settings.value) {
        settings.value.notifications.twitcasting =
          settings.value.notifications.twitcasting.filter(
            (entry) => entry.sourceId !== source
          );
        settings.value.notifications.twitcasting.push(item);
      }
      if (JSON.stringify(newTwitCasting.value) === JSON.stringify(submitted))
        newTwitCasting.value = emptyTwitCasting();
    }
  } catch {
    if (
      selectionVersion === guildSelectionVersion &&
      selectedGuild.value?.id === guild.id
    )
      mutationReply.value = {
        state: 'applied',
        message: '設定已套用，重新載入後可查看新增項目。'
      };
  }
};

const saveYouTube = async (item: YouTubeForm) => {
  const isNew = item === newYouTube.value;
  const formKey = isNew ? 'youtube:new' : `youtube:${item.source}`;
  const guildId = selectedGuild.value?.id;
  const submitted: YouTubeForm = {
    ...item,
    messages: { ...item.messages }
  };
  const selectionVersion = guildSelectionVersion;
  const reply = await runMutation(
    formKey,
    'youtube-notification.upsert',
    {
      source: item.source,
      streamChannelId: item.streamChannelId,
      videoChannelId: item.videoChannelId || item.streamChannelId,
      createEvent: item.createEvent,
      messages: { ...item.messages }
    },
    isNew
  );
  if (reply?.state !== 'applied') {
    if (isNew && guildId) setFormLoading(guildId, formKey, false);
    return;
  }
  if (isNew) {
    await refreshAddedNotification(
      'youtube',
      String(reply.arguments?.sourceId || submitted.source),
      selectionVersion,
      submitted
    );
    if (guildId) setFormLoading(guildId, formKey, false);
    return;
  }
  const stored = settings.value?.notifications.youtube.find(
    (entry) => entry.sourceId === submitted.source
  );
  if (stored)
    Object.assign(stored, {
      streamChannelId: submitted.streamChannelId,
      videoChannelId: submitted.videoChannelId || submitted.streamChannelId,
      createEvent: submitted.createEvent,
      messages: submitted.messages
    });
};
const removeYouTube = async (source: string) => {
  const reply = await runMutation(
    `youtube:${source}`,
    'youtube-notification.remove',
    { source }
  );
  if (reply?.state !== 'applied') return;
  youtubeForms.value = youtubeForms.value.filter(
    (item) => item.source !== source
  );
  if (settings.value)
    settings.value.notifications.youtube =
      settings.value.notifications.youtube.filter(
        (item) => item.sourceId !== source
      );
};
const twitchMessages = (item: TwitchForm): Record<string, string> => ({
  start: item.startMessage,
  end: item.endMessage,
  change: item.changeMessage
});
const saveTwitch = async (item: TwitchForm) => {
  const isNew = item === newTwitch.value;
  const formKey = isNew ? 'twitch:new' : `twitch:${item.source}`;
  const guildId = selectedGuild.value?.id;
  const submitted = { ...item };
  const selectionVersion = guildSelectionVersion;
  const reply = await runMutation(
    formKey,
    'twitch-notification.upsert',
    {
      source: item.source,
      channelId: item.channelId,
      messages: twitchMessages(item)
    },
    isNew
  );
  if (reply?.state !== 'applied') {
    if (isNew && guildId) setFormLoading(guildId, formKey, false);
    return;
  }
  if (isNew) {
    await refreshAddedNotification(
      'twitch',
      String(reply.arguments?.sourceId || submitted.source),
      selectionVersion,
      submitted
    );
    if (guildId) setFormLoading(guildId, formKey, false);
    return;
  }
  const stored = settings.value?.notifications.twitch.find(
    (entry) => entry.sourceId === submitted.source
  );
  if (stored)
    Object.assign(stored, {
      channelId: submitted.channelId,
      messages: twitchMessages(submitted)
    });
};
const removeTwitch = async (source: string) => {
  const reply = await runMutation(
    `twitch:${source}`,
    'twitch-notification.remove',
    { source }
  );
  if (reply?.state !== 'applied') return;
  twitchForms.value = twitchForms.value.filter(
    (item) => item.source !== source
  );
  if (settings.value)
    settings.value.notifications.twitch =
      settings.value.notifications.twitch.filter(
        (item) => item.sourceId !== source
      );
};
const saveTwitCasting = async (item: TwitCastingForm) => {
  const isNew = item === newTwitCasting.value;
  const formKey = isNew ? 'twitcasting:new' : `twitcasting:${item.source}`;
  const guildId = selectedGuild.value?.id;
  const submitted = { ...item };
  const selectionVersion = guildSelectionVersion;
  const reply = await runMutation(
    formKey,
    'twitcasting-notification.upsert',
    {
      source: item.source,
      channelId: item.channelId,
      startMessage: item.startMessage
    },
    isNew
  );
  if (reply?.state !== 'applied') {
    if (isNew && guildId) setFormLoading(guildId, formKey, false);
    return;
  }
  if (isNew) {
    await refreshAddedNotification(
      'twitcasting',
      String(reply.arguments?.sourceId || submitted.source),
      selectionVersion,
      submitted
    );
    if (guildId) setFormLoading(guildId, formKey, false);
    return;
  }
  const stored = settings.value?.notifications.twitcasting.find(
    (entry) => entry.sourceId === submitted.source
  );
  if (stored)
    Object.assign(stored, {
      channelId: submitted.channelId,
      startMessage: submitted.startMessage
    });
};
const removeTwitCasting = async (source: string) => {
  const reply = await runMutation(
    `twitcasting:${source}`,
    'twitcasting-notification.remove',
    { source }
  );
  if (reply?.state !== 'applied') return;
  twitcastingForms.value = twitcastingForms.value.filter(
    (item) => item.source !== source
  );
  if (settings.value)
    settings.value.notifications.twitcasting =
      settings.value.notifications.twitcasting.filter(
        (item) => item.sourceId !== source
      );
};
const reloadAfterUnknown = async () => {
  await loadSettings();
  if (!settingsError.value) mutationReply.value = null;
};

const startGuildDrag = (event: PointerEvent) => {
  const list = guildList.value;
  if (!list || event.button !== 0) return;
  dragStart = {
    x: event.clientX,
    y: event.clientY,
    left: list.scrollLeft,
    top: list.scrollTop
  };
  guildDragged = false;
  dragPointerId = event.pointerId;
};
const dragGuildList = (event: PointerEvent) => {
  const list = guildList.value;
  if (!list || !dragStart) return;
  if ((event.buttons & 1) === 0) {
    stopGuildDrag();
    return;
  }
  if (
    Math.abs(event.clientX - dragStart.x) > 4 ||
    Math.abs(event.clientY - dragStart.y) > 4
  )
    guildDragged = true;
  if (guildDragged && !list.hasPointerCapture(event.pointerId)) {
    try {
      list.setPointerCapture(event.pointerId);
    } catch {
      stopGuildDrag();
      return;
    }
  }
  list.scrollLeft = dragStart.left - (event.clientX - dragStart.x);
  list.scrollTop = dragStart.top - (event.clientY - dragStart.y);
};
const stopGuildDrag = () => {
  const list = guildList.value;
  if (list && dragPointerId !== null && list.hasPointerCapture(dragPointerId))
    list.releasePointerCapture(dragPointerId);
  dragStart = null;
  dragPointerId = null;
};
const cancelGuildClick = (event: MouseEvent) => {
  if (!guildDragged) return;
  event.preventDefault();
  event.stopPropagation();
  guildDragged = false;
};
const scrollGuildList = (event: WheelEvent) => {
  const list = guildList.value;
  if (!list) return;
  if (list.scrollWidth > list.clientWidth) {
    event.preventDefault();
    list.scrollLeft += event.deltaY || event.deltaX;
  }
};
const updateGuildScrollHints = () => {
  const list = guildList.value;
  if (!list) return;
  const horizontal = list.scrollWidth > list.clientWidth;
  const position = horizontal ? list.scrollLeft : list.scrollTop;
  const maximum = horizontal
    ? list.scrollWidth - list.clientWidth
    : list.scrollHeight - list.clientHeight;
  canScrollBackward.value = position > 0;
  canScrollForward.value = position < maximum - 1;
};

const finishGuildDrag = () => stopGuildDrag();

watch(mutationReply, (reply) => {
  clearTimeout(toastTimer);
  if (reply && reply.state !== 'unknown' && reply.state !== 'timeout')
    toastTimer = setTimeout(() => (mutationReply.value = null), 4000);
});
watch(availablePlatforms, (platforms) => {
  if (!platforms.some((platform) => platform.id === activePlatform.value))
    activePlatform.value = platforms[0]?.id || 'youtube';
});
onMounted(() => {
  loadGuilds();
  window.addEventListener('pointerup', finishGuildDrag);
  window.addEventListener('blur', finishGuildDrag);
  window.addEventListener('resize', updateGuildScrollHints);
});
onBeforeUnmount(() => {
  settingsRequest?.abort();
  clearTimeout(toastTimer);
  window.removeEventListener('pointerup', finishGuildDrag);
  window.removeEventListener('blur', finishGuildDrag);
  window.removeEventListener('resize', updateGuildScrollHints);
});
</script>

<style scoped>
/* stylelint-disable-next-line at-rule-no-unknown */
@reference '../index.css';

.settings-page {
  @apply min-h-[calc(100vh-7rem)] bg-neutral-900 lg:h-[calc(100dvh-7rem)] lg:min-h-0 lg:overflow-hidden;
}

.settings-page > .mb-6,
.settings-page > .rounded,
.settings-page > p {
  @apply mx-4 mt-4;
}

.settings-layout {
  @apply grid min-h-[calc(100vh-7rem)] content-start grid-cols-[minmax(0,1fr)] lg:h-full lg:min-h-0 lg:grid-cols-[280px_minmax(0,1fr)];
}

.settings-sidebar {
  @apply min-w-0 border-b border-zinc-700 bg-neutral-800 lg:h-full lg:overflow-hidden lg:border-r lg:border-b-0;
}

.sidebar-heading {
  @apply border-b border-zinc-700 p-4;
}

.guild-list-wrap {
  @apply relative min-h-0 lg:h-[calc(100%-6.75rem)];
}

.guild-list {
  @apply flex w-full max-w-full cursor-grab gap-2 overflow-auto p-3 select-none active:cursor-grabbing lg:h-full lg:flex-col;

  scrollbar-width: none;
  touch-action: pan-x pan-y;
}

.guild-list::-webkit-scrollbar {
  display: none;
}

.guild-card {
  @apply w-64 min-w-64 shrink-0 lg:w-full lg:min-w-0;
}

.guild-card .mt-3 {
  @apply mt-1;
}

.guild-scroll-hint {
  @apply pointer-events-none absolute z-10 flex h-8 w-8 items-center justify-center rounded-full border border-zinc-600 bg-zinc-900/90 text-zinc-300 shadow;
}

.guild-scroll-hint-back {
  @apply top-1/2 left-3 -translate-y-1/2 lg:top-3 lg:left-1/2 lg:-translate-x-1/2 lg:translate-y-0;
}

.guild-scroll-hint-forward {
  @apply top-1/2 right-3 -translate-y-1/2 lg:top-auto lg:right-auto lg:bottom-3 lg:left-1/2 lg:-translate-x-1/2 lg:translate-y-0;
}

.settings-content {
  @apply min-w-0 p-4 lg:h-full lg:overflow-y-auto lg:p-6;

  scrollbar-width: none;
}

.settings-content::-webkit-scrollbar {
  display: none;
}

.settings-main-tabs {
  @apply -mx-4 flex overflow-x-auto border-y border-zinc-700 bg-neutral-800 px-4 lg:-mx-6 lg:px-6;
}

.settings-main-tabs button {
  @apply min-h-11 shrink-0 border-b-2 border-transparent px-4 text-sm font-medium text-zinc-400;
}

.settings-main-tabs button.active {
  @apply border-indigo-400 bg-zinc-900 text-white;
}

.settings-sub-tabs {
  @apply -mx-4 mb-5 flex min-h-10 overflow-x-auto border-b border-zinc-700 bg-zinc-900 px-4 lg:-mx-6 lg:px-6;
}

.settings-sub-tabs button {
  @apply shrink-0 border-b-2 border-transparent px-4 text-sm text-zinc-400;
}

.settings-sub-tabs button.active {
  @apply border-indigo-400 font-medium text-indigo-200;
}

.settings-section {
  @apply mb-6 rounded border border-zinc-700 bg-zinc-900 p-5;
}

.settings-toast {
  @apply fixed right-4 bottom-4 z-50 max-w-[calc(100vw-2rem)] shadow-lg;
}

.settings-toast-enter-active,
.settings-toast-leave-active {
  transition:
    opacity 150ms ease,
    transform 150ms ease;
}

.settings-toast-enter-from,
.settings-toast-leave-to {
  opacity: 0;
  transform: translateY(0.5rem);
}

@media (prefers-reduced-motion: reduce) {
  .settings-toast-enter-active,
  .settings-toast-leave-active {
    transition: none;
  }
}

.settings-section h2,
.notification-form h3 {
  @apply text-lg font-bold text-white;
}

.section-help {
  @apply mt-1 text-sm text-zinc-400;
}

.settings-row {
  @apply flex flex-wrap items-center justify-between gap-4 rounded border border-zinc-700 bg-neutral-800 p-4;
}

.settings-row strong {
  @apply text-zinc-100;
}

.settings-row p,
.empty-note {
  @apply mt-1 text-sm text-zinc-400;
}

.verification-card {
  @apply grid gap-3 rounded border border-zinc-700 bg-neutral-800 p-4;
}

.tier-role-list {
  @apply grid gap-1 text-sm text-zinc-400;
}

.settings-grid {
  @apply mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3;
}

.settings-grid > .btn {
  @apply justify-self-start md:col-span-2 xl:col-span-3;
}

label {
  @apply grid gap-1 text-sm font-medium text-zinc-200;
}

.field {
  @apply w-full rounded border border-zinc-600 bg-neutral-800 px-3 py-2 text-zinc-100;
  @apply focus:border-indigo-400 focus:outline-2 focus:outline-offset-2 focus:outline-indigo-300;
}

select.field {
  appearance: none;
  padding-right: 2.75rem;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 20 20' fill='none' stroke='%23d4d4d8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 8 4 4 4-4'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.875rem center;
}

@media (forced-colors: active) {
  select.field {
    appearance: auto;
    background-image: none;
  }
}

.field[readonly] {
  @apply cursor-default bg-neutral-900 text-white;
}

.checkbox-label {
  @apply flex min-h-11 items-center gap-2;
}

.wide {
  @apply md:col-span-2 xl:col-span-3;
}

.notification-form {
  @apply mt-4 rounded border border-zinc-700 p-4;
}

button:disabled {
  @apply cursor-not-allowed opacity-60;
}
</style>
