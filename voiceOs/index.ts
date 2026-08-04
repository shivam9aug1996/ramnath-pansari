export type {
  AgentTurnResult,
  ChatMessage,
  ConversationContext,
  ConversationPhase,
  SessionProduct,
  ShopIntent,
  ToolCall,
  ToolResult,
  TurnAnalyticsEvent,
  TurnPlan,
  UiAction,
} from "./types";
export { createInitialContext, DEFAULT_BUSINESS, derivePhase } from "./types";
export { handleUserMessage } from "./conversationManager";
export { executeTool } from "./toolExecutor";
export { TOOL_DEFINITIONS } from "./tools/definitions";
export { performUiHandoff } from "./uiHandoff";
export { useVoiceOs } from "./hooks/useVoiceOs";
export {
  default as voiceOsReducer,
  hydrateSessionFromAuth,
  syncCartContext,
  resetConversation,
  addMessage,
  patchContext,
} from "./conversationSlice";
export { getPhase, isWriteGatedPhase, syncPhaseIntoPatch } from "./agent/phase";
export { emitTurnAnalytics } from "./agent/analytics";
export {
  scoreSearchConfidence,
  scoreProductPickConfidence,
  CONFIDENCE_CLARIFY_THRESHOLD,
} from "./agent/confidence";
