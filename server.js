function normalizeText(value) {
  return String(value || "").toLowerCase();
}

export function classifyMessageRelevance(text, meetingSettings) {
  const source = normalizeText(text);
  const excludedTopics = (meetingSettings?.excludedTopics || []).map((item) => normalizeText(item));
  const meetingKeywords = (meetingSettings?.meetingKeywords || []).map((item) => normalizeText(item));

  const excludedHits = excludedTopics.filter((keyword) => keyword && source.includes(keyword));
  const meetingHits = meetingKeywords.filter((keyword) => keyword && source.includes(keyword));

  if (excludedHits.length > 0 && meetingHits.length === 0) {
    return {
      relevant: false,
      reason: `excluded_topic:${excludedHits.join(",")}`,
    };
  }

  if (meetingHits.length > 0) {
    return {
      relevant: true,
      reason: `meeting_keyword:${meetingHits.join(",")}`,
    };
  }

  const likelyMeetingQuestion = /(어떻게|왜|언제|누가|무엇|다음|진행|정리|의견|문제|리스크|계획|일정|담당|결정|회의록)/.test(text);
  if (likelyMeetingQuestion) {
    return { relevant: true, reason: "likely_meeting_context" };
  }

  return {
    relevant: true,
    reason: "default_relevant",
  };
}
