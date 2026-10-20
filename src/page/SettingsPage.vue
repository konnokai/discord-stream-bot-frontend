<template>
  <div class="settings-page">
    <div v-if="!hasDiscordToken" class="login-gate">
      <h1 class="text-2xl font-bold text-white">伺服器設定</h1>
      <p class="mt-1 text-sm text-zinc-400">
        選擇要管理的伺服器，就能更新各項設定
      </p>
      <div class="mt-6 rounded bg-amber-900/70 p-4 text-amber-100">
        <p>請先登入 Discord，才能查看可管理的伺服器。</p>
        <a
          href="/"
          class="mt-3 inline-block underline"
          @click.prevent="openDiscord"
        >
          前往 Discord 登入
        </a>
      </div>
      <a
        href="/"
        data-spa-link
        class="mt-6 inline-block text-sm text-indigo-300 underline"
      >
        返回帳號連結
      </a>
    </div>

    <div v-else class="settings-shell" :data-pane="mobilePane">
      <nav
        class="guild-rail"
        aria-label="伺服器"
        :inert="isMobile && mobilePane === 'content'"
      >
        <a
          href="/"
          data-spa-link
          class="rail-button"
          title="返回帳號連結"
          aria-label="返回帳號連結"
        >
          <House :size="24" aria-hidden="true" />
        </a>
        <div class="rail-divider" aria-hidden="true"></div>
        <div class="guild-rail-list">
          <LoadingSpinner v-if="guildsLoading" class="mx-auto" />
          <button
            v-for="guild in sortedGuilds"
            :key="guild.id"
            type="button"
            class="guild-icon"
            :class="{
              selected: selectedGuild?.id === guild.id,
              'not-installed': !guild.botInstalled
            }"
            :title="guild.name"
            :aria-label="
              guild.botInstalled
                ? guild.name
                : `${guild.name}（尚未安裝機器人）`
            "
            :aria-pressed="selectedGuild?.id === guild.id"
            @click="selectGuild(guild)"
          >
            <img
              v-if="guild.icon"
              :src="`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=96`"
              alt=""
            />
            <span v-else aria-hidden="true">
              {{ guildInitials(guild.name) }}
            </span>
          </button>
        </div>
        <a
          :href="generalInviteUrl"
          class="rail-button rail-invite"
          title="邀請機器人"
          aria-label="邀請機器人"
        >
          <Plus :size="24" aria-hidden="true" />
        </a>
      </nav>

      <aside
        class="channel-sidebar"
        :inert="isMobile && mobilePane === 'content'"
      >
        <header class="sidebar-header">
          <div class="min-w-0">
            <h1
              class="truncate font-bold text-white"
              :title="selectedGuild?.name"
            >
              {{ selectedGuild?.name || '伺服器設定' }}
            </h1>
            <p v-if="settings" class="truncate text-xs text-zinc-400">
              <template v-if="settings.guild.memberCount !== undefined">
                {{ settings.guild.memberCount.toLocaleString() }} 位成員 ·
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
            v-if="selectedGuild?.botInstalled"
            type="button"
            class="icon-button"
            :title="settingsLoading ? '重新載入中…' : '重新載入設定'"
            :aria-label="settingsLoading ? '重新載入中' : '重新載入設定'"
            :disabled="settingsLoading || hasPendingMutations"
            @click="loadSettings"
          >
            <RefreshCw
              :size="18"
              :class="{ 'animate-spin': settingsLoading }"
              aria-hidden="true"
            />
          </button>
        </header>

        <div class="sidebar-body">
          <div v-if="guildsLoading" class="sidebar-note" role="status">
            <p>正在載入伺服器…</p>
            <div
              class="loading-progress-track mt-3"
              role="progressbar"
              aria-label="正在載入伺服器"
            >
              <span class="loading-progress-value"></span>
            </div>
          </div>
          <div v-else-if="guildsError" class="sidebar-note text-red-200">
            <p>{{ guildsError }}</p>
            <button
              class="btn mt-3 bg-red-700 active:bg-red-600"
              @click="loadGuilds"
            >
              重新載入伺服器
            </button>
          </div>
          <p v-else-if="guilds.length === 0" class="sidebar-note">
            目前沒有可管理的伺服器
          </p>
          <p v-else-if="!selectedGuild" class="sidebar-note">
            從左邊選擇要管理的伺服器
          </p>
          <div v-else-if="!selectedGuild.botInstalled" class="sidebar-note">
            <p>這個伺服器還沒加入直播小幫手</p>
            <button
              v-if="isMobile"
              type="button"
              class="btn mt-3 bg-indigo-600 active:bg-indigo-500"
              @click="showContent"
            >
              查看邀請說明
            </button>
          </div>
          <div
            v-else-if="settingsLoading && !settings"
            class="sidebar-note"
            role="status"
          >
            <p>正在載入設定…</p>
            <div
              class="loading-progress-track mt-3"
              role="progressbar"
              aria-label="正在載入伺服器設定"
            >
              <span class="loading-progress-value"></span>
            </div>
          </div>
          <div v-else-if="settingsError" class="sidebar-note text-red-200">
            <p>{{ settingsError }}</p>
            <button
              class="btn mt-3 bg-red-700 active:bg-red-600"
              @click="loadSettings"
            >
              重新載入設定
            </button>
          </div>

          <nav v-else-if="settings" class="channel-list" aria-label="設定功能">
            <button
              v-if="hasCapability('guild.common')"
              type="button"
              class="channel-item"
              :class="{ active: activeFeature === 'general' }"
              :aria-current="activeFeature === 'general' ? 'page' : undefined"
              @click="openFeature('general')"
            >
              <Settings :size="18" aria-hidden="true" />
              一般設定
            </button>
            <template v-for="group in featureGroups" :key="group.feature">
              <template v-if="group.platforms.length">
                <h2 class="channel-category">{{ group.label }}</h2>
                <button
                  v-for="platform in group.platforms"
                  :key="platform"
                  type="button"
                  class="channel-item"
                  :class="{ active: isActiveChannel(group.feature, platform) }"
                  :aria-current="
                    isActiveChannel(group.feature, platform)
                      ? 'page'
                      : undefined
                  "
                  @click="openFeature(group.feature, platform)"
                >
                  <Hash :size="18" aria-hidden="true" />
                  {{ platformLabels[platform] }}
                </button>
              </template>
            </template>
          </nav>
        </div>

        <footer class="sidebar-footer">
          <a href="/privacy" data-spa-link>隱私權政策</a>
          <a href="/terms" data-spa-link>使用條款</a>
        </footer>
      </aside>

      <main
        class="settings-content"
        :inert="isMobile && mobilePane === 'nav'"
        :aria-busy="settingsLoading"
      >
        <header class="content-header">
          <button
            ref="backButton"
            type="button"
            class="icon-button back-button"
            aria-label="返回功能列表"
            @click="showNav"
          >
            <ArrowLeft :size="20" aria-hidden="true" />
          </button>
          <Hash
            v-if="settings && activeFeature !== 'general'"
            :size="20"
            class="shrink-0 text-zinc-400"
            aria-hidden="true"
          />
          <h2 class="truncate font-bold text-white" :title="contentTitle">
            {{ contentTitle }}
          </h2>
        </header>

        <div class="content-body">
          <div
            v-if="selectedGuild && !selectedGuild.botInstalled"
            class="rounded bg-amber-900/70 p-5 text-amber-100"
          >
            <p class="text-sm">
              先將直播小幫手加入「{{
                selectedGuild.name
              }}」，加入後按「重新檢查」，即可設定通知
            </p>
            <div class="mt-4 flex flex-wrap gap-3">
              <a
                :href="inviteUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="btn bg-indigo-600 active:bg-indigo-500"
              >
                邀請機器人
              </a>
              <button
                type="button"
                class="btn gap-2 bg-zinc-700 active:bg-zinc-600"
                :disabled="guildsLoading"
                @click="recheckInstall"
              >
                <LoadingSpinner v-if="guildsLoading" />
                {{ guildsLoading ? '檢查中…' : '重新檢查' }}
              </button>
              <a
                href="https://konnokai.notion.site/a4fff40bd95c4bec9edca5b78cdd5d37"
                target="_blank"
                rel="noopener noreferrer"
                class="btn bg-amber-800 active:bg-amber-700"
              >
                查看設定教學
              </a>
            </div>
            <p v-if="installCheckFailed" class="mt-3 text-sm" role="status">
              還沒偵測到機器人，請確認已加入這個伺服器後再檢查一次
            </p>
          </div>

          <p v-else-if="!settings" class="empty-note">
            {{
              selectedGuild
                ? '設定載入後，從功能列表選擇要管理的項目'
                : '從左邊選擇要管理的伺服器'
            }}
          </p>

          <template v-else>
            <section
              v-if="
                activeFeature === 'general' && hasCapability('guild.common')
              "
            >
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
                      v-if="isStaleChannel(commonForm.globalNoticeChannelId)"
                      :value="commonForm.globalNoticeChannelId"
                      disabled
                    >
                      {{ staleChannelLabel(commonForm.globalNoticeChannelId) }}
                    </option>
                    <option
                      v-for="channel in writableChannels"
                      :key="channel.id"
                      :value="channel.id"
                    >
                      # {{ channel.name }}
                    </option>
                  </select>
                  <span class="block text-xs font-normal text-zinc-400">
                    小幫手的維護與更新公告會發到這裡
                  </span>
                </label>
                <label>
                  驗證紀錄頻道
                  <select
                    v-model="commonForm.verificationLogChannelId"
                    class="field"
                  >
                    <option value="">不設定</option>
                    <option
                      v-if="isStaleChannel(commonForm.verificationLogChannelId)"
                      :value="commonForm.verificationLogChannelId"
                      disabled
                    >
                      {{
                        staleChannelLabel(commonForm.verificationLogChannelId)
                      }}
                    </option>
                    <option
                      v-for="channel in writableChannels"
                      :key="channel.id"
                      :value="channel.id"
                    >
                      # {{ channel.name }}
                    </option>
                  </select>
                  <span class="block text-xs font-normal text-zinc-400">
                    會員驗證與訂閱驗證的結果會記錄在這裡，要先設定才能新增驗證
                  </span>
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
                hasCapability(`${activePlatform}-notification`)
              "
            >
              <p class="section-help">
                {{
                  activePlatform === 'youtube'
                    ? '直播或影片上線時發送通知。沒有設定影片通知頻道時，通知會發到直播通知頻道'
                    : '直播開始時發送通知到指定頻道'
                }}
              </p>
              <button
                type="button"
                class="btn create-button bg-indigo-600 active:bg-indigo-500"
                @click="openNotificationDialog()"
              >
                新增 {{ activePlatformLabel }} 通知
              </button>
              <h3 class="list-title">
                {{ activePlatformLabel }} 通知 —
                {{ notificationRows.length }} 個
              </h3>
              <div v-if="notificationRows.length" class="item-list">
                <div class="item-list-head" aria-hidden="true">
                  <span>來源</span>
                  <span>通知頻道</span>
                </div>
                <button
                  v-for="row in notificationRows"
                  :key="row.source"
                  type="button"
                  class="item-row"
                  @click="openNotificationDialog(row.source)"
                >
                  <span class="item-main">
                    <strong :title="row.sourceName">
                      {{ row.sourceName }}
                    </strong>
                    <span v-if="row.sourceName !== row.source">
                      {{ row.source }}
                    </span>
                  </span>
                  <span class="item-meta">
                    <!-- 影片頻道沒另外設定時會存成直播頻道，相同就不用分兩行 -->
                    <template
                      v-if="
                        'videoChannelId' in row &&
                        row.videoChannelId &&
                        row.videoChannelId !== row.channelId
                      "
                    >
                      <span class="block truncate">
                        直播 # {{ channelName(row.channelId) }}
                      </span>
                      <span class="block truncate">
                        影片 # {{ channelName(row.videoChannelId) }}
                      </span>
                    </template>
                    <template v-else>
                      # {{ channelName(row.channelId) }}
                    </template>
                    <span
                      v-if="row.detectionEnabled === false"
                      class="block text-amber-300"
                    >
                      尚未建立爬蟲，通知不會送出
                    </span>
                  </span>
                  <ChevronRight
                    :size="18"
                    class="hidden shrink-0 text-zinc-500 md:block"
                    aria-hidden="true"
                  />
                </button>
              </div>
              <p v-else class="empty-note">
                目前還沒有 {{ activePlatformLabel }} 通知
              </p>
            </section>

            <section
              v-if="
                activeFeature === 'crawler' &&
                hasCapability(`${activePlatform}-crawler`)
              "
            >
              <p v-if="!activeCrawler.enabled" class="section-help">
                {{ activePlatformLabel }} 平台目前已停用，暫時無法新增爬蟲
              </p>
              <p v-else class="section-help">
                目前使用 {{ activeCrawler.count }} 個來源（{{
                  activeCrawler.unlimited
                    ? '不限數量'
                    : `上限 ${activeCrawler.limit} 個`
                }}）
                <span v-if="crawlerAddDisabled" class="block text-amber-300">
                  已達上限，無法再新增。若有需要請聯絡 Bot 擁有者
                </span>
              </p>
              <button
                type="button"
                class="btn create-button bg-indigo-600 active:bg-indigo-500"
                :disabled="crawlerAddDisabled"
                @click="openCrawlerDialog()"
              >
                {{
                  activeCrawler.enabled
                    ? `新增 ${activePlatformLabel} 爬蟲`
                    : '平台目前已停用'
                }}
              </button>
              <h3 class="list-title">
                {{ activePlatformLabel }} 爬蟲 —
                {{ activeCrawler.items.length }} 個
              </h3>
              <div v-if="activeCrawler.items.length" class="item-list">
                <div
                  v-for="item in activeCrawler.items"
                  :key="item.sourceId"
                  class="item-row"
                >
                  <span class="item-main">
                    <strong :title="item.sourceName || item.sourceId">
                      {{ item.sourceName || item.sourceId }}
                    </strong>
                    <span v-if="item.sourceName">{{ item.sourceId }}</span>
                  </span>
                  <button
                    type="button"
                    class="icon-button danger"
                    :title="`移除 ${item.sourceName || item.sourceId}`"
                    :aria-label="`移除 ${item.sourceName || item.sourceId}`"
                    :disabled="
                      isFormLoading(
                        `crawler:${activePlatform}:${item.sourceId}`
                      )
                    "
                    @click="removeCrawler(item.sourceId)"
                  >
                    <LoadingSpinner
                      v-if="
                        isFormLoading(
                          `crawler:${activePlatform}:${item.sourceId}`
                        )
                      "
                    />
                    <Trash v-else :size="18" aria-hidden="true" />
                  </button>
                </div>
              </div>
              <p v-else class="empty-note">
                目前還沒有 {{ activePlatformLabel }} 爬蟲來源
              </p>
            </section>

            <section
              v-if="
                activeFeature === 'verification' &&
                hasCapability(`${activePlatform}-verification`)
              "
            >
              <p class="section-help">設定驗證來源、Discord 身分組和驗證紀錄</p>
              <p
                v-if="verificationLogChannelIssue"
                class="mb-4 rounded bg-amber-900/70 p-3 text-sm text-amber-100"
              >
                {{ verificationLogChannelIssue }}
                <button
                  v-if="hasCapability('guild.common')"
                  type="button"
                  class="ml-2 font-medium underline underline-offset-2"
                  @click="openFeature('general')"
                >
                  前往一般設定
                </button>
              </p>
              <button
                type="button"
                class="btn create-button bg-indigo-600 active:bg-indigo-500"
                :disabled="!!verificationLogChannelIssue"
                @click="openVerificationDialog()"
              >
                新增{{ verificationName }}設定
              </button>
              <h3 class="list-title">
                {{ activePlatformLabel }} {{ verificationName }} —
                {{ activeVerification.length }} 個
              </h3>
              <div v-if="activeVerification.length" class="item-list">
                <div class="item-list-head" aria-hidden="true">
                  <span>來源</span>
                  <span>身分組</span>
                </div>
                <button
                  v-for="item in activeVerification"
                  :key="item.sourceId"
                  type="button"
                  class="item-row"
                  @click="openVerificationDialog(item.sourceId)"
                >
                  <span class="item-main">
                    <strong :title="item.sourceName || item.sourceId">
                      {{ item.sourceName || item.sourceId }}
                    </strong>
                    <span>
                      已驗證 {{ item.verifiedMemberCount.toLocaleString() }} 人
                    </span>
                  </span>
                  <span class="item-meta">
                    @{{ roleName(item.roleId) }}
                    <span
                      v-if="item.deletionPending"
                      class="block text-amber-300"
                    >
                      正在清理
                    </span>
                    <span
                      v-else-if="item.previousRoleId"
                      class="block text-amber-300"
                    >
                      舊身分組遷移中
                    </span>
                  </span>
                  <ChevronRight
                    :size="18"
                    class="hidden shrink-0 text-zinc-500 md:block"
                    aria-hidden="true"
                  />
                </button>
              </div>
              <p v-else class="empty-note">
                目前還沒有 {{ activePlatformLabel }} 驗證設定
              </p>
            </section>
          </template>
        </div>
      </main>

      <SettingsDialog
        v-if="dialog?.kind === 'notification'"
        :title="`${dialog?.source ? '編輯' : '新增'} ${activePlatformLabel} 通知`"
        @cancel="requestCloseDialog"
        @close="closeDialog"
      >
        <form class="dialog-form" @submit.prevent="submitNotification">
          <label>
            {{
              dialog?.source
                ? `${activePlatformLabel} 頻道`
                : activePlatform === 'chzzk'
                  ? '來源 ID 或頻道網址'
                  : '來源 ID'
            }}
            <input
              v-if="dialog?.source"
              :value="notificationDraft.sourceName"
              class="field"
              readonly
            />
            <input
              v-else
              v-model.trim="notificationDraft.source"
              class="field"
              required
              autocomplete="off"
            />
          </label>

          <template v-if="activePlatform === 'youtube'">
            <label>
              直播通知頻道
              <select
                v-model="youtubeDraft.streamChannelId"
                class="field"
                required
              >
                <option value="" disabled>請選擇頻道</option>
                <option
                  v-if="isStaleChannel(youtubeDraft.streamChannelId)"
                  :value="youtubeDraft.streamChannelId"
                  disabled
                >
                  {{ staleChannelLabel(youtubeDraft.streamChannelId) }}
                </option>
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
              <select v-model="youtubeDraft.videoChannelId" class="field">
                <option value="">未設定（沿用直播通知頻道）</option>
                <option
                  v-if="isStaleChannel(youtubeDraft.videoChannelId)"
                  :value="youtubeDraft.videoChannelId"
                  disabled
                >
                  {{ staleChannelLabel(youtubeDraft.videoChannelId) }}
                </option>
                <option
                  v-for="channel in writableChannels"
                  :key="channel.id"
                  :value="channel.id"
                >
                  # {{ channel.name }}
                </option>
              </select>
            </label>
            <p class="text-sm text-zinc-400">{{ messageFieldHelp }}</p>
            <RoleMentionField
              v-model="youtubeDraft.messages.newStream"
              label="新直播訊息"
              :roles="mentionRoles"
            />
            <RoleMentionField
              v-model="youtubeDraft.messages.newVideo"
              label="新影片訊息"
              :roles="mentionRoles"
            />
            <RoleMentionField
              v-model="youtubeDraft.messages.start"
              label="直播開始訊息"
              :roles="mentionRoles"
            />
            <RoleMentionField
              v-model="youtubeDraft.messages.end"
              label="直播結束訊息"
              :roles="mentionRoles"
            />
            <RoleMentionField
              v-model="youtubeDraft.messages.changeTime"
              label="時間變更訊息"
              :roles="mentionRoles"
            />
            <RoleMentionField
              v-model="youtubeDraft.messages.delete"
              label="直播刪除訊息"
              :roles="mentionRoles"
            />
            <label class="checkbox-label">
              <input v-model="youtubeDraft.createEvent" type="checkbox" />
              當有新直播時，自動建立 Discord 活動
            </label>
          </template>

          <template v-else>
            <label>
              通知頻道
              <select
                v-model="otherNotificationDraft.channelId"
                class="field"
                required
              >
                <option value="" disabled>請選擇頻道</option>
                <option
                  v-if="isStaleChannel(otherNotificationDraft.channelId)"
                  :value="otherNotificationDraft.channelId"
                  disabled
                >
                  {{ staleChannelLabel(otherNotificationDraft.channelId) }}
                </option>
                <option
                  v-for="channel in writableChannels"
                  :key="channel.id"
                  :value="channel.id"
                >
                  # {{ channel.name }}
                </option>
              </select>
            </label>
            <p class="text-sm text-zinc-400">{{ messageFieldHelp }}</p>
            <RoleMentionField
              v-model="otherNotificationDraft.startMessage"
              label="開播訊息"
              :roles="mentionRoles"
              :multiline="activePlatform === 'twitcasting'"
            />
            <RoleMentionField
              v-if="activePlatform === 'twitch'"
              v-model="twitchDraft.endMessage"
              label="結束訊息"
              :roles="mentionRoles"
            />
            <RoleMentionField
              v-if="activePlatform === 'chzzk'"
              v-model="chzzkDraft.endMessage"
              label="結束訊息"
              :roles="mentionRoles"
            />
            <RoleMentionField
              v-if="activePlatform === 'twitch'"
              v-model="twitchDraft.changeMessage"
              label="變更訊息"
              :roles="mentionRoles"
            />
          </template>

          <p
            v-if="
              dialog?.source && notificationDraft.detectionEnabled === false
            "
            class="text-sm text-amber-300"
          >
            這個頻道還沒有爬蟲，通知不會送出
            <button
              type="button"
              class="ml-2 font-medium underline underline-offset-2"
              @click="openCrawler(activePlatform, notificationDraft.source)"
            >
              新增 {{ activePlatformLabel }} 爬蟲
            </button>
          </p>

          <div class="dialog-actions">
            <button
              v-if="dialog?.source"
              type="button"
              class="btn mr-auto gap-2 bg-red-800 active:bg-red-700"
              :disabled="isFormLoading(notificationKey)"
              @click="removeNotification"
            >
              <LoadingSpinner
                v-if="
                  isMutationLoading(
                    notificationKey,
                    `${activePlatform}-notification.remove`
                  )
                "
              />
              移除
            </button>
            <button
              type="button"
              class="btn bg-zinc-700 active:bg-zinc-600"
              @click="requestCloseDialog"
            >
              取消
            </button>
            <button
              class="btn gap-2 bg-indigo-600 active:bg-indigo-500"
              :disabled="isFormLoading(notificationKey)"
            >
              <LoadingSpinner
                v-if="
                  isMutationLoading(
                    notificationKey,
                    `${activePlatform}-notification.upsert`
                  )
                "
              />
              {{ dialog?.source ? '儲存' : '新增通知' }}
            </button>
          </div>
        </form>
      </SettingsDialog>

      <SettingsDialog
        v-if="dialog?.kind === 'crawler'"
        :title="`新增 ${activePlatformLabel} 爬蟲`"
        @cancel="requestCloseDialog"
        @close="closeDialog"
      >
        <form class="dialog-form" @submit.prevent="submitCrawler">
          <label>
            頻道網址、登入名稱（login）或 ID
            <input
              v-model.trim="newCrawlerSources[activePlatform]"
              class="field"
              required
              autocomplete="off"
            />
          </label>
          <p v-if="crawlerAddDisabled" class="text-sm text-amber-300">
            {{
              activeCrawler.enabled
                ? '已達此伺服器的爬蟲數量上限，若有需要請聯絡 Bot 擁有者。'
                : '平台目前已停用'
            }}
          </p>
          <div class="dialog-actions">
            <button
              type="button"
              class="btn bg-zinc-700 active:bg-zinc-600"
              @click="requestCloseDialog"
            >
              取消
            </button>
            <button
              class="btn gap-2 bg-indigo-600 active:bg-indigo-500"
              :disabled="
                crawlerAddDisabled ||
                isFormLoading(`crawler:${activePlatform}:new`)
              "
            >
              <LoadingSpinner
                v-if="isFormLoading(`crawler:${activePlatform}:new`)"
              />
              新增爬蟲
            </button>
          </div>
        </form>
      </SettingsDialog>

      <SettingsDialog
        v-if="dialog?.kind === 'verification'"
        :title="
          editingVerification
            ? editingVerification.sourceName || editingVerification.sourceId
            : `新增${verificationName}設定`
        "
        @cancel="requestCloseDialog"
        @close="closeDialog"
      >
        <form
          v-if="!dialog?.source"
          class="dialog-form"
          @submit.prevent="submitVerification"
        >
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
            <select v-model="newVerification.roleId" class="field" required>
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
          <div class="dialog-actions">
            <button
              type="button"
              class="btn bg-zinc-700 active:bg-zinc-600"
              @click="requestCloseDialog"
            >
              取消
            </button>
            <button
              class="btn gap-2 bg-indigo-600 active:bg-indigo-500"
              :disabled="isFormLoading(`verification:${activePlatform}:new`)"
            >
              <LoadingSpinner
                v-if="isFormLoading(`verification:${activePlatform}:new`)"
              />
              新增驗證設定
            </button>
          </div>
        </form>

        <div v-else-if="editingVerification" class="dialog-form">
          <p class="text-sm text-zinc-400">
            已有 {{ editingVerification.verifiedMemberCount.toLocaleString() }}
            人完成驗證，還有
            {{ editingVerification.pendingRoleRemovalCount.toLocaleString() }}
            人的身分組待移除
          </p>
          <p
            v-if="editingVerification.previousRoleId"
            class="text-sm text-amber-300"
          >
            舊身分組 {{ roleName(editingVerification.previousRoleId) }}
            仍在遷移中
          </p>
          <p
            v-if="editingVerification.deletionPending"
            class="text-sm text-amber-300"
          >
            正在清理，暫時無法更新
          </p>
          <form class="dialog-inline-form" @submit.prevent="submitVerification">
            <label>
              Discord 身分組
              <select
                v-model="verificationRole"
                class="field"
                required
                :disabled="editingVerification.deletionPending"
              >
                <option
                  v-if="isStaleRole(verificationRole)"
                  :value="verificationRole"
                  disabled
                >
                  已刪除的身分組，請重新選擇
                </option>
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
              class="btn gap-2 bg-indigo-600 active:bg-indigo-500"
              :disabled="
                editingVerification.deletionPending ||
                isFormLoading(verificationKey)
              "
            >
              <LoadingSpinner
                v-if="
                  isMutationLoading(
                    verificationKey,
                    `${activePlatform}-verification.upsert`
                  )
                "
              />
              儲存
            </button>
          </form>

          <template v-if="activePlatform === 'youtube'">
            <p class="text-sm">
              會員限定影片偵測模式：
              {{ editingVerification.probeMode === 'manual' ? '手動' : '自動' }}
              <template v-if="editingVerification.probeVideoId">
                （{{ editingVerification.probeVideoId }}）
              </template>
            </p>
            <form
              class="dialog-inline-form"
              @submit.prevent="setProbeVideo(editingVerification.sourceId)"
            >
              <label>
                手動偵測影片網址或 ID
                <input
                  v-model.trim="probeVideos[editingVerification.sourceId]"
                  class="field"
                  required
                  :disabled="editingVerification.deletionPending"
                />
              </label>
              <button
                class="btn gap-2 bg-zinc-700 active:bg-zinc-600"
                :disabled="
                  editingVerification.deletionPending ||
                  isFormLoading(verificationKey)
                "
              >
                <LoadingSpinner
                  v-if="
                    isMutationLoading(
                      verificationKey,
                      'youtube-verification.set-probe-video'
                    )
                  "
                />
                指定影片
              </button>
              <button
                type="button"
                class="btn gap-2 bg-zinc-700 active:bg-zinc-600"
                :disabled="
                  editingVerification.deletionPending ||
                  isFormLoading(verificationKey)
                "
                @click="useAutomaticProbe(editingVerification.sourceId)"
              >
                <LoadingSpinner
                  v-if="
                    isMutationLoading(
                      verificationKey,
                      'youtube-verification.use-automatic-probe'
                    )
                  "
                />
                改回自動偵測
              </button>
            </form>
          </template>
          <div v-else class="grid gap-1 text-sm text-zinc-400">
            <p>層級身分組：</p>
            <p
              v-for="tierRole in tierRoleNames(editingVerification)"
              :key="tierRole"
            >
              {{ tierRole }}
            </p>
          </div>

          <div class="dialog-actions">
            <button
              type="button"
              class="btn mr-auto gap-2 bg-red-800 active:bg-red-700"
              :disabled="
                editingVerification.deletionPending ||
                isFormLoading(verificationKey)
              "
              @click="removeVerificationFromDialog"
            >
              <LoadingSpinner
                v-if="
                  isMutationLoading(
                    verificationKey,
                    `${activePlatform}-verification.remove`
                  )
                "
              />
              移除設定
            </button>
            <button
              type="button"
              class="btn bg-zinc-700 active:bg-zinc-600"
              @click="requestCloseDialog"
            >
              關閉
            </button>
          </div>
        </div>
      </SettingsDialog>

      <div
        ref="toast"
        popover="manual"
        class="settings-toast"
        :class="replyClass"
        role="status"
        aria-live="polite"
      >
        <template v-if="mutationReply">
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
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  inject,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch
} from 'vue';
import {
  ArrowLeft,
  ChevronRight,
  Hash,
  House,
  Plus,
  RefreshCw,
  Settings,
  Trash
} from '@lucide/vue';
import LoadingSpinner from '../components/LoadingSpinner.vue';
import RoleMentionField from '../components/RoleMentionField.vue';
import SettingsDialog from '../components/SettingsDialog.vue';
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

