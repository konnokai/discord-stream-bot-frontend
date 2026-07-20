# 直播小幫手帳號連結前端

Vue 3、TypeScript 與 Vite 建置的《直播小幫手》帳號連結 SPA，部署於 Cloudflare Pages 的 `https://stream-bot.konnokai.me/`。根頁面同時提供服務介紹與帳號連結介面；Discord 登入後可選擇連結 Google 以使用 YouTube 會員驗證，或連結 Twitch 以設定自己的直播爬蟲，也可以同時連結兩個平台。

## OAuth 流程

1. Frontend 每次 Discord 登入會產生 256-bit 隨機 state 並存於 `sessionStorage`；callback 必須匹配且只使用一次，再以 JSON body 呼叫 `POST /oauth/discord/callback`。成功後將後端核發的 Discord token 暫存在 `sessionStorage` 的 `DT`。
2. Discord 登入完成後，前端以 `Authorization: Bearer <DT>` 查詢 `GET /account-links`，同時取得 Google 與 Twitch 狀態。
3. 使用者點擊連結時，前端呼叫 `POST /oauth/google/start` 或 `POST /oauth/twitch/start`，再前往後端回傳的 `authorizationUrl`。
4. Google 與 Twitch callback 完全由 Backend 處理。前端只接收 `provider=google|twitch`、`result=success|error` 與固定低敏感 `reason` 碼，不處理 provider code、state 或 token。
5. callback 返回後，前端重新查詢 `/account-links`，顯示固定繁體中文結果，再清除 `provider`、`result`、`reason` query。
6. 解除連結使用 `DELETE /account-links/google` 或 `DELETE /account-links/twitch`，同樣需要 Bearer token。
7. 若 `/account-links` 暫時取得失敗，頁面會保留 Google 與 Twitch 操作入口並提供重試按鈕；重試期間會避免與連結或解除連結請求重疊。

Discord 為必要登入。Google 與 Twitch 都是互不依賴的選用功能，頁面不要求使用者完成任一平台，也不顯示整體流程完成狀態。

## Twitch 選用功能

Twitch 授權僅用於設定使用者自己的 Twitch 直播爬蟲。有效授權可讓未滿 200 人的伺服器新增授權者自己的頻道爬蟲。授權失效或解除後，系統會依伺服器人數決定是否移除爬蟲；直播中會延後至關台後清理。爬蟲被移除時，既有通知設定會保留，但暫時不生效。

## 開發

需求：Node.js `20.19+` 或 `22.12+`，以及 pnpm `11.12+`。

```powershell
pnpm install
pnpm dev
```

開發伺服器預設監聽 `0.0.0.0:3333`。前端 API 位址目前由 `src/main.ts` 依 Vite 開發模式選擇：

- 開發：`https://dev-api.konnokai.me`
- 正式：`https://api.konnokai.me`

Discord redirect URI 為目前網站來源的根路徑 `/`。Google 與 Twitch callback URI 由 Backend 固定產生，Frontend 不組合 provider OAuth URL。

## 建置與檢查

```powershell
pnpm build
pnpm lint:script
pnpm lint:style
```

Vite 只會輸出單一 SPA entry 至 `dist/`。`wrangler.jsonc` 的 `assets.not_found_handling` 設為 `single-page-application`，讓 Cloudflare 將 `/privacy`、`/terms` 與未知路徑交回 `index.html`，再由前端決定顯示內容；不使用 `public/_redirects`，以免 Wrangler 判定 fallback 規則形成無限迴圈。

## 部署

1. 在 Cloudflare Dashboard 的 Workers & Pages 選擇 Pages > Connect to Git，連接 `konnokai/discord-stream-bot-frontend`，Project name 使用 `discord-stream-bot-frontend`，Production branch 使用 `main`。
2. Framework preset 選擇 Vite，Build command 使用 `pnpm build`，Build output directory 使用 `dist`，Root directory 保持空白。
3. Pages 建置環境使用 Node.js `22.12+` 與 pnpm `11.12+`；安裝依 `pnpm-lock.yaml` 執行。
4. 將 Pages custom domain 設為 `stream-bot.konnokai.me`，並等待 Cloudflare 完成 DNS 與憑證啟用。
5. 先在 Discord Developer Portal 登記 `https://stream-bot.konnokai.me/`；Google 與 Twitch callback URI 維持 Backend 網域。
6. 在維護窗口同時將 Backend 的 `FrontendDomain` 改為 `https://stream-bot.konnokai.me`、部署 Bot 的新網站連結，並確認 Pages production deployment 已是本版本。
7. 驗證 `/`、`/privacy`、`/terms` 可直接開啟，Discord callback 與 Google/Twitch 完成返回皆落在 `/`。

舊的 `/stream/` 與 `/login/` 路由已移除，不提供重新導向或相容頁面。

本次不保留舊前端或舊路由相容性，因此網域切換必須採維護窗口一次完成；切換期間尚未重新載入的舊頁面失敗屬預期行為。Backend 與 Bot/Scraper 必須已支援新 Twitch 授權及安全清理流程後才可執行此切換。
