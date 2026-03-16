const state = {
  settings: null,
  session: null,
  recognition: null,
  cameraStream: null,
  voices: [],
};

const elements = {
  sessionMeta: document.getElementById("sessionMeta"),
  messages: document.getElementById("messages"),
  assistants: document.getElementById("assistants"),
  targetAssistant: document.getElementById("targetAssistant"),
  messageInput: document.getElementById("messageInput"),
  sendButton: document.getElementById("sendButton"),
  roundtableButton: document.getElementById("roundtableButton"),
  refreshButton: document.getElementById("refreshButton"),
  newSessionButton: document.getElementById("newSessionButton"),
  finalizeButton: document.getElementById("finalizeButton"),
  statusBadge: document.getElementById("statusBadge"),
  minutesPreview: document.getElementById("minutesPreview"),
  cameraToggle: document.getElementById("cameraToggle"),
  cameraPreview: document.getElementById("cameraPreview"),
  voiceInputButton: document.getElementById("voiceInputButton"),
  ttsTestButton: document.getElementById("ttsTestButton"),
};

function setStatus(text, tone = "default") {
  elements.statusBadge.textContent = text;
  elements.statusBadge.className = `badge${tone === "default" ? "" : ` ${tone}`}`;
}

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

function formatTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleString("ko-KR");
}

function renderAssistants() {
  const assistants = state.settings?.assistants || [];
  elements.targetAssistant.innerHTML = assistants
    .map((assistant) => `<option value="${assistant.id}">${assistant.name} · ${assistant.role}</option>`)
    .join("");

  elements.assistants.innerHTML = assistants
    .map(
      (assistant) => `
      <article class="assistant-card">
        <h3>${assistant.name}</h3>
        <div class="message-meta">
          <span class="badge">${assistant.role}</span>
          ${assistant.id === state.settings.meeting.minutesAssistantId ? '<span class="badge success">회의록 작성</span>' : ""}
        </div>
        <div class="muted">${assistant.systemPrompt}</div>
        <div class="muted">Telegram DM: ${assistant.telegramDmEnabled ? "enabled" : "disabled"} ${assistant.telegramHandle ? `(${assistant.telegramHandle})` : ""}</div>
      </article>
    `,
    )
    .join("");
}

function roleLabel(message) {
  if (message.role === "user") return "사용자";
  if (message.role === "system") return "시스템";
  return message.assistantName || message.assistantId || "비서";
}

function messageBadges(message) {
  const badges = [];
  if (message.role === "assistant" && message.meta?.provider) {
    badges.push(`<span class="badge">${message.meta.provider}</span>`);
  }
  if (message.relevant === false) {
    badges.push('<span class="badge warning">비회의</span>');
  } else {
    badges.push('<span class="badge success">회의 관련</span>');
  }
  if (message.meta?.kind === "minutes") {
    badges.push('<span class="badge">회의록</span>');
  }
  return badges.join("");
}

function renderMessages() {
  const messages = state.session?.messages || [];
  if (messages.length === 0) {
    elements.messages.innerHTML = '<div class="message system"><div class="message-body">아직 메시지가 없습니다. 먼저 1번 비서와 대화를 시작해 보세요.</div></div>';
    return;
  }

  elements.messages.innerHTML = messages
    .map(
      (message) => `
      <article class="message ${message.role}">
        <div class="message-header">
          <strong>${roleLabel(message)}</strong>
          <div class="message-meta">
            ${messageBadges(message)}
            <span>${formatTime(message.createdAt)}</span>
          </div>
        </div>
        <div class="message-body">${escapeHtml(message.text)}</div>
      </article>
    `,
    )
    .join("");

  elements.messages.scrollTop = elements.messages.scrollHeight;
}

function renderMinutes() {
  const draft = state.session?.minutes?.draft;
  const final = state.session?.minutes?.final;
  const minutes = final || draft;

  if (!minutes) {
    elements.minutesPreview.textContent = "아직 생성된 회의록이 없습니다.";
    return;
  }

  elements.minutesPreview.textContent = [
    `요약: ${minutes.summary}`,
    "",
    `안건:\n${(minutes.agendaItems || []).map((item) => `- ${item}`).join("\n") || "- 없음"}`,
    "",
    `결정사항:\n${(minutes.decisions || []).map((item) => `- ${item}`).join("\n") || "- 없음"}`,
    "",
    `액션아이템:\n${(minutes.actionItems || []).map((item) => `- ${item}`).join("\n") || "- 없음"}`,
  ].join("\n");
}

function renderSessionMeta() {
  if (!state.session) return;
  elements.sessionMeta.textContent = `${state.session.title} · ${state.session.status} · ${state.session.id} · ${formatTime(state.session.updatedAt)}`;
}

