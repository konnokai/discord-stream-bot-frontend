# 直播小幫手前端

這是直播小幫手的 Vue 3 單頁應用程式，提供服務介紹、Discord 登入、Google／Twitch 帳號連結，以及 Discord 伺服器設定介面。

前端必須搭配 [DiscordStreamBotBackend](https://github.com/konnokai/DiscordStreamBotBackend)。只部署靜態網站，無法完成登入或帳號連結。

## 系統需求

- Node.js `20.19` 以上的 20.x，或 `22.12+`
- pnpm `11.12+`
- 可連線的 Backend
- Discord OAuth Application

專案固定使用 `pnpm@11.12.0`，安裝時會依 `pnpm-lock.yaml` 使用相同版本的相依套件。

## 設定

目前 Discord Client ID 與 API 網址寫在 `src/main.ts`。自行部署前請修改：

```ts
app.provide('discordClientId', '你的 Discord Client ID');
app.provide(
  'apiURL',
  import.meta.env.DEV
    ? 'http://localhost:5003'
    : 'https://api.example.com'
);
```

- `discordClientId`：Discord Developer Portal 中的 Application ID。
- 開發 API：本機開發時使用的 Backend 位址。
- 正式 API：部署後的 Backend HTTPS 網域。

這些值會進入前端 bundle。不要在前端放 Client Secret、Bot Token 或其他機密。

## OAuth 設定

Discord redirect URI 是目前網站來源的根路徑 `/`。例如前端部署在 `https://bot.example.com`，Discord Developer Portal 應登記：

```text
https://bot.example.com/
```

Backend 的 `FrontendDomain` 必須填相同來源。Google 與 Twitch callback 由 Backend 處理，不需要登記成前端網址。

Discord 登入 scope 必須包含 `identify guilds`。前端收到 Discord authorization code 後，會交給 Backend 建立短效 session；Google 與 Twitch token 不會交給前端。

## 本機開發

```powershell
pnpm install
pnpm dev
```

開發伺服器預設監聽 `0.0.0.0:3333`。開啟 <http://localhost:3333> 即可。

## 建置與檢查

```powershell
pnpm build
pnpm lint:script
pnpm lint:style
```

建置結果會輸出到 `dist/`。

## 部署到 Cloudflare

`wrangler.jsonc` 已將 `dist/` 設為 Cloudflare Workers Static Assets 目錄，並啟用 SPA fallback。建置前先確認 `src/main.ts` 的正式 API 網址。第一次使用時，先登入 Cloudflare 再部署：

```powershell
pnpm exec wrangler login
pnpm build
pnpm deploy
```

部署後請在 Cloudflare 設定自訂網域，並同步更新：

- Backend 的 `FrontendDomain`。
- Discord Developer Portal 的 redirect URI。
- Google 與 Twitch Developer Console 中指向 Backend 的 callback URI。

如果之後修改 `src/main.ts`，必須重新執行 `pnpm build` 與 `pnpm deploy`。

## 部署到其他靜態網站服務

也可以將 `dist/` 部署到其他靜態網站服務。主機必須支援 SPA fallback，讓 `/privacy`、`/terms`、`/settings` 等路徑回傳 `index.html`，再由前端決定顯示內容。

## 主要頁面

- `/`：服務介紹、Discord 登入與帳號連結。
- `/settings`：管理已安裝 Bot 的 Discord 伺服器設定。
- `/privacy`：隱私權政策。
- `/terms`：服務條款。

登入資訊只存於目前分頁的 `sessionStorage`。關閉分頁後需要重新登入。
