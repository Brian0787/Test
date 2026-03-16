<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>OpenClaw Meeting Web MVP</title>
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body>
    <div class="layout">
      <header class="topbar">
        <div>
          <p class="eyebrow">Local-first meeting room</p>
          <h1>OpenClaw Meeting Web MVP</h1>
          <p id="sessionMeta" class="muted">세션 준비 중...</p>
        </div>
        <div class="topbar-actions">
          <a class="button ghost" href="/settings.html">설정</a>
          <button class="button" id="newSessionButton">새 회의</button>
          <button class="button success" id="finalizeButton">회의 종료 / 회의록 생성</button>
        </div>
      </header>

      <main class="grid">
        <section class="panel conversation-panel">
          <div class="panel-header">
            <div>
              <h2>회의룸</h2>
              <p class="muted">사용자와 여러 AI 비서가 같은 transcript를 공유합니다.</p>
            </div>
            <div class="inline-actions">
              <button class="button ghost" id="roundtableButton">비서 라운드테이블</button>
              <button class="button ghost" id="refreshButton">새로고침</button>
            </div>
          </div>

          <div id="messages" class="messages"></div>

          <div class="composer">
            <div class="composer-row">
              <label>
                대상 비서
                <select id="targetAssistant"></select>
              </label>
              <label>
                말하기/듣기
                <div class="inline-actions wrap">
                  <button class="button ghost" id="voiceInputButton">음성 입력</button>
                  <button class="button ghost" id="ttsTestButton">TTS 테스트</button>
                </div>
              </label>
            </div>
            <label>
              메시지
              <textarea id="messageInput" rows="4" placeholder="예: 2번 비서야, 지금까지 대화를 기준으로 리스크를 비판적으로 정리해줘"></textarea>
            </label>
            <div class="composer-actions">
              <span id="statusBadge" class="badge">준비됨</span>
              <button class="button primary" id="sendButton">보내기</button>
            </div>
          </div>
        </section>

        <aside class="sidebar">
          <section class="panel">
            <div class="panel-header">
              <div>
                <h2>참여 비서</h2>
                <p class="muted">각 비서는 같은 회의 context를 공유합니다.</p>
              </div>
            </div>
            <div id="assistants" class="stack"></div>
          </section>

          <section class="panel">
            <div class="panel-header">
              <div>
                <h2>카메라</h2>
                <p class="muted">로컬 미리보기만 지원합니다. 기본값은 Off입니다.</p>
              </div>
              <button class="button ghost" id="cameraToggle">카메라 켜기</button>
            </div>
            <video id="cameraPreview" class="camera-preview hidden" autoplay playsinline muted></video>
          </section>

          <section class="panel">
            <div class="panel-header">
              <div>
                <h2>회의록 초안</h2>
                <p class="muted">종료 전에도 실시간으로 갱신됩니다.</p>
              </div>
            </div>
            <div id="minutesPreview" class="minutes-preview"></div>
          </section>
        </aside>
      </main>
    </div>

    <script type="module" src="/app.js"></script>
  </body>
</html>
