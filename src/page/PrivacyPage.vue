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
        Discord：用來識別您的帳號。網站會在瀏覽器工作階段暫存登入資料，供 Google
        與 Twitch 帳號連結使用。
      </p>
      <p class="mb-3">
        Google：系統會儲存會員驗證所需的授權資料，以及顯示連結狀態所需的帳號名稱與頭像。授權只用來讀取
        YouTube 會員資格與驗證紀錄，不會修改您的影片、評價、留言或字幕。
      </p>
      <p>
        Twitch：此功能可自行選用。系統會儲存 Twitch 使用者
        ID、登入名稱、顯示名稱、頭像，以及設定直播爬蟲所需的授權憑證（token）。帳號資料（profile）只用來顯示已連結的帳號；授權憑證只用來驗證頻道主（broadcaster）授權、維持直播爬蟲與
        EventSub，不會用於其他用途，也不會讀取不必要的 Twitch 資料。
      </p>
    </section>

    <section class="mt-8">
      <h2 class="mb-2 text-2xl text-white">三、OAuth 與授權憑證保護</h2>
      <p>
        Google 與 Twitch 的授權碼（authorization
        code）、狀態值（state）及服務供應商憑證（provider
        token），都由後端回呼（callback）處理，不會儲存在前端。Discord
        登入憑證也不會放入服務供應商的網址或
        state。後端會以受保護的方式儲存必要憑證，並限制存取權限。
      </p>
    </section>

    <section class="mt-8">
      <h2 class="mb-2 text-2xl text-white">四、撤銷、失效與爬蟲清理</h2>
      <p class="mb-3">
        您可以隨時在帳號連結頁解除 Google 或 Twitch。解除 Twitch
        連結時，系統會撤銷授權；若授權失效或遭撤銷，系統也會停止使用該授權憑證。
      </p>
      <p>
        Twitch 授權失效後，系統會重新檢查使用爬蟲的 Discord 伺服器人數。未滿 200
        人時，系統可能自動移除爬蟲；如果頻道正在直播，會等到直播結束後再移除，避免漏掉直播更新及關台通知。原有的
        Twitch 通知設定不會刪除，但會暫時停止生效。
      </p>
    </section>

    <section class="mt-8">
      <h2 class="mb-2 text-2xl text-white">五、Google Analytics 與 Cookie</h2>
      <p class="mb-3">
        本站使用 Google Analytics 4（評估
        ID：G-Z4HVCJQJQ6）統計頁面瀏覽、裝置與瀏覽器類型、概略地區及使用情形，用來分析服務流量、改善頁面及排查異常。Google
        Analytics 可能設定
        <code>_ga</code>
        、
        <code>_ga_*</code>
        等 Cookie，並將瀏覽器、裝置、網路及互動資料傳送給 Google。這些資料可能由
        Google 位於其他國家或地區的系統處理，並適用 Google 的隱私權政策。
      </p>
      <p class="mb-3">
        Google Analytics Cookie 的預設有效期最長可達 2 年，實際期限可能因 Google
        設定、瀏覽器政策或您清除 Cookie 而縮短；分析事件資料會依本服務 Google
        Analytics 資源設定的期限保留，期滿後由 Google 自動刪除。
      </p>
      <p>
        您可以透過瀏覽器封鎖或清除 Cookie、使用內容阻擋功能，或安裝
        <a
          href="https://tools.google.com/dlpage/gaoptout"
          class="text-indigo-300 underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Google Analytics Opt-out Browser Add-on
        </a>
        停用分析追蹤。停用分析 Cookie 不會影響 Discord、Google 或 Twitch
        的帳號連結功能。帳號連結頁會使用瀏覽器的
        <code>sessionStorage</code>
        暫存 Discord
        登入資料；關閉該分頁工作階段或清除網站資料後，資料就會移除。
      </p>
    </section>

    <section class="mt-8">
      <h2 class="mb-2 text-2xl text-white">六、資料分享與第三方傳輸</h2>
      <p>
        除非是提供本服務、依法配合或保護系統安全所必須的情況，本站不會出售、出租或交換您的個人資料。前往
        Discord、Google、Twitch
        或其他外部網站時，請另行參閱該網站的隱私權政策。為了完成登入、會員驗證、Twitch
        直播爬蟲及流量分析，必要資料會分別傳送至
        Discord、Google／YouTube、Twitch 與 Google
        Analytics，並由各服務依其隱私權政策處理。
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
