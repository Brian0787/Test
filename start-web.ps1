function trimTrailingSlash(value) {
  return String(value || "").replace(/\/+$/, "");
}

function withPath(baseUrl, maybePath) {
  const base = trimTrailingSlash(baseUrl);
  const path = String(maybePath || "").trim();
  if (!path) return base;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

function buildHeaders(settings) {
  const headers = {
    "Content-Type": "application/json",
  };
  if (settings?.openclaw?.apiKey) {
    headers.Authorization = `Bearer ${settings.openclaw.apiKey}`;
  }
  return headers;
}

function getTimeoutSignal(timeoutMs = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return {
    signal: controller.signal,
    clear: () => clearTimeout(timer),
  };
}

export function hasOpenClawConfig(settings) {
  return Boolean(settings?.openclaw?.baseUrl && settings?.openclaw?.chatPath);
}

export async function testOpenClawConnection(settings) {
  const configured = hasOpenClawConfig(settings);
  if (!configured) {
    return {
      configured: false,
      reachable: false,
      status: "unconfigured",
      checkedAt: new Date().toISOString(),
      baseUrl: settings?.openclaw?.baseUrl || "",
      chatPath: settings?.openclaw?.chatPath || "",
      memoryPath: settings?.openclaw?.memoryPath || "",
      message: "OpenClaw URL 또는 chat path가 비어 있습니다.",
    };
  }

  const timeout = getTimeoutSignal(settings?.openclaw?.timeoutMs || 10000);
  const testUrl = withPath(settings.openclaw.baseUrl, settings.openclaw.testPath || "");

  try {
    const response = await fetch(testUrl, {
      method: "GET",
      headers: buildHeaders(settings),
      signal: timeout.signal,
    });
    timeout.clear();
    return {
      configured: true,
      reachable: response.ok,
      status: response.ok ? "reachable" : "unreachable",
      checkedAt: new Date().toISOString(),
      baseUrl: settings.openclaw.baseUrl,
      chatPath: settings.openclaw.chatPath,
      memoryPath: settings.openclaw.memoryPath,
      statusCode: response.status,
      message: response.ok ? `연결 확인됨: ${testUrl}` : `응답 실패: ${response.status} (${testUrl})`,
    };
  } catch (error) {
    timeout.clear();
    return {
      configured: true,
      reachable: false,
      status: "unreachable",
      checkedAt: new Date().toISOString(),
      baseUrl: settings.openclaw.baseUrl,
      chatPath: settings.openclaw.chatPath,
      memoryPath: settings.openclaw.memoryPath,
      message: error instanceof Error ? error.message : "Unknown connection error",
    };
  }
}

function parseOpenAIChatResponse(data) {
  const content = data?.choices?.[0]?.message?.content;
  if (Array.isArray(content)) {
    return content.map((item) => item?.text || item?.content || "").join("\n").trim();
  }
  return String(content || "").trim();
}

function parseResponsesApi(data) {
  if (typeof data?.output_text === "string") return data.output_text.trim();
  const outputs = data?.output || [];
  const parts = [];
  for (const item of outputs) {
    if (Array.isArray(item?.content)) {
      for (const content of item.content) {
        if (typeof content?.text === "string") parts.push(content.text);
      }
    }
  }
  return parts.join("\n").trim();
}

export async function callOpenClawChat({ settings, messages, responseFormatJson = false }) {
  if (!hasOpenClawConfig(settings)) {
    throw new Error("OpenClaw is not configured");
  }

  const url = withPath(settings.openclaw.baseUrl, settings.openclaw.chatPath);
  const timeout = getTimeoutSignal(settings?.openclaw?.timeoutMs || 30000);
  const headers = buildHeaders(settings);
  const isResponsesApi = settings.openclaw.chatPath.includes("/responses");

  const body = isResponsesApi
    ? {
        model: settings.openclaw.model,
        input: messages.map((message) => `${message.role.toUpperCase()}: ${message.content}`).join("\n\n"),
        text: responseFormatJson ? { format: { type: "json_object" } } : undefined,
      }
    : {
        model: settings.openclaw.model,
        temperature: 0.3,
        response_format: responseFormatJson ? { type: "json_object" } : undefined,
        messages,
      };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: timeout.signal,
    });

    const text = await response.text();
    timeout.clear();

    if (!response.ok) {
      throw new Error(`OpenClaw chat error ${response.status}: ${text}`);
    }

    const data = text ? JSON.parse(text) : {};
    const output = isResponsesApi ? parseResponsesApi(data) : parseOpenAIChatResponse(data);
    return {
      provider: "openclaw",
      raw: data,
      text: output,
    };
  } catch (error) {
    timeout.clear();
    throw error;
  }
}

export async function syncOntologyMemory(settings, payload) {
  if (!settings?.openclaw?.baseUrl || !settings?.openclaw?.memoryPath) {
    return {
      status: "skipped",
      syncedAt: new Date().toISOString(),
      reason: "memory_path_unconfigured",
    };
  }

  const url = withPath(settings.openclaw.baseUrl, settings.openclaw.memoryPath);
  const timeout = getTimeoutSignal(settings?.openclaw?.timeoutMs || 30000);
  const body = {
    skill: settings?.openclaw?.ontologySkillName || "ontology",
    payload,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: buildHeaders(settings),
      body: JSON.stringify(body),
      signal: timeout.signal,
    });
    const text = await response.text();
    timeout.clear();
    return {
      status: response.ok ? "synced" : "failed",
      syncedAt: new Date().toISOString(),
      url,
      statusCode: response.status,
      body: text,
    };
  } catch (error) {
    timeout.clear();
    return {
      status: "failed",
      syncedAt: new Date().toISOString(),
      url,
      message: error instanceof Error ? error.message : "Unknown memory sync error",
    };
  }
}
