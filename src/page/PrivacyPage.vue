<template>
  <main class="mx-auto max-w-4xl p-1 leading-7 sm:p-5">
    <a href="/" data-spa-link class="flex text-indigo-300">
      <svg
        class="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M10 19l-7-7m0 0l7-7m-7 7h18"
        />
      </svg>
      返回
    </a>

    <h1 class="mt-4 text-4xl sm:text-5xl">隱私權政策</h1>
    <p class="mt-2 text-sm text-zinc-400">最後更新：2026 年 7 月 20 日</p>

    <section class="mt-8">
      <h2 class="mb-2 text-2xl text-white">一、適用範圍</h2>
      <p>
        本政策說明《直播小幫手》帳號連結網站如何處理 Discord、Google 與選用的
        Twitch 授權資料。外部網站及第三方服務另適用其各自的隱私權政策。
      </p>
    </section>

    <section class="mt-8">
      <h2 class="mb-2 text-2xl text-white">二、蒐集資料與用途</h2>
      <p class="mb-3">
        Discord：使用 Discord
        帳號識別您，並在瀏覽器工作階段保存登入所需資料，以協調 Google 與 Twitch
        帳號連結。
      </p>
      <p class="mb-3">
        Google：保存會員驗證所需的授權資料，以及用於顯示連結狀態的帳號名稱與頭像。授權只用於讀取
        YouTube 會員資格與驗證紀錄，不會修改您的影片、評價、留言或字幕。
      </p>
      <p>
        Twitch：此功能完全選用。系統保存 Twitch 使用者
        ID、登入名稱、顯示名稱、頭像，以及設定直播爬蟲所需的授權 token。Twitch
        profile 僅用於顯示連結帳號；token 僅用於驗證 broadcaster
        授權、維持直播爬蟲與相關 EventSub，不會用於其他用途或讀取不必要的 Twitch
        資料。
      </p>
    </section>

    <section class="mt-8">
      <h2 class="mb-2 text-2xl text-white">三、OAuth 與 token 保護</h2>
      <p>
        Google 與 Twitch 的 authorization code、state 及 provider token 由後端
        callback 處理，不會交由前端保存，也不會將 Discord 登入憑證放入 provider
        的網址或 state。後端會以受保護形式保存必要 token，並限制服務存取權限。
      </p>
    </section>

    <section class="mt-8">
      <h2 class="mb-2 text-2xl text-white">四、撤銷、失效與爬蟲清理</h2>
      <p class="mb-3">
        您可以隨時從帳號連結頁解除 Google 或 Twitch。解除 Twitch
        時，系統會撤銷授權；授權自然失效或遭撤銷時，也會停止使用該 token。
      </p>
      <p>
        Twitch 授權失效後，系統會重新檢查設定爬蟲的 Discord 伺服器人數。未滿 200
        人時可能自動移除 Twitch
        爬蟲；若頻道正在直播，會等待該場直播結束後才清理，以避免遺失直播更新及關台通知。爬蟲移除後，既有
        Twitch 通知設定會保留為暫時不生效的設定，不會一併刪除。
      </p>
    </section>

    <section class="mt-8">
      <h2 class="mb-2 text-2xl text-white">五、Google Analytics 與 Cookie</h2>
      <p class="mb-3">
        本站使用 Google Analytics 4（評估
        ID：G-Z4HVCJQJQ6）統計頁面瀏覽、裝置與瀏覽器類型、概略地區及使用情形，以了解服務流量、改善頁面與排查異常。Google
        Analytics 可能設定
        <code>_ga</code>
        、
        <code>_ga_*</code>
        等 Cookie，並將瀏覽器、裝置、網路及互動資料傳送給 Google；資料可能由
        Google 位於其他國家或地區的系統處理。相關處理另受 Google
        隱私權政策約束。
      </p>
      <p class="mb-3">
        Google Analytics Cookie 的預設有效期最長可達 2 年，實際期限可能因 Google
        設定、瀏覽器政策或您清除 Cookie 而縮短；分析事件資料依本服務 Google
        Analytics 資源所設定的保存期限保存，期限屆滿後由 Google 自動刪除。
      </p>
      <p>
        您可透過瀏覽器封鎖或清除 Cookie、使用內容阻擋功能，或安裝
        <a
          href="https://tools.google.com/dlpage/gaoptout"
          class="text-indigo-300 underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Google Analytics Opt-out Browser Add-on
        </a>
        停用分析追蹤。停用分析 Cookie 不影響 Discord、Google 或 Twitch
        帳號連結功能；帳號連結頁使用瀏覽器
        <code>sessionStorage</code>
        暫存 Discord 登入資料，關閉該分頁工作階段或清除網站資料後即會移除。
      </p>
    </section>

    <section class="mt-8">
      <h2 class="mb-2 text-2xl text-white">六、資料分享與第三方傳輸</h2>
      <p>
        除提供本服務、依法配合或保護系統安全所必須外，本站不會出售、出租或交換您的個人資料。本站連結至
        Discord、Google、Twitch
        或其他網站時，請另行參閱該網站的隱私權政策。為完成登入、會員驗證、Twitch
        直播爬蟲及流量分析，必要資料會分別傳送至 Discord、Google /
        YouTube、Twitch 與 Google Analytics；各服務會依其隱私權政策處理資料。
      </p>
    </section>

    <section class="my-8">
      <h2 class="mb-2 text-2xl text-white">七、政策修正</h2>
      <p>
        本政策可能配合服務或法規調整，更新後將公布於本頁並標示最後更新日期。
      </p>
    </section>
  </main>
</template>
