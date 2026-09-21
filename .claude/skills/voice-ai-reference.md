# Reference: voice-ai

Deep detail for `voice-ai.md`. Read this when actually implementing — not to decide whether the skill applies (the lean file + `skills/INDEX.md` answer that).

## Architecture picks
- **Realtime speech-to-speech APIs** (single websocket, lowest latency) for conversational agents — the modern default.
- **Pipeline** (telephony → STT → LLM → TTS) when you need mid-chain control (custom vocabulary, compliance filtering, cheaper components).
- Telephony layer: Twilio (or Vonage) for numbers, SIP, call control; media streams bridge to the AI layer.

## Latency budget (the UX make-or-break)
Target < 800ms turn-taking; > 1.5s feels broken. Measure per leg (STT, LLM first-token, TTS first-byte). Stream everything; never wait for full completions. Support **barge-in** (caller interrupts playback) — an agent that talks over people gets hung up on.

## Conversation doctrine
- Call flows are state machines (greeting → intent → slots → confirm → action → close) with an explicit **human-handoff state** reachable from anywhere ("let me connect you").
- Slot filling confirms critical values back (dates, phone numbers, names spelled).
- Silence/no-match handling: 2 reprompts max, then handoff — never loop.
- Log per call: transcript, states visited, latency per leg, cost. Cost per minute goes in the daily log per feature.

## Compliance guardrails
Recording consent laws vary (two-party consent regions, EU) — announcement at call start is default-on. The agent identifies itself as AI where law or client policy requires. Calling real customers = Always-Stop until the Founder approves the flow live; develop against test numbers.
