import { callOpenClawChat, hasOpenClawConfig } from "./openclaw.js";

function latestRelevantMessages(session, limit = 14) {
  return (session.messages || []).filter((message) => message.relevant).slice(-limit);
}

function buildTranscript(messages) {
  return messages
    .map((message) => {
      const speaker = message.role === "assistant" ? `${message.assistantName || message.assistantId}` : message.role === "user" ? "사용자" : "시스템";
      return `[${speaker}] ${message.text}`;
    })
    .join("\n");
}

function buildAssistantSystemPrompt(assistant, settings) {
  return [
    `당신 이름은 ${assistant.name}이다.`,
    `당신 역할은 ${assistant.role}이다.`,
    assistant.systemPrompt,
    "당신은 회의룸 안의 AI 비서다.",
    "반드시 회의 전체 공유 transcript를 읽고 대답한다.",
    "다른 비서와 사용자의 이전 대화를 모른 척하면 안 된다.",
    "답변은 한국어로 짧고 선명하게 한다.",
    "회의와 직접 관련된 내용 중심으로 답한다.",
    assistant.id === settings.meeting.minutesAssistantId
      ? "당신은 회의 종료 시 회의록을 작성할 지정 비서이기도 하다."
      : "당신은 회의록 보조 참고 역할도 한다.",
  ].join(" ");
}

function summarizeTranscriptForMock(messages) {
  const relevant = messages.filter((message) => message.relevant).slice(-6);
  return relevant.map((message) => message.text).join(" / ");
}

function buildMockReply({ assistant, session, userInstruction }) {
  const transcriptSummary = summarizeTranscriptForMock(session.messages);
  const recentUser = [...session.messages].reverse().find((message) => message.role === "user");
  const latestAsk = recentUser?.text || userInstruction;

  if (assistant.role.includes("비판")) {
    return [
      `지금 대화 기준으로 빈 구멍부터 짚겠습니다.`,
      `첫째, 요구사항이 넓은데 우선순위 기준이 더 필요합니다.`,
      `둘째, OpenClaw 온톨로지 연동 API 계약이 없으면 저장 단계에서 막힙니다.`,
      `셋째, 현재 질문 "${latestAsk}"에 대한 실행 답은 좋지만 검증 기준이 빠져 있습니다.`,
      transcriptSummary ? `제가 본 최근 컨텍스트: ${transcriptSummary}` : "최근 회의 컨텍스트가 아직 짧습니다.",
      `권장: 오늘 안에 API 계약, 회의록 템플릿, 저장 제외 규칙 3개를 문서로 고정하세요.`,
    ].join(" ");
  }

  return [
    `좋습니다. 현재 대화를 기준으로 바로 실행 가능한 형태로 정리합니다.`,
    `핵심은 공유 transcript 하나를 기준으로 여러 비서가 응답하게 만드는 것입니다.`,
    transcriptSummary ? `최근 컨텍스트: ${transcriptSummary}` : "아직 컨텍스트가 짧아서 기본 모드로 정리합니다.",
    `이번 질문 "${latestAsk}"에 대한 제안은 1) 회의룸 유지 2) 설정에서 비서/연결 관리 3) 종료 시 회의록 생성입니다.`,
    `다음 행동 하나만 고르면 됩니다: 회의룸 메시지 흐름부터 먼저 고정하세요.`,
  ].join(" ");
}

async function generateViaOpenClaw({ session, settings, assistant, userInstruction }) {
  const transcriptMessages = latestRelevantMessages(session, 18);
  const transcript = buildTranscript(transcriptMessages);
  const systemPrompt = buildAssistantSystemPrompt(assistant, settings);

  const messages = [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: [
        "아래는 회의 공유 transcript다. 반드시 이 전체 문맥을 읽고 답변하라.",
        transcript || "(아직 transcript 없음)",
        `현재 사용자 요청: ${userInstruction}`,
        "당신은 본인 역할에 맞게 답해야 하며, 다른 비서/사용자와의 앞선 대화를 인용할 수 있어야 한다.",
      ].join("\n\n"),
    },
  ];

  const response = await callOpenClawChat({ settings, messages });
  return {
    assistantId: assistant.id,
    message: response.text || "응답이 비어 있습니다.",
    provider: response.provider,
    mode: "shared_context",
    contextMessages: transcriptMessages.length,
  };
}

export async function generateAssistantReply({ session, settings, assistantId, userInstruction }) {
  const assistant = settings.assistants.find((item) => item.id === assistantId) || settings.assistants[0];
  if (!assistant) {
    throw new Error("No assistant configured");
  }

  if (hasOpenClawConfig(settings)) {
    try {
      return await generateViaOpenClaw({ session, settings, assistant, userInstruction });
    } catch (error) {
      return {
        assistantId: assistant.id,
        message: `${buildMockReply({ assistant, session, userInstruction })}\n\n[OpenClaw fallback] ${error instanceof Error ? error.message : "unknown error"}`,
        provider: "mock-fallback",
        mode: "shared_context_fallback",
        contextMessages: latestRelevantMessages(session).length,
      };
    }
  }

  return {
    assistantId: assistant.id,
    message: buildMockReply({ assistant, session, userInstruction }),
    provider: "mock",
    mode: "shared_context_mock",
    contextMessages: latestRelevantMessages(session).length,
  };
}

export async function generateRoundtableReplies({ session, settings, prompt }) {
  const replies = [];
  for (const assistant of settings.assistants) {
    const reply = await generateAssistantReply({
      session,
      settings,
      assistantId: assistant.id,
      userInstruction: `${prompt}\n\n지금은 비서 라운드테이블 순서이며, 이전 비서 응답도 읽고 이어서 답하라.`,
    });

    session.messages.push({
      id: crypto.randomUUID(),
      role: "assistant",
      text: reply.message,
      assistantId: reply.assistantId,
      assistantName: assistant.name,
      targetAssistantId: "all",
      relevant: true,
      channel: "chat",
      createdAt: new Date().toISOString(),
      meta: {
        provider: reply.provider,
        mode: "roundtable_internal",
        contextMessages: reply.contextMessages,
      },
    });

    replies.push(reply);
  }

  session.messages = session.messages.filter((message) => message.meta?.mode !== "roundtable_internal");
  return replies;
}
