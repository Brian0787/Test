let settings = null;
let voices = [];

const fields = {
  baseUrl: document.getElementById("baseUrl"),
  apiKey: document.getElementById("apiKey"),
  chatPath: document.getElementById("chatPath"),
  testPath: document.getElementById("testPath"),
  memoryPath: document.getElementById("memoryPath"),
  ontologySkillName: document.getElementById("ontologySkillName"),
  model: document.getElementById("model"),
  timeoutMs: document.getElementById("timeoutMs"),
  sttProvider: document.getElementById("sttProvider"),
  sttLanguage: document.getElementById("sttLanguage"),
  ttsProvider: document.getElementById("ttsProvider"),
  voiceName: document.getElementById("voiceName"),
  ttsRate: document.getElementById("ttsRate"),
  ttsPitch: document.getElementById("ttsPitch"),
  autoSpeakAssistants: document.getElementById("autoSpeakAssistants"),
  defaultCameraOn: document.getElementById("defaultCameraOn"),
  minutesAssistantId: document.getElementById("minutesAssistantId"),
  saveNonMeetingMessages: document.getElementById("saveNonMeetingMessages"),
  meetingKeywords: document.getElementById("meetingKeywords"),
  excludedTopics: document.getElementById("excludedTopics"),
  connectionResult: document.getElementById("connectionResult"),
  assistantForms: document.getElementById("assistantForms"),
  saveButton: document.getElementById("saveButton"),
  testConnectionButton: document.getElementById("testConnectionButton"),
  voiceTestButton: document.getElementById("voiceTestButton"),
};

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Request failed: ${response.status}`);
  }
  return data;
}

function boolString(value) {
  return value ? "true" : "false";
}

function parseLines(value) {
  return String(value || "")
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function loadVoices() {
  voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
}

function speak(text) {
  if (!window.speechSynthesis) return;
  const utterance = new SpeechSynthesisUtterance(text);
  const preferredName = fields.voiceName.value.trim();
  const voice = voices.find((item) => item.name === preferredName) || voices.find((item) => item.lang?.startsWith("ko")) || voices[0];
  if (voice) utterance.voice = voice;
  utterance.lang = fields.sttLanguage.value || "ko-KR";
  utterance.rate = Number(fields.ttsRate.value || 1);
  utterance.pitch = Number(fields.ttsPitch.value || 1);
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function renderAssistantForms() {
  fields.assistantForms.innerHTML = settings.assistants
    .map(
      (assistant, index) => `
      <article class="assistant-card" data-assistant-index="${index}">
        <h3>${assistant.name}</h3>
        <label>이름 <input data-field="name" value="${escapeHtmlAttr(assistant.name)}" /></label>
        <label>역할 <input data-field="role" value="${escapeHtmlAttr(assistant.role)}" /></label>
        <label>시스템 프롬프트 <textarea data-field="systemPrompt" rows="4">${escapeHtmlText(assistant.systemPrompt)}</textarea></label>
        <label>Telegram Handle <input data-field="telegramHandle" value="${escapeHtmlAttr(assistant.telegramHandle || "")}" /></label>
        <label>
          Telegram DM
          <select data-field="telegramDmEnabled">
            <option value="true" ${assistant.telegramDmEnabled ? "selected" : ""}>true</option>
            <option value="false" ${!assistant.telegramDmEnabled ? "selected" : ""}>false</option>
          </select>
        </label>
      </article>
    `,
    )
    .join("");
}

function escapeHtmlAttr(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeHtmlText(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function fillForm() {
  fields.baseUrl.value = settings.openclaw.baseUrl || "";
  fields.apiKey.value = settings.openclaw.apiKey || "";
  fields.chatPath.value = settings.openclaw.chatPath || "";
  fields.testPath.value = settings.openclaw.testPath || "";
  fields.memoryPath.value = settings.openclaw.memoryPath || "";
  fields.ontologySkillName.value = settings.openclaw.ontologySkillName || "";
  fields.model.value = settings.openclaw.model || "";
  fields.timeoutMs.value = settings.openclaw.timeoutMs || 30000;
  fields.sttProvider.value = settings.stt.provider || "browser";
  fields.sttLanguage.value = settings.stt.language || "ko-KR";
  fields.ttsProvider.value = settings.tts.provider || "browser";
  fields.voiceName.value = settings.tts.voiceName || "";
  fields.ttsRate.value = settings.tts.rate || 1;
  fields.ttsPitch.value = settings.tts.pitch || 1;
  fields.autoSpeakAssistants.value = boolString(settings.tts.autoSpeakAssistants !== false);
  fields.defaultCameraOn.value = boolString(Boolean(settings.app.defaultCameraOn));
  fields.minutesAssistantId.innerHTML = settings.assistants
    .map((assistant) => `<option value="${assistant.id}" ${assistant.id === settings.meeting.minutesAssistantId ? "selected" : ""}>${assistant.name} · ${assistant.role}</option>`)
    .join("");
  fields.saveNonMeetingMessages.value = boolString(Boolean(settings.meeting.saveNonMeetingMessages));
  fields.meetingKeywords.value = (settings.meeting.meetingKeywords || []).join("\n");
  fields.excludedTopics.value = (settings.meeting.excludedTopics || []).join("\n");
  renderAssistantForms();
}

function collectAssistants() {
  return [...fields.assistantForms.querySelectorAll("[data-assistant-index]")].map((card, index) => ({
    ...settings.assistants[index],
    name: card.querySelector('[data-field="name"]').value.trim(),
    role: card.querySelector('[data-field="role"]').value.trim(),
    systemPrompt: card.querySelector('[data-field="systemPrompt"]').value.trim(),
    telegramHandle: card.querySelector('[data-field="telegramHandle"]').value.trim(),
    telegramDmEnabled: card.querySelector('[data-field="telegramDmEnabled"]').value === "true",
  }));
}

function collectSettings() {
  return {
    app: {
      defaultCameraOn: fields.defaultCameraOn.value === "true",
    },
    openclaw: {
      baseUrl: fields.baseUrl.value.trim(),
      apiKey: fields.apiKey.value.trim(),
      chatPath: fields.chatPath.value.trim(),
      testPath: fields.testPath.value.trim(),
      memoryPath: fields.memoryPath.value.trim(),
      ontologySkillName: fields.ontologySkillName.value.trim(),
      model: fields.model.value.trim(),
      timeoutMs: Number(fields.timeoutMs.value || 30000),
    },
    stt: {
      provider: fields.sttProvider.value,
      language: fields.sttLanguage.value.trim() || "ko-KR",
    },
    tts: {
      provider: fields.ttsProvider.value,
      voiceName: fields.voiceName.value.trim(),
      rate: Number(fields.ttsRate.value || 1),
      pitch: Number(fields.ttsPitch.value || 1),
      autoSpeakAssistants: fields.autoSpeakAssistants.value === "true",
    },
    meeting: {
      minutesAssistantId: fields.minutesAssistantId.value,
      saveNonMeetingMessages: fields.saveNonMeetingMessages.value === "true",
      meetingKeywords: parseLines(fields.meetingKeywords.value),
      excludedTopics: parseLines(fields.excludedTopics.value),
    },
    assistants: collectAssistants(),
  };
}

async function save() {
  settings = collectSettings();
  const result = await api("/api/settings", {
    method: "POST",
    body: JSON.stringify(settings),
  });
  settings = result.settings;
  fillForm();
  fields.connectionResult.textContent = "설정 저장 완료";
}

async function testConnection() {
  const current = collectSettings();
  const result = await api("/api/openclaw/test", {
    method: "POST",
    body: JSON.stringify({ settings: current }),
  });
  fields.connectionResult.textContent = JSON.stringify(result, null, 2);
}

async function init() {
  const result = await api("/api/settings");
  settings = result.settings;
  loadVoices();
  if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
  fillForm();
}

fields.saveButton.addEventListener("click", save);
fields.testConnectionButton.addEventListener("click", testConnection);
fields.voiceTestButton.addEventListener("click", () => speak("설정 페이지 음성 테스트입니다."));

init();
