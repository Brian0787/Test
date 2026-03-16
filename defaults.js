:root {
  color-scheme: dark;
  --bg: #0e1116;
  --panel: #161b22;
  --panel-2: #1f2630;
  --text: #e6edf3;
  --muted: #99a4b2;
  --line: #2d3745;
  --primary: #59a9ff;
  --success: #2fbf71;
  --danger: #f16d6d;
  --warning: #ffb04c;
  --badge: #223147;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background: var(--bg);
  color: var(--text);
}

button,
input,
select,
textarea {
  font: inherit;
}

input,
select,
textarea {
  width: 100%;
  border: 1px solid var(--line);
  background: #0f141a;
  color: var(--text);
  border-radius: 10px;
  padding: 0.8rem 0.9rem;
}

textarea {
  resize: vertical;
}

label {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  color: var(--muted);
  font-size: 0.92rem;
}

.layout {
  max-width: 1500px;
  margin: 0 auto;
  padding: 1.25rem;
}

.layout.narrow {
  max-width: 1100px;
}

.topbar {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.topbar h1,
.panel h2 {
  margin: 0;
}

.topbar-actions,
.inline-actions {
  display: flex;
  gap: 0.65rem;
  align-items: center;
}

.wrap {
  flex-wrap: wrap;
}

.eyebrow {
  margin: 0 0 0.35rem;
  color: var(--primary);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.76rem;
}

.muted {
  margin: 0.35rem 0 0;
  color: var(--muted);
}

.grid {
  display: grid;
  grid-template-columns: 2.1fr 1fr;
  gap: 1rem;
}

.settings-grid {
  display: grid;
  gap: 1rem;
}

.panel {
  background: linear-gradient(180deg, var(--panel), var(--panel-2));
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 1rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.22);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: flex-start;
  margin-bottom: 0.9rem;
}

.conversation-panel {
  min-height: 80vh;
  display: flex;
  flex-direction: column;
}

.messages {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  overflow: auto;
  min-height: 48vh;
  max-height: 58vh;
  padding-right: 0.3rem;
}

.message {
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 0.9rem;
  background: rgba(8, 12, 18, 0.55);
}

.message.user {
  border-color: rgba(89, 169, 255, 0.45);
}

.message.assistant {
  border-color: rgba(47, 191, 113, 0.4);
}

.message.system {
  border-color: rgba(255, 176, 76, 0.35);
}

.message-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.45rem;
  font-size: 0.92rem;
}

.message-meta {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  color: var(--muted);
}

.message-body {
  white-space: pre-wrap;
  line-height: 1.55;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  background: var(--badge);
  color: var(--text);
  font-size: 0.8rem;
  border: 1px solid var(--line);
}

.badge.success {
  color: #9bf5c4;
}

.badge.danger {
  color: #ffb6b6;
}

.badge.warning {
  color: #ffd69b;
}

.composer {
  margin-top: auto;
  padding-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.composer-row,
.composer-actions {
  display: flex;
  gap: 0.9rem;
  align-items: end;
}

.composer-row > * {
  flex: 1;
}

.composer-actions {
  justify-content: space-between;
}

.button {
  border: 1px solid var(--line);
  background: #19212b;
  color: var(--text);
  padding: 0.75rem 1rem;
  border-radius: 12px;
  cursor: pointer;
  text-decoration: none;
}

.button:hover {
  border-color: rgba(89, 169, 255, 0.5);
}

.button.primary {
  background: rgba(89, 169, 255, 0.18);
  border-color: rgba(89, 169, 255, 0.55);
}

.button.success {
  background: rgba(47, 191, 113, 0.16);
  border-color: rgba(47, 191, 113, 0.5);
}

.button.ghost {
  background: transparent;
}

.sidebar,
.stack {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.assistant-card {
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.assistant-card h3 {
  margin: 0;
}

.camera-preview {
  width: 100%;
  border-radius: 14px;
  border: 1px solid var(--line);
  background: #04070a;
  min-height: 200px;
}

.hidden {
  display: none;
}

.minutes-preview,
.code-block {
  white-space: pre-wrap;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  line-height: 1.55;
  margin: 0;
  color: #d8e4ef;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.9rem;
}

.full-width {
  grid-column: 1 / -1;
}

@media (max-width: 980px) {
  .grid {
    grid-template-columns: 1fr;
  }

  .topbar,
  .composer-row,
  .composer-actions,
  .panel-header {
    flex-direction: column;
    align-items: stretch;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}