interface ChzzkForm {
  source: string;
  sourceName: string;
  channelId: string;
  startMessage: string;
  endMessage: string;
  detectionEnabled?: boolean;
}

type Feature = 'general' | 'notification' | 'crawler' | 'verification';
type Platform = 'youtube' | 'twitch' | 'twitcasting' | 'chzzk';

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
const toast = ref<HTMLElement | null>(null);
let toastTimer: ReturnType<typeof setTimeout> | undefined;
let guildSelectionVersion = 0;
// 手機版一次只顯示「伺服器＋功能列表」或「內容」其中一頁
const mobilePane = ref<'nav' | 'content'>('nav');
const mobileQuery = window.matchMedia('(width < 48rem)');
const isMobile = ref(mobileQuery.matches);
const syncMobile = (event: MediaQueryListEvent) => {
  isMobile.value = event.matches;
};
type DialogState = {
  kind: 'notification' | 'crawler' | 'verification';
  source?: string;
};
const dialog = ref<DialogState | null>(null);
const closeDialog = () => {
  dialog.value = null;
};
const commonForm = ref<CommonForm>({
  locale: 'zh-TW',
  globalNoticeChannelId: '',
  verificationLogChannelId: ''
});
const youtubeForms = ref<YouTubeForm[]>([]);
const twitchForms = ref<TwitchForm[]>([]);
const twitcastingForms = ref<TwitCastingForm[]>([]);
const chzzkForms = ref<ChzzkForm[]>([]);
const newCrawlerSources = ref<Record<Platform, string>>({
  youtube: '',
  twitch: '',
  twitcasting: '',
  chzzk: ''
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
const emptyChzzk = (): ChzzkForm => ({
  source: '',
  sourceName: '',
  channelId: '',
  startMessage: '',
  endMessage: ''
});
// 對話框編輯的是複本，按取消就不會改到列表
const youtubeDraft = ref(emptyYouTube());
const twitchDraft = ref(emptyTwitch());
const twitcastingDraft = ref(emptyTwitCasting());
const chzzkDraft = ref(emptyChzzk());
const otherNotificationDraft = computed(() =>
  activePlatform.value === 'twitch'
    ? twitchDraft.value
    : activePlatform.value === 'chzzk'
      ? chzzkDraft.value
      : twitcastingDraft.value
);
const notificationDraft = computed(() =>
  activePlatform.value === 'youtube'
    ? youtubeDraft.value
    : otherNotificationDraft.value
);
const notificationKey = computed(
  () => `${activePlatform.value}:${dialog.value?.source || 'new'}`
);
const verificationKey = computed(
  () => `verification:${activePlatform.value}:${dialog.value?.source}`
);
const verificationRole = ref('');

const writableChannels = computed(() =>
  (settings.value?.resources.channels || []).filter(
    (channel) => channel.canView && channel.canSendMessages
  )
);
const mentionRoles = computed(() => settings.value?.resources.roles || []);
const platformLabels: Record<Platform, string> = {
  youtube: 'YouTube',
  twitch: 'Twitch',
  twitcasting: 'TwitCasting',
  chzzk: 'CHZZK'
};
const platformsByFeature: Record<Exclude<Feature, 'general'>, Platform[]> = {
  notification: ['youtube', 'twitch', 'twitcasting', 'chzzk'],
  crawler: ['youtube', 'twitch', 'twitcasting', 'chzzk'],
  verification: ['youtube', 'twitch']
};
const featureLabels: Record<Exclude<Feature, 'general'>, string> = {
  notification: '直播通知',
  crawler: '爬蟲',
  verification: '會員驗證'
};
const featureGroups = computed(() =>
  (['notification', 'crawler', 'verification'] as const).map((feature) => ({
    feature,
    label: featureLabels[feature],
    platforms: platformsByFeature[feature].filter((platform) =>
      hasCapability(`${platform}-${feature}`)
    )
  }))
);
const isActiveChannel = (feature: Feature, platform: Platform) =>
  activeFeature.value === feature && activePlatform.value === platform;
const activePlatformLabel = computed(
  () => platformLabels[activePlatform.value]
);
const verificationName = computed(() =>
  activePlatform.value === 'twitch' ? '訂閱驗證' : '會員驗證'
);
const contentTitle = computed(() => {
  if (!selectedGuild.value) return '伺服器設定';
  if (!selectedGuild.value.botInstalled) return '請先邀請機器人';
  if (!settings.value) return selectedGuild.value.name;
  if (activeFeature.value === 'general') return '一般設定';
  if (activeFeature.value === 'verification')
    return `${activePlatformLabel.value} ${verificationName.value}`;
  return `${activePlatformLabel.value} ${featureLabels[activeFeature.value]}`;
});
// 頻道列表只有伺服器現存的頻道，找不到就是被刪了
const channelName = (channelId: string) =>
  settings.value?.resources.channels.find((channel) => channel.id === channelId)
    ?.name || '已刪除的頻道';
// 已選的頻道不在可發言清單時，選單會變空白，要補一個選項說明原因
const isStaleChannel = (channelId: string) =>
  !!channelId &&
  !writableChannels.value.some((channel) => channel.id === channelId);
const staleChannelLabel = (channelId: string) =>
  settings.value?.resources.channels.some((channel) => channel.id === channelId)
    ? `# ${channelName(channelId)}（小幫手無法發言，請重新選擇）`
    : '已刪除的頻道，請重新選擇';
const notificationRows = computed(() => {
  if (activePlatform.value === 'youtube')
    return youtubeForms.value.map((item) => ({
      ...item,
      channelId: item.streamChannelId
    }));
  return {
    twitch: twitchForms.value,
    twitcasting: twitcastingForms.value,
    chzzk: chzzkForms.value
  }[activePlatform.value];
});
const emptyCrawler = () => ({
  enabled: false,
  count: 0,
  limit: 0,
  unlimited: false,
  items: []
});
const activeCrawler = computed(
  () => settings.value?.crawlers[activePlatform.value] || emptyCrawler()
);
const crawlerAddDisabled = computed(
  () =>
    !activeCrawler.value.enabled ||
    (!activeCrawler.value.unlimited &&
      activeCrawler.value.count >= activeCrawler.value.limit)
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
const editingVerification = computed(() =>
  dialog.value?.kind === 'verification' && dialog.value.source
    ? activeVerification.value.find(
        (item) => item.sourceId === dialog.value?.source
      )
    : undefined
);
const roleName = (roleId?: string | null) =>
  roleId
    ? settings.value?.resources.roles.find((role) => role.id === roleId)
        ?.name || '已刪除的身分組'
    : '未建立';
// Bot 只在訊息是「-」時跳過這種通知；留空照樣發通知卡片，只是上面沒有文字
const messageFieldHelp =
  '訊息會顯示在通知卡片上方，輸入 @ 可以提及身分組。留空只發通知卡片；填「-」就不發這一種通知';
// Bot 新增驗證前會先檢查紀錄頻道，沒設好一定被拒，先在畫面上講清楚
const verificationLogChannelIssue = computed(() => {
  const channelId = settings.value?.common.verificationLogChannelId || '';
  if (!channelId) return '新增驗證前，要先到「一般設定」選擇驗證紀錄頻道';
  const channel = settings.value?.resources.channels.find(
    (item) => item.id === channelId
  );
  if (!channel) return '驗證紀錄頻道已被刪除，請到「一般設定」重新選擇';
  // 跟 Bot 的檢查一致：要能查看、發言、嵌入連結
  if (!channel.canView || !channel.canSendMessages || !channel.canEmbedLinks)
    return `小幫手在驗證紀錄頻道 # ${channel.name} 缺少查看頻道、傳送訊息或嵌入連結權限，請到 Discord 補上權限，或到「一般設定」換一個頻道`;
  return '';
});
const isStaleRole = (roleId: string) =>
  !!roleId &&
  !settings.value?.resources.roles.some((role) => role.id === roleId);
const tierRoleNames = (item: VerificationItem) =>
  Object.entries(item.tierRoleIds || {}).map(
    ([tier, roleId]) => `層級 ${Number(tier) / 1000}：${roleName(roleId)}`
  );
// 只取第一個字時，同字首的伺服器分不出來；比照 Discord 取每個詞的第一個字，只有一個詞就取前兩個字
// 中文名稱沒有空白，用 Intl.Segmenter 斷詞，「直播小幫手」和「直播同好會」才不會都變成「直播」
const wordSegmenter = new Intl.Segmenter('zh-TW', { granularity: 'word' });
const guildInitials = (name: string) => {
  const words = Array.from(wordSegmenter.segment(name))
    .filter((part) => part.isWordLike)
    .map((part) => part.segment);
  return words.length > 1
    ? words
        .slice(0, 3)
        .map((word) => Array.from(word)[0])
        .join('')
    : Array.from(words[0] || name)
        .slice(0, 2)
        .join('');
};
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
// 側欄的「+」讓使用者自己選伺服器；「請先邀請機器人」才鎖定目前選的伺服器
const generalInviteUrl =
  'https://discordapp.com/api/oauth2/authorize?client_id=758222559392432160&permissions=2416143425&scope=bot%20applications.commands';
const inviteUrl = computed(() => {
  const guildId = selectedGuild.value?.id || '';
  return `${generalInviteUrl}&guild_id=${encodeURIComponent(guildId)}&disable_guild_select=true`;
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
    'settings.source-not-found':
      '找不到這個平台頻道，請確認網址或 ID 是否正確。',
    'settings.invalid-source': '來源格式不正確，請輸入頻道 ID 或頻道網址。',
    'crawler.source-not-found':
      '找不到這個平台頻道，請確認網址或 ID 是否正確。',
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
    'verification.log-channel-missing-permissions':
      '小幫手在驗證紀錄頻道缺少查看頻道、傳送訊息或嵌入連結權限，請補上權限或換一個頻道。',
    'verification.configured': '驗證設定已套用。',
    'verification.removed': '驗證設定已移除。',
    'verification.cleanup-pending':
      '設定已標記為待移除，相關身分組會在背景清理。',
    'verification.not-configured': '找不到此驗證設定。',
    'verification.limit-reached':
      '已達此伺服器的驗證頻道數量上限，若有需要請聯絡 Bot 擁有者。',
    'verification.guild-member-requirement':
      '此伺服器人數未達驗證功能的使用門檻，若有需要請聯絡 Bot 擁有者。',
    'verification.manage-roles-required': '小幫手沒有管理身分組的權限。',
    'verification.role-invalid': '無法使用所選的身分組。',
    'verification.role-too-high':
      '所選身分組的位置高於小幫手可管理的最高位置。',
    'verification.role-collision': '這個身分組已被另一個驗證平台使用。',
    'verification.deletion-pending': '設定正在清理，暫時無法更新。',
    'verification.source-not-found':
      '找不到這個平台頻道，請確認網址或 ID 是否正確。',
    'verification.source-ineligible':
      '此 Twitch 頻道不是實況盟友或合作夥伴，無法使用訂閱驗證。',
    'verification.probe-video-set': '已改用手動指定的偵測影片。',
    'verification.probe-automatic': '已改回自動偵測影片。',
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
// 後端回 401 代表 Discord 登入已失效，留著舊 token 只會一直失敗，直接回登入畫面
const handleExpiredSession = (error: unknown): boolean => {
  if (!(error instanceof AdminSettingsApiError) || error.status !== 401)
    return false;
  sessionStorage.removeItem('DT');
  sessionStorage.removeItem('DD');
  hasDiscordToken.value = false;
  return true;
};
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
    twitcasting: snapshot.notifications?.twitcasting || [],
    chzzk: snapshot.notifications?.chzzk || []
  },
  crawlers: {
    youtube: snapshot.crawlers?.youtube || emptyCrawler(),
    twitch: snapshot.crawlers?.twitch || emptyCrawler(),
    twitcasting: snapshot.crawlers?.twitcasting || emptyCrawler(),
    chzzk: snapshot.crawlers?.chzzk || emptyCrawler()
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
  chzzkForms.value = settings.value.notifications.chzzk.map((item) => ({
    source: item.sourceId,
    sourceName: item.sourceName || item.sourceId,
    channelId: item.channelId,
    startMessage: item.messages?.start || '',
    endMessage: item.messages?.end || '',
    detectionEnabled: item.detectionEnabled
  }));
  newCrawlerSources.value = {
    youtube: '',
    twitch: '',
    twitcasting: '',
    chzzk: ''
  };
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
    if (!selectedGuild.value) void restoreView();
  } catch (error) {
    if (handleExpiredSession(error)) return;
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
    if (handleExpiredSession(error)) return;
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

const selectGuild = async (guild: AdminGuild, force = false) => {
  if (!force && selectedGuild.value?.id === guild.id) {
    // 手機版從邀請說明返回後，沒裝機器人的伺服器沒有功能列表，再點一次要回到邀請說明
    if (!guild.botInstalled) showContent();
    return;
  }
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
  installCheckFailed.value = false;
  // 沒裝機器人就沒有功能列表可選，手機版直接切到邀請說明；還原畫面時由 restoreView 決定停在哪一頁
  if (!restoringView) {
    if (guild.botInstalled) showNav();
    else showContent();
  }
  if (guild.botInstalled) await loadSettings();
};

// 伺服器列表只在進頁面時抓一次，邀請機器人後要重抓才知道裝好了沒
const installCheckFailed = ref(false);
const recheckInstall = async () => {
  const guildId = selectedGuild.value?.id;
  installCheckFailed.value = false;
  await loadGuilds();
  const guild = guilds.value.find((item) => item.id === guildId);
  if (!guild || guildsError.value || selectedGuild.value?.id !== guildId)
    return;
  if (guild.botInstalled) await selectGuild(guild, true);
  else installCheckFailed.value = true;
};

// 手機版進內容頁時多記一筆歷史，系統返回手勢才會回到功能列表，而不是離開設定頁
let contentPushPending = false;
const showContent = () => {
  if (!isMobile.value || window.history.state?.settingsPane === 'content') {
    mobilePane.value = 'content';
    return;
  }
  if (contentPushPending) return;
  contentPushPending = true;
  // iOS 返回手勢先顯示離開那一頁時拍的畫面，等新的反白畫上去再記歷史，畫面才不會停在上一個選項
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      contentPushPending = false;
      window.history.pushState(
        { ...window.history.state, settingsPane: 'content' },
        ''
      );
      mobilePane.value = 'content';
    })
  );
};
const showNav = () => {
  if (window.history.state?.settingsPane === 'content') window.history.back();
  else mobilePane.value = 'nav';
};
// 手機版切頁後另一頁變成 inert，焦點會掉到 body；進內容頁移到返回鍵，回來時還給原本按的按鈕
const backButton = ref<HTMLButtonElement | null>(null);
let paneTrigger: HTMLElement | null = null;
watch(mobilePane, async (pane) => {
  if (!isMobile.value) return;
  // pre flush 時 DOM 還沒套 inert，這時的焦點才是使用者按的那個
  if (pane === 'content')
    paneTrigger =
      document.activeElement instanceof HTMLElement &&
      document.activeElement !== document.body
        ? document.activeElement
        : null;
  // 用手指點按鈕不會給焦點；這時硬移焦點，iOS 會畫出焦點框，看起來像 hover 殘留，所以只在原本有焦點時才移
  if (!paneTrigger) return;
  await nextTick();
  // 內容頁還在滑入動畫時位在畫面外，不擋捲動的話瀏覽器會把整個版面往旁邊捲
  const options = { preventScroll: true };
  if (pane === 'content') backButton.value?.focus(options);
  else if (paneTrigger.isConnected) paneTrigger.focus(options);
});

// 對話框在手機上是全螢幕，也記一筆歷史，返回手勢才會先關對話框
type DialogHistory = DialogState & {
  guildId?: string;
  feature: Feature;
  platform: Platform;
};
// 往前滑回對話框那一筆時，只在還是同一個伺服器、同一個功能、項目也還在時才開回來
const canReopenDialog = (target: DialogHistory) =>
  !!settings.value &&
  target.guildId === selectedGuild.value?.id &&
  target.feature === activeFeature.value &&
  target.platform === activePlatform.value &&
  (!target.source ||
    (target.kind === 'notification'
      ? notificationRows.value.some((row) => row.source === target.source)
      : activeVerification.value.some(
          (item) => item.sourceId === target.source
        )));
const syncPane = () => {
  const state = window.history.state;
  const target: DialogHistory | undefined = state?.settingsDialog;
  if (!target) closeDialog();
  // iOS 往前滑會先顯示對話框開著的截圖，不開回來就會閃一下又消失；草稿關閉時沒清掉，直接沿用
  else if (!dialog.value && canReopenDialog(target))
    dialog.value = { kind: target.kind, source: target.source };
  mobilePane.value = state?.settingsPane === 'content' ? 'content' : 'nav';
};

// 開對話框時記下草稿，關閉前比對，有改過才問要不要放棄
const dialogDraftSnapshot = () => {
  const current = dialog.value;
  if (!current) return '';
  if (current.kind === 'notification')
    return JSON.stringify(notificationDraft.value);
  if (current.kind === 'crawler')
    return newCrawlerSources.value[activePlatform.value];
  return JSON.stringify(
    current.source
      ? [verificationRole.value, probeVideos.value[current.source] || '']
      : newVerification.value
  );
};
let dialogDraftBaseline = '';
watch(
  () => dialog.value && `${dialog.value.kind}:${dialog.value.source}`,
  () => (dialogDraftBaseline = dialogDraftSnapshot())
);
const dialogFormKey = computed(() => {
  const current = dialog.value;
  if (current?.kind === 'notification') return notificationKey.value;
  return `${current?.kind}:${activePlatform.value}:${current?.source || 'new'}`;
});
// 返回手勢不經過這裡：草稿關閉時沒清掉，往前滑就能開回來
const requestCloseDialog = () => {
  // 儲存中關掉會看不到結果
  if (isFormLoading(dialogFormKey.value)) return;
  if (
    dialogDraftSnapshot() !== dialogDraftBaseline &&
    !window.confirm('有尚未儲存的變更，確定要關閉嗎？')
  )
    return;
  closeDialog();
};

watch(dialog, (current) => {
  const inHistory = !!window.history.state?.settingsDialog;
  if (current && (inHistory || isMobile.value)) {
    const entry = {
      ...window.history.state,
      settingsDialog: {
        ...current,
        guildId: selectedGuild.value?.id,
        feature: activeFeature.value,
        platform: activePlatform.value
      } satisfies DialogHistory
    };
    // 對話框裡改開另一個對話框（例如通知換成新增爬蟲）只更新同一筆
    if (inHistory) window.history.replaceState(entry, '');
    else window.history.pushState(entry, '');
  }
  // 用叉叉、取消或儲存關掉時，把那筆歷史退掉，免得下一次返回沒反應
  else if (!current && inHistory) window.history.back();
});

// 手機切到別的 App 時，系統可能回收背景分頁，切回來就整頁重載；記住目前位置和對話框草稿，重載後還原
const viewStateKey = 'settingsView';
type ViewState = {
  guildId: string;
  feature: Feature;
  platform: Platform;
  pane: 'nav' | 'content';
  dialog: DialogState | null;
  drafts: {
    youtube: YouTubeForm;
    twitch: TwitchForm;
    twitcasting: TwitCastingForm;
    chzzk: ChzzkForm;
    crawler: Record<Platform, string>;
    verification: { source: string; roleId: string };
    verificationRole: string;
    probeVideos: Record<string, string>;
  };
};
// 還原期間會先被重設成預設值，這時不能把存好的狀態蓋掉
let restoringView = false;
watch(
  (): ViewState | null =>
    selectedGuild.value && {
      guildId: selectedGuild.value.id,
      feature: activeFeature.value,
      platform: activePlatform.value,
      pane: mobilePane.value,
      dialog: dialog.value,
      drafts: {
        youtube: youtubeDraft.value,
        twitch: twitchDraft.value,
        twitcasting: twitcastingDraft.value,
        chzzk: chzzkDraft.value,
        crawler: newCrawlerSources.value,
        verification: newVerification.value,
        verificationRole: verificationRole.value,
        probeVideos: probeVideos.value
      }
    },
  (view) => {
    if (view && !restoringView)
      sessionStorage.setItem(viewStateKey, JSON.stringify(view));
  },
  { deep: true }
);
const restoreView = async () => {
  let view: ViewState | null = null;
  try {
    view = JSON.parse(sessionStorage.getItem(viewStateKey) || 'null');
  } catch {
    return;
  }
  const guild = view && guilds.value.find((item) => item.id === view.guildId);
  if (!view || !guild) return;
  restoringView = true;
  try {
    // selectGuild 會先同步重設成一般設定再去載入設定，所以要在它之後蓋回來
    const selecting = selectGuild(guild);
    activeFeature.value = view.feature;
    activePlatform.value = view.platform;
    if (view.pane === 'content') showContent();
    else mobilePane.value = 'nav';
    await selecting;
    // 對話框裡的頻道與身分組選單要等設定載入完才有選項
    if (!view.dialog || !view.drafts || !settings.value) return;
    if (selectedGuild.value?.id !== guild.id) return;
    youtubeDraft.value = view.drafts.youtube;
    twitchDraft.value = view.drafts.twitch;
    twitcastingDraft.value = view.drafts.twitcasting;
    chzzkDraft.value = view.drafts.chzzk;
    newCrawlerSources.value = view.drafts.crawler;
    newVerification.value = view.drafts.verification;
    verificationRole.value = view.drafts.verificationRole;
    probeVideos.value = view.drafts.probeVideos;
    dialog.value = view.dialog;
  } finally {
    restoringView = false;
  }
};

const openFeature = (feature: Feature, platform?: Platform) => {
  activeFeature.value = feature;
  if (platform) activePlatform.value = platform;
  showContent();
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

const openCrawlerDialog = (source = '') => {
  newCrawlerSources.value[activePlatform.value] = source;
  dialog.value = { kind: 'crawler' };
};

const openCrawler = (platform: Platform, source: string) => {
  activePlatform.value = platform;
  activeFeature.value = 'crawler';
  openCrawlerDialog(source);
};

const submitCrawler = async () => {
  const platform = activePlatform.value;
  const key = `crawler:${platform}:new`;
  const source = newCrawlerSources.value[platform];
  const reply = await runMutation(
    key,
    `${platform}-crawler.add` as AdminMutationAction,
    { source }
  );
  if (reply?.state === 'applied' || reply?.state === 'pending') {
    newCrawlerSources.value[platform] = '';
    closeDialog();
  }
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

const openVerificationDialog = (sourceId?: string) => {
  if (sourceId)
    verificationRole.value =
      activeVerification.value.find((item) => item.sourceId === sourceId)
        ?.roleId || '';
  else newVerification.value = { source: '', roleId: '' };
  dialog.value = { kind: 'verification', source: sourceId };
};

const submitVerification = async () => {
  const platform = activePlatform.value as 'youtube' | 'twitch';
  const sourceId = dialog.value?.source;
  const reply = await runMutation(
    `verification:${platform}:${sourceId || 'new'}`,
    `${platform}-verification.upsert` as AdminMutationAction,
    sourceId
      ? { source: sourceId, roleId: verificationRole.value }
      : { ...newVerification.value }
  );
  if (reply?.state === 'applied' || reply?.state === 'pending') closeDialog();
  await reloadAfterMutation(reply);
};

const removeVerificationFromDialog = async () => {
  const sourceId = dialog.value?.source;
  if (
    !sourceId ||
    !window.confirm(`確定要移除 ${activePlatformLabel.value} 驗證設定？`)
  )
    return;
  const platform = activePlatform.value as 'youtube' | 'twitch';
  const reply = await runMutation(
    `verification:${platform}:${sourceId}`,
    `${platform}-verification.remove` as AdminMutationAction,
    { sourceId }
  );
  if (reply?.state === 'applied' || reply?.state === 'pending') closeDialog();
  if (reply?.state === 'pending' && settings.value) {
    const item = settings.value.verification[platform].find(
      (entry) => entry.sourceId === sourceId
    );
    if (item) item.deletionPending = true;
    return;
  }
  await reloadAfterMutation(reply);
};

const setProbeVideo = async (sourceId: string) => {
  const reply = await runMutation(
    `verification:youtube:${sourceId}`,
    'youtube-verification.set-probe-video',
    { sourceId, video: probeVideos.value[sourceId] }
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
  platform: 'youtube' | 'twitch' | 'twitcasting' | 'chzzk',
  source: string,
  selectionVersion: number
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
      youtubeForms.value.unshift({
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
        settings.value.notifications.youtube.unshift(item);
      }
    } else if (platform === 'twitch') {
      const item =
        notification as GuildSettingsSnapshot['notifications']['twitch'][number];
      twitchForms.value = twitchForms.value.filter(
        (entry) => entry.source !== source
      );
      twitchForms.value.unshift({
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
        settings.value.notifications.twitch.unshift(item);
      }
    } else if (platform === 'twitcasting') {
      const item =
        notification as GuildSettingsSnapshot['notifications']['twitcasting'][number];
      twitcastingForms.value = twitcastingForms.value.filter(
        (entry) => entry.source !== source
      );
      twitcastingForms.value.unshift({
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
        settings.value.notifications.twitcasting.unshift(item);
      }
    } else {
      const item =
        notification as GuildSettingsSnapshot['notifications']['chzzk'][number];
      chzzkForms.value = chzzkForms.value.filter(
        (entry) => entry.source !== source
      );
      chzzkForms.value.unshift({
        source: item.sourceId,
        sourceName: item.sourceName || item.sourceId,
        channelId: item.channelId,
        startMessage: item.messages?.start || '',
        endMessage: item.messages?.end || '',
        detectionEnabled: item.detectionEnabled
      });
      if (settings.value) {
        settings.value.notifications.chzzk =
          settings.value.notifications.chzzk.filter(
            (entry) => entry.sourceId !== source
          );
        settings.value.notifications.chzzk.unshift(item);
      }
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

const saveYouTube = async (
  item: YouTubeForm,
  isNew: boolean
): Promise<boolean> => {
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
    return false;
  }
  if (isNew) {
    await refreshAddedNotification(
      'youtube',
      String(reply.arguments?.sourceId || submitted.source),
      selectionVersion
    );
    if (guildId) setFormLoading(guildId, formKey, false);
    return true;
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
  const form = youtubeForms.value.find(
    (entry) => entry.source === submitted.source
  );
  if (form) Object.assign(form, submitted);
  return true;
};
const removeYouTube = async (source: string) => {
  const reply = await runMutation(
    `youtube:${source}`,
    'youtube-notification.remove',
    { source }
  );
  if (reply?.state !== 'applied') return false;
  youtubeForms.value = youtubeForms.value.filter(
    (item) => item.source !== source
  );
  if (settings.value)
    settings.value.notifications.youtube =
      settings.value.notifications.youtube.filter(
        (item) => item.sourceId !== source
      );
  return true;
};
const twitchMessages = (item: TwitchForm): Record<string, string> => ({
  start: item.startMessage,
  end: item.endMessage,
  change: item.changeMessage
});
const saveTwitch = async (
  item: TwitchForm,
  isNew: boolean
): Promise<boolean> => {
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
    return false;
  }
  if (isNew) {
    await refreshAddedNotification(
      'twitch',
      String(reply.arguments?.sourceId || submitted.source),
      selectionVersion
    );
    if (guildId) setFormLoading(guildId, formKey, false);
    return true;
  }
  const stored = settings.value?.notifications.twitch.find(
    (entry) => entry.sourceId === submitted.source
  );
  if (stored)
    Object.assign(stored, {
      channelId: submitted.channelId,
      messages: twitchMessages(submitted)
    });
  const form = twitchForms.value.find(
    (entry) => entry.source === submitted.source
  );
  if (form) Object.assign(form, submitted);
  return true;
};
const removeTwitch = async (source: string) => {
  const reply = await runMutation(
    `twitch:${source}`,
    'twitch-notification.remove',
    { source }
  );
  if (reply?.state !== 'applied') return false;
  twitchForms.value = twitchForms.value.filter(
    (item) => item.source !== source
  );
  if (settings.value)
    settings.value.notifications.twitch =
      settings.value.notifications.twitch.filter(
        (item) => item.sourceId !== source
      );
  return true;
};
const saveTwitCasting = async (
  item: TwitCastingForm,
  isNew: boolean
): Promise<boolean> => {
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
    return false;
  }
  if (isNew) {
    await refreshAddedNotification(
      'twitcasting',
      String(reply.arguments?.sourceId || submitted.source),
      selectionVersion
    );
    if (guildId) setFormLoading(guildId, formKey, false);
    return true;
  }
  const stored = settings.value?.notifications.twitcasting.find(
    (entry) => entry.sourceId === submitted.source
  );
  if (stored)
    Object.assign(stored, {
      channelId: submitted.channelId,
      startMessage: submitted.startMessage
    });
  const form = twitcastingForms.value.find(
    (entry) => entry.source === submitted.source
  );
  if (form) Object.assign(form, submitted);
  return true;
};
const removeTwitCasting = async (source: string) => {
  const reply = await runMutation(
    `twitcasting:${source}`,
    'twitcasting-notification.remove',
    { source }
  );
  if (reply?.state !== 'applied') return false;
  twitcastingForms.value = twitcastingForms.value.filter(
    (item) => item.source !== source
  );
  if (settings.value)
    settings.value.notifications.twitcasting =
      settings.value.notifications.twitcasting.filter(
        (item) => item.sourceId !== source
      );
  return true;
};
const chzzkMessages = (item: ChzzkForm): Record<string, string> => ({
  start: item.startMessage,
  end: item.endMessage
});
const saveChzzk = async (item: ChzzkForm, isNew: boolean): Promise<boolean> => {
  const formKey = isNew ? 'chzzk:new' : `chzzk:${item.source}`;
  const guildId = selectedGuild.value?.id;
  const submitted = { ...item };
  const selectionVersion = guildSelectionVersion;
  const reply = await runMutation(
    formKey,
    'chzzk-notification.upsert',
    {
      source: item.source,
      channelId: item.channelId,
      messages: chzzkMessages(item)
    },
    isNew
  );
  if (reply?.state !== 'applied') {
    if (isNew && guildId) setFormLoading(guildId, formKey, false);
    return false;
  }
  if (isNew) {
    await refreshAddedNotification(
      'chzzk',
      String(reply.arguments?.sourceId || submitted.source),
      selectionVersion
    );
    if (guildId) setFormLoading(guildId, formKey, false);
    return true;
  }
  const stored = settings.value?.notifications.chzzk.find(
    (entry) => entry.sourceId === submitted.source
  );
  if (stored)
    Object.assign(stored, {
      channelId: submitted.channelId,
      messages: chzzkMessages(submitted)
    });
  const form = chzzkForms.value.find(
    (entry) => entry.source === submitted.source
  );
  if (form) Object.assign(form, submitted);
  return true;
};
const removeChzzk = async (source: string) => {
  const reply = await runMutation(
    `chzzk:${source}`,
    'chzzk-notification.remove',
    { source }
  );
  if (reply?.state !== 'applied') return false;
  chzzkForms.value = chzzkForms.value.filter((item) => item.source !== source);
  if (settings.value)
    settings.value.notifications.chzzk =
      settings.value.notifications.chzzk.filter(
        (item) => item.sourceId !== source
      );
  return true;
};
const reloadAfterUnknown = async () => {
  await loadSettings();
  if (!settingsError.value) mutationReply.value = null;
};

const copyForm = <T,>(item: T): T => JSON.parse(JSON.stringify(item)) as T;
const openNotificationDialog = (source?: string) => {
  const pick = <T extends { source: string }>(
    forms: T[],
    empty: () => T
  ): T | undefined => {
    if (!source) return empty();
    const item = forms.find((entry) => entry.source === source);
    return item && copyForm(item);
  };
  switch (activePlatform.value) {
    case 'youtube': {
      const draft = pick(youtubeForms.value, emptyYouTube);
      if (!draft) return;
      youtubeDraft.value = draft;
      break;
    }
    case 'twitch': {
      const draft = pick(twitchForms.value, emptyTwitch);
      if (!draft) return;
      twitchDraft.value = draft;
      break;
    }
    case 'twitcasting': {
      const draft = pick(twitcastingForms.value, emptyTwitCasting);
      if (!draft) return;
      twitcastingDraft.value = draft;
      break;
    }
    case 'chzzk': {
      const draft = pick(chzzkForms.value, emptyChzzk);
      if (!draft) return;
      chzzkDraft.value = draft;
      break;
    }
  }
  dialog.value = { kind: 'notification', source };
};
const submitNotification = async () => {
  const isNew = !dialog.value?.source;
  const save = {
    youtube: () => saveYouTube(youtubeDraft.value, isNew),
    twitch: () => saveTwitch(twitchDraft.value, isNew),
    twitcasting: () => saveTwitCasting(twitcastingDraft.value, isNew),
    chzzk: () => saveChzzk(chzzkDraft.value, isNew)
  }[activePlatform.value];
  if (await save()) closeDialog();
};
const removeNotification = async () => {
  const source = dialog.value?.source;
  if (
    !source ||
    !window.confirm(`確定要移除 ${activePlatformLabel.value} 通知？`)
  )
    return;
  const remove = {
    youtube: removeYouTube,
    twitch: removeTwitch,
    twitcasting: removeTwitCasting,
    chzzk: removeChzzk
  }[activePlatform.value];
  if (await remove(source)) closeDialog();
};

// showModal() 會讓頁面其他部分變成 inert，toast 要跟著進 top layer 才不會被遮罩蓋住
watch(
  mutationReply,
  (reply) => {
    clearTimeout(toastTimer);
    const element = toast.value;
    if (element?.matches(':popover-open')) element.hidePopover();
    if (!reply) return;
    // 對話框開著時 toast 的「重新載入設定」按鈕點不到；結果不確定時草稿也該丟掉
    if (reply.state === 'unknown' || reply.state === 'timeout') closeDialog();
    element?.showPopover();
    if (reply.state !== 'unknown' && reply.state !== 'timeout')
      toastTimer = setTimeout(() => (mutationReply.value = null), 4000);
  },
  { flush: 'post' }
);
onMounted(() => {
  loadGuilds();
  mobileQuery.addEventListener('change', syncMobile);
  window.addEventListener('popstate', syncPane);
});
onBeforeUnmount(() => {
  settingsRequest?.abort();
  clearTimeout(toastTimer);
  mobileQuery.removeEventListener('change', syncMobile);
  window.removeEventListener('popstate', syncPane);
});
</script>

<style scoped>
/* stylelint-disable-next-line at-rule-no-unknown */
@reference '../index.css';

.settings-page {
  @apply h-dvh overflow-hidden bg-neutral-800;
}

.login-gate {
  @apply mx-auto max-w-2xl p-6;
}

.settings-shell {
  @apply relative grid h-full grid-cols-[72px_240px_minmax(0,1fr)] overflow-hidden;
}

/* 第一欄：伺服器頭像列 */
.guild-rail {
  @apply flex min-h-0 flex-col items-center gap-2 bg-zinc-950 py-3;
}

.guild-rail-list {
  @apply flex min-h-0 w-full flex-1 flex-col items-center gap-2 overflow-y-auto py-1;

  scrollbar-width: none;
}

.guild-rail-list::-webkit-scrollbar {
  display: none;
}

.rail-divider {
  @apply h-0.5 w-8 shrink-0 rounded bg-zinc-700;
}

.rail-button,
.guild-icon {
  @apply relative flex h-12 w-12 shrink-0 items-center justify-center rounded-3xl bg-neutral-800 text-zinc-200 transition-[border-radius,background-color] duration-150;
  @apply focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white;
}

.rail-button:hover,
.guild-icon:hover,
.guild-icon.selected {
  @apply rounded-2xl;
}

.rail-button:hover {
  @apply bg-indigo-600 text-white;
}

.rail-invite {
  @apply text-teal-400;
}

.rail-invite:hover {
  @apply bg-teal-600;
}

.guild-icon img {
  @apply h-full w-full rounded-[inherit] object-cover;
}

.guild-icon span {
  @apply text-sm font-bold;
}

.guild-icon:hover,
.guild-icon.selected {
  @apply bg-indigo-600 text-white;
}

.guild-icon.not-installed {
  @apply opacity-50 hover:opacity-80;
}

/* 選中的伺服器左側白色指示條 */
.guild-icon::before {
  @apply absolute top-1/2 -left-3 h-0 w-1 -translate-y-1/2 rounded-r bg-white transition-[height] duration-150;

  content: '';
}

.guild-icon:hover::before {
  @apply h-5;
}

.guild-icon.selected::before {
  @apply h-10;
}

/* 第二欄：功能列表 */
.channel-sidebar {
  @apply flex min-h-0 min-w-0 flex-col bg-neutral-900;
}

.sidebar-header {
  @apply flex min-h-14 items-center justify-between gap-2 border-b border-zinc-950 px-4 py-2;
}

.sidebar-body {
  @apply min-h-0 flex-1 overflow-y-auto px-2 py-3;
}

.sidebar-note {
  @apply px-2 text-sm text-zinc-400;
}

.channel-list {
  @apply grid gap-0.5;
}

.channel-category {
  @apply mt-4 mb-1 px-2 text-xs font-bold text-zinc-400;
}

.channel-item {
  @apply flex min-h-10 w-full items-center gap-2 rounded px-2 text-left text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200;
  @apply focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-300;
}

.channel-item.active {
  @apply bg-zinc-700/70 text-white;
}

.sidebar-footer {
  @apply flex gap-4 border-t border-zinc-950 bg-zinc-950/40 px-4 py-3 text-xs;
}

.sidebar-footer a {
  @apply text-zinc-400 underline-offset-2 hover:text-zinc-200 hover:underline;
}

.icon-button {
  @apply flex h-11 w-11 shrink-0 items-center justify-center rounded text-zinc-400 hover:bg-zinc-700 hover:text-white;
  @apply focus-visible:outline-2 focus-visible:outline-indigo-300;
}

@media (width >= 48rem) {
  .back-button {
    display: none;
  }
}

.icon-button.danger:hover {
  @apply bg-red-900 text-red-100;
}

/* 第三欄：內容 */
.settings-content {
  @apply flex min-h-0 min-w-0 flex-col bg-neutral-800;
}

.content-header {
  @apply flex min-h-14 shrink-0 items-center gap-2 border-b border-zinc-950 px-4 shadow-sm;
}

.content-body {
  @apply min-h-0 flex-1 overflow-y-auto p-4 md:p-8;
}

.content-body > * {
  @apply max-w-3xl;
}

.section-help {
  @apply text-sm text-zinc-400;
}

.create-button {
  @apply mt-4;
}

.list-title {
  @apply mt-8 mb-2 text-sm font-bold text-zinc-300;
}

.item-list {
  @apply overflow-hidden rounded-lg border border-zinc-700 bg-neutral-900/60;
}

.item-list-head {
  @apply hidden border-b border-zinc-700 px-4 py-2 text-xs font-bold text-zinc-400 md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,14rem)_18px] md:gap-4;
}

.item-row {
  @apply grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 border-b border-zinc-700/60 px-4 py-3 text-left last:border-b-0;
  @apply md:grid-cols-[minmax(0,1fr)_minmax(0,14rem)_18px];
}

button.item-row {
  @apply hover:bg-zinc-700/40 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-300;
}

div.item-row {
  @apply md:grid-cols-[minmax(0,1fr)_auto];
}

.item-main {
  @apply grid min-w-0;
}

.item-main strong {
  @apply truncate font-medium text-zinc-100;
}

.item-main span,
.item-meta {
  @apply truncate text-sm text-zinc-400;
}

.item-meta {
  @apply col-span-2 md:col-span-1;
}

.empty-note {
  @apply mt-3 text-sm text-zinc-400;
}

/* 對話框內的表單（slot 內容套用本元件的 scoped 樣式） */
.dialog-form {
  @apply grid gap-4;
}

.dialog-inline-form {
  @apply flex flex-wrap items-end gap-3;
}

.dialog-inline-form label {
  @apply min-w-56 flex-1;
}

.dialog-actions {
  @apply mt-2 flex flex-wrap justify-end gap-3 border-t border-zinc-700 pt-4;
}

.settings-toast {
  @apply m-0 max-w-[calc(100vw-2rem)] rounded border-0 p-4 shadow-lg;

  inset: auto 1rem 1rem auto;
}

.settings-grid {
  @apply grid gap-4 md:grid-cols-2;
}

.settings-grid > .btn {
  @apply justify-self-start md:col-span-2;
}

label {
  @apply grid content-start gap-1 text-sm font-medium text-zinc-200;
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

button:disabled {
  @apply cursor-not-allowed opacity-60;
}

/* 手機版：內容頁從右邊滑入，蓋住伺服器＋功能列表 */
@media (width < 48rem) {
  .settings-shell {
    @apply grid-cols-[72px_minmax(0,1fr)];
  }

  .settings-content {
    @apply absolute inset-0 z-10 shadow-2xl;

    transform: translateX(100%);
    transition: transform 250ms ease-out;
  }

  .settings-shell[data-pane='content'] .settings-content {
    transform: translateX(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .settings-content,
  .rail-button,
  .guild-icon,
  .guild-icon::before {
    transition: none;
  }
}
</style>
