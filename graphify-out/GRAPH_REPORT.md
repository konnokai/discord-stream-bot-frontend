# Graph Report - auto-discord-ytmember-checker  (2026-08-17)

## Corpus Check
- 33 files · ~36,021 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 349 nodes · 461 edges · 51 communities (25 shown, 26 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.68)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `fd99a8cd`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- SettingsPage.vue
- VerifyWindow.vue
- DiscordSection.vue
- compilerOptions
- scripts
- adminSettings.ts
- refreshAddedNotification
- accountLinks.ts
- App.vue
- runMutation
- refreshAccountLinks
- TwitchSection.vue
- GoogleSection.vue
- 直播小幫手帳號連結前端
- devDependencies
- random.ts
- setFormLoading
- ProgresserCircular.vue
- stopGuildDrag
- autoprefixer
- eslint-config-prettier
- eslint-plugin-vue
- postcss
- postcss-html
- postcss-scss
- prettier
- sass
- stylelint
- stylelint-config-recommended
- stylelint-config-standard
- @tailwindcss/postcss
- tslib
- @types/node
- typescript
- @typescript-eslint/eslint-plugin
- vite
- @vitejs/plugin-vue
- @vue/eslint-config-prettier
- @vue/eslint-config-typescript
- vue-tsc
- wrangler
- roleName
- modules.d.ts
- type.d.ts