function rerender() {
  renderAssistants();
  renderMessages();
  renderMinutes();
  renderSessionMeta();
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function chooseVoice() {
  const preferredName = state.settings?.tts?.voiceName;
  if (preferredName) {
    const found = state.voices.find((voice) => voice.name === preferredName);
    if (found) return found;
  }
  return state.voices.find((voice) => voice.lang?.toLowerCase().startsWith("ko")) || state.voices[0] || null;
}

function speak(text) {
  if (!window.speechSynthesis) return;
  if (state.settings?.tts?.provider !== "browser") return;
  if (state.settings?.tts?.autoSpeakAssistants === false) return;

  const utterance = new SpeechSynthesisUtterance(text);
  const voice = chooseVoice();
  if (voice) utterance.voice = voice;
  utterance.rate = Number(state.settings?.tts?.rate || 1);
  utterance.pitch = Number(state.settings?.tts?.pitch || 1);
  utterance.lang = state.settings?.stt?.language || "ko-KR";
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function initVoices() {
  const loadVoices = () => {
    state.voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
  };
  loadVoices();
  if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
}

async function createSession() {
  const { session } = await api("/api/meeting/new", {
    method: "POST",
    body: JSON.stringify({ title: "OpenClaw 회의" }),
  });
  state.session = session;
  rerender();
}

async function loadSettings() {
  const { settings } = await api("/api/settings");
  settings.tts.autoSpeakAssistants = settings.tts.autoSpeakAssistants !== false;
  state.settings = settings;
}

async function refreshSession() {
  if (!state.session?.id) return;
  const { session } = await api(`/api/meeting/session?id=${encodeURIComponent(state.session.id)}`);
  state.session = session;
  rerender();
}

async function sendMessage({ text, channel = "chat" }) {
  const trimmed = text.trim();
  if (!trimmed) return;
  setStatus("응답 생성 중...", "warning");
  elements.sendButton.disabled = true;
  try {
    const { session, reply } = await api("/api/meeting/message", {
      method: "POST",
      body: JSON.stringify({
        sessionId: state.session.id,
        text: trimmed,
        targetAssistantId: elements.targetAssistant.value,
        channel,
      }),
    });
    state.session = session;
    elements.messageInput.value = "";
    rerender();
    if (reply?.text) {
      speak(reply.text);
    }
    setStatus("응답 완료", "success");
  } catch (error) {
    console.error(error);
    setStatus(error.message, "danger");
  } finally {
    elements.sendButton.disabled = false;
  }
}

async function runRoundtable() {
  setStatus("비서 라운드테이블 진행 중...", "warning");
  try {
    const prompt = elements.messageInput.value.trim() || "현재 대화를 기준으로 각 비서 의견을 말해줘";
    const { session, replies } = await api("/api/meeting/roundtable", {
      method: "POST",
      body: JSON.stringify({ sessionId: state.session.id, prompt }),
    });
    state.session = session;
    rerender();
    const finalReply = replies?.[replies.length - 1];
    if (finalReply?.message) speak(finalReply.message);
    setStatus("라운드테이블 완료", "success");
  } catch (error) {
    console.error(error);
    setStatus(error.message, "danger");
  }
}

async function finalizeMinutes() {
  setStatus("회의록 생성 중...", "warning");
  try {
    const { session, markdown, ontologySync } = await api("/api/meeting/minutes/finalize", {
      method: "POST",
      body: JSON.stringify({ sessionId: state.session.id }),
    });
    state.session = session;
    rerender();
    elements.messageInput.value = markdown;
    setStatus(`회의 종료 완료 · ontology: ${ontologySync?.status || "unknown"}`, ontologySync?.status === "synced" ? "success" : "warning");
  } catch (error) {
    console.error(error);
    setStatus(error.message, "danger");
  }
}

async function toggleCamera() {
  if (state.cameraStream) {
    state.cameraStream.getTracks().forEach((track) => track.stop());
    state.cameraStream = null;
    elements.cameraPreview.srcObject = null;
    elements.cameraPreview.classList.add("hidden");
    elements.cameraToggle.textContent = "카메라 켜기";
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    state.cameraStream = stream;
    elements.cameraPreview.srcObject = stream;
    elements.cameraPreview.classList.remove("hidden");
    elements.cameraToggle.textContent = "카메라 끄기";
  } catch (error) {
    console.error(error);
    setStatus("카메라 권한 또는 장치 확인 필요", "danger");
  }
}

function initVoiceRecognition() {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) {
    elements.voiceInputButton.disabled = true;
    elements.voiceInputButton.textContent = "음성 입력 미지원";
    return;
  }

  const recognition = new Recognition();
  recognition.lang = state.settings?.stt?.language || "ko-KR";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => setStatus("음성 듣는 중...", "warning");
  recognition.onerror = (event) => setStatus(`음성 입력 오류: ${event.error}`, "danger");
  recognition.onresult = (event) => {
    const text = event.results?.[0]?.[0]?.transcript || "";
    elements.messageInput.value = text;
    sendMessage({ text, channel: "voice" });
  };
  recognition.onend = () => setStatus("준비됨", "default");

  state.recognition = recognition;
}

async function init() {
  try {
    await loadSettings();
    initVoices();
    await createSession();
    initVoiceRecognition();
    rerender();
    if (state.settings.app.defaultCameraOn) {
      toggleCamera();
    }
  } catch (error) {
    console.error(error);
    setStatus(error.message, "danger");
  }
}

elements.sendButton.addEventListener("click", () => sendMessage({ text: elements.messageInput.value }));
elements.messageInput.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    sendMessage({ text: elements.messageInput.value });
  }
});
elements.roundtableButton.addEventListener("click", runRoundtable);
elements.refreshButton.addEventListener("click", refreshSession);
elements.newSessionButton.addEventListener("click", createSession);
elements.finalizeButton.addEventListener("click", finalizeMinutes);
elements.cameraToggle.addEventListener("click", toggleCamera);
elements.voiceInputButton.addEventListener("click", () => state.recognition?.start());
elements.ttsTestButton.addEventListener("click", () => speak("테스트입니다. 현재 브라우저 TTS가 동작합니다."));

init();
