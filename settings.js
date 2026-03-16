<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>설정 - OpenClaw Meeting Web MVP</title>
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body>
    <div class="layout narrow">
      <header class="topbar">
        <div>
          <p class="eyebrow">Settings</p>
          <h1>회의 설정</h1>
          <p class="muted">OpenClaw 연결, 음성, 카메라, 회의록 비서, 분류 규칙을 조정합니다.</p>
        </div>
        <div class="topbar-actions">
          <a class="button ghost" href="/">회의룸으로</a>
        </div>
      </header>

      <main class="settings-grid">
        <section class="panel">
          <h2>OpenClaw 연결</h2>
          <div class="form-grid">
            <label>Base URL <input id="baseUrl" /></label>
            <label>API Key <input id="apiKey" type="password" /></label>
            <label>Chat Path <input id="chatPath" /></label>
            <label>Test Path <input id="testPath" /></label>
            <label>Memory Path <input id="memoryPath" /></label>
            <label>Ontology Skill Name <input id="ontologySkillName" /></label>
            <label>Model <input id="model" /></label>
            <label>Timeout(ms) <input id="timeoutMs" type="number" /></label>
          </div>
          <div class="inline-actions">
            <button class="button primary" id="saveButton">저장</button>
            <button class="button ghost" id="testConnectionButton">연결 테스트</button>
          </div>
          <pre id="connectionResult" class="code-block"></pre>
        </section>

        <section class="panel">
          <h2>STT / TTS / 카메라</h2>
          <div class="form-grid">
            <label>
              STT Provider
              <select id="sttProvider">
                <option value="browser">browser</option>
                <option value="external">external</option>
              </select>
            </label>
            <label>STT Language <input id="sttLanguage" /></label>
            <label>
              TTS Provider
              <select id="ttsProvider">
                <option value="browser">browser</option>
                <option value="external">external</option>
              </select>
            </label>
            <label>Voice Name <input id="voiceName" /></label>
            <label>Rate <input id="ttsRate" type="number" step="0.1" /></label>
            <label>Pitch <input id="ttsPitch" type="number" step="0.1" /></label>
            <label>
              <span>Assistant Auto Speak</span>
              <select id="autoSpeakAssistants">
                <option value="true">true</option>
                <option value="false">false</option>
              </select>
            </label>
            <label>
              <span>Camera Default</span>
              <select id="defaultCameraOn">
                <option value="false">off</option>
                <option value="true">on</option>
              </select>
            </label>
          </div>
          <div class="inline-actions">
            <button class="button ghost" id="voiceTestButton">음성 테스트</button>
          </div>
        </section>

        <section class="panel">
          <h2>회의 정책</h2>
          <div class="form-grid">
            <label>
              회의록 작성 비서
              <select id="minutesAssistantId"></select>
            </label>
            <label>
              비회의 메시지 저장
              <select id="saveNonMeetingMessages">
                <option value="false">false</option>
                <option value="true">true</option>
              </select>
            </label>
            <label class="full-width">Meeting Keywords <textarea id="meetingKeywords" rows="3"></textarea></label>
            <label class="full-width">Excluded Topics <textarea id="excludedTopics" rows="3"></textarea></label>
          </div>
        </section>

        <section class="panel">
          <h2>비서 구성</h2>
          <div id="assistantForms" class="stack"></div>
        </section>
      </main>
    </div>

    <script type="module" src="/settings.js"></script>
  </body>
</html>