## God Nodes (most connected - your core abstractions)
1. `runMutation()` - 19 edges
2. `compilerOptions` - 14 edges
3. `refreshAddedNotification()` - 10 edges
4. `reloadAfterMutation()` - 9 edges
5. `scripts` - 8 edges
6. `refreshAccountLinks()` - 8 edges
7. `loadSettings()` - 7 edges
8. `直播小幫手帳號連結前端` - 7 edges
9. `mutateGuildSettings()` - 6 edges
10. `setFormLoading()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `openDiscord()` --calls--> `startDiscordOAuth()`  [EXTRACTED]
  src/components/DiscordSection.vue → src/lib/discordOAuth.ts
- `refreshAccountLinks()` --calls--> `getAccountLinks()`  [EXTRACTED]
  src/page/VerifyWindow.vue → src/lib/accountLinks.ts
- `startProvider()` --calls--> `startOAuth()`  [EXTRACTED]
  src/page/VerifyWindow.vue → src/lib/accountLinks.ts
- `unlinkProvider()` --calls--> `unlinkAccount()`  [EXTRACTED]
  src/page/VerifyWindow.vue → src/lib/accountLinks.ts
- `runMutation()` --calls--> `mutateGuildSettings()`  [EXTRACTED]
  src/page/SettingsPage.vue → src/lib/adminSettings.ts

## Import Cycles
- None detected.

## Communities (51 total, 26 thin omitted)

### Community 0 - "SettingsPage.vue"
Cohesion: 0.04
Nodes (48): activeCrawler, activeFeature, activeFeatureLabel, activePlatform, activePlatformLabel, activeVerification, apiURL, availablePlatforms (+40 more)

### Community 1 - "VerifyWindow.vue"
Cohesion: 0.08
Nodes (26): accountLinks, apiURL, backendLoadingText, callbackReasonMessages, emptyAccountLinks(), errorText, googleOperationStatus, googleStatus (+18 more)

### Community 2 - "DiscordSection.vue"
Cohesion: 0.09
Nodes (22): emit, isLoading, loadComplete, props, res, shoudShowContent, apiURL, DiscordCallbackResponse (+14 more)

### Community 3 - "compilerOptions"
Cohesion: 0.08
Nodes (24): dom, dom.iterable, esnext, node_modules, scripthost, src/**/*.ts, src/**/*.tsx, src/**/*.vue (+16 more)

### Community 4 - "scripts"
Cohesion: 0.09
Nodes (21): dependencies, tailwindcss, vue, vue3-google-oauth2, engines, node, pnpm, name (+13 more)

### Community 5 - "adminSettings.ts"
Cohesion: 0.15
Nodes (15): AdminChannel, AdminCrawlerItem, AdminCrawlerPlatform, AdminGuild, AdminMutationAction, AdminMutationReply, AdminReplyState, AdminRole (+7 more)

### Community 6 - "refreshAddedNotification"
Cohesion: 0.18
Nodes (15): getAdminGuilds(), getGuildSettings(), discordToken(), emptyCrawler(), emptyTwitCasting(), emptyTwitch(), emptyYouTube(), loadGuilds() (+7 more)

### Community 7 - "accountLinks.ts"
Cohesion: 0.18
Nodes (12): AccountLinks, AccountLinksApiError, authorizedRequest(), getAccountLinks(), GoogleLinkStatus, GoogleMemberSubscription, GoogleUnlinkResponse, OAuthStartResponse (+4 more)

### Community 8 - "App.vue"
Cohesion: 0.18
Nodes (5): currentPath, handleNavigation(), normalizePath(), syncRoute(), app

### Community 9 - "runMutation"
Cohesion: 0.23
Nodes (13): addCrawler(), addVerification(), reloadAfterMutation(), removeCrawler(), removeTwitCasting(), removeTwitch(), removeVerification(), removeYouTube() (+5 more)

### Community 10 - "refreshAccountLinks"
Cohesion: 0.29
Nodes (10): Toast, handleDiscordAuth(), handleOAuthCallback(), handleUnauthorized(), refreshAccountLinks(), refreshGoogleStatus(), retryAccountLinks(), startProvider() (+2 more)

### Community 11 - "TwitchSection.vue"
Cohesion: 0.22
Nodes (9): confirmUnlink(), emit, props, showUnlinkWarning, startButtonText, statusClass, statusText, TwitchAccountLink (+1 more)

### Community 12 - "GoogleSection.vue"
Cohesion: 0.22
Nodes (8): emit, liveStatusText, props, startButtonText, statusClass, statusText, GoogleAccountLink, GoogleViewStatus

### Community 13 - "直播小幫手帳號連結前端"
Cohesion: 0.25
Nodes (7): Google 帳號連結與清理狀態, OAuth 流程, Twitch 選用功能, 建置與檢查, 直播小幫手帳號連結前端, 部署, 開發

### Community 14 - "devDependencies"
Cohesion: 0.29
Nodes (7): eslint, eslint-plugin-prettier, devDependencies, eslint, eslint-plugin-prettier, @typescript-eslint/parser, @typescript-eslint/parser

### Community 15 - "random.ts"
Cohesion: 0.52
Nodes (6): getRandomFrom(), random(), randomAlphabat(), randomDate(), randomNAString(), randomNumString()

### Community 16 - "setFormLoading"
Cohesion: 0.29
Nodes (7): isFormLoading(), mutationKey(), saveTwitCasting(), saveTwitch(), saveYouTube(), setFormLoading(), twitchMessages()

### Community 18 - "stopGuildDrag"
Cohesion: 0.67
Nodes (3): dragGuildList(), finishGuildDrag(), stopGuildDrag()

## Knowledge Gaps
- **178 isolated node(s):** `name`, `version`, `packageManager`, `node`, `pnpm` (+173 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **26 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `devDependencies` to `scripts`, `autoprefixer`, `eslint-config-prettier`, `eslint-plugin-vue`, `postcss`, `postcss-html`, `postcss-scss`, `prettier`, `sass`, `stylelint`, `stylelint-config-recommended`, `stylelint-config-standard`, `@tailwindcss/postcss`, `tslib`, `@types/node`, `typescript`, `@typescript-eslint/eslint-plugin`, `vite`, `@vitejs/plugin-vue`, `@vue/eslint-config-prettier`, `@vue/eslint-config-typescript`, `vue-tsc`, `wrangler`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Why does `startDiscordOAuth()` connect `DiscordSection.vue` to `SettingsPage.vue`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **What connects `name`, `version`, `packageManager` to the rest of the system?**
  _178 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `SettingsPage.vue` be split into smaller, more focused modules?**
  _Cohesion score 0.03773584905660377 - nodes in this community are weakly interconnected._
- **Should `VerifyWindow.vue` be split into smaller, more focused modules?**
  _Cohesion score 0.07671957671957672 - nodes in this community are weakly interconnected._
- **Should `DiscordSection.vue` be split into smaller, more focused modules?**
  _Cohesion score 0.08831908831908832 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._