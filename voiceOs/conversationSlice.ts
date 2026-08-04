import { createSlice, nanoid, PayloadAction } from "@reduxjs/toolkit";
import {
  ChatMessage,
  ConversationContext,
  createInitialContext,
  derivePhase,
  UiAction,
} from "./types";

type VoiceOsState = {
  sessionId: string;
  context: ConversationContext;
  messages: ChatMessage[];
  isProcessing: boolean;
  pendingUiAction: UiAction | null;
};

const welcomeMessage = (): ChatMessage => ({
  id: nanoid(),
  role: "assistant",
  content:
    "Namaste! Main aapka Shop Assist hoon. Product bolo — quantity confirm karke cart mein add karunga.",
  createdAt: Date.now(),
});

const initialState: VoiceOsState = {
  sessionId: nanoid(),
  context: createInitialContext(),
  messages: [welcomeMessage()],
  isProcessing: false,
  pendingUiAction: null,
};

const voiceOsSlice = createSlice({
  name: "voiceOs",
  initialState,
  reducers: {
    hydrateSessionFromAuth(
      state,
      action: PayloadAction<{
        customerId: string | null;
        customerName: string | null;
      }>,
    ) {
      state.context.customerId = action.payload.customerId;
      state.context.customerName = action.payload.customerName;
    },
    syncCartContext(
      state,
      action: PayloadAction<{
        cartItemCount: number;
        cartItems: ConversationContext["cartItems"];
      }>,
    ) {
      state.context.cartItemCount = action.payload.cartItemCount;
      state.context.cartItems = action.payload.cartItems;
    },
    setCurrentScreen(state, action: PayloadAction<string | null>) {
      state.context.currentScreen = action.payload;
    },
    setLanguage(
      state,
      action: PayloadAction<ConversationContext["language"]>,
    ) {
      state.context.language = action.payload;
    },
    addMessage(
      state,
      action: PayloadAction<Omit<ChatMessage, "id" | "createdAt"> & { id?: string }>,
    ) {
      state.messages.push({
        id: action.payload.id ?? nanoid(),
        createdAt: Date.now(),
        role: action.payload.role,
        content: action.payload.content,
        toolName: action.payload.toolName,
        toolCallId: action.payload.toolCallId,
        uiAction: action.payload.uiAction,
        products: action.payload.products,
      });
    },
    patchContext(state, action: PayloadAction<Partial<ConversationContext>>) {
      state.context = { ...state.context, ...action.payload };
      state.context.phase = derivePhase(state.context);
    },
    setProcessing(state, action: PayloadAction<boolean>) {
      state.isProcessing = action.payload;
    },
    setPendingUiAction(state, action: PayloadAction<UiAction | null>) {
      state.pendingUiAction = action.payload;
    },
    clearPendingUiAction(state) {
      state.pendingUiAction = null;
    },
    resetConversation(state) {
      state.sessionId = nanoid();
      const { customerId, customerName, cartItemCount, cartItems } = state.context;
      state.context = createInitialContext({
        customerId,
        customerName,
        cartItemCount,
        cartItems,
      });
      state.messages = [welcomeMessage()];
      state.isProcessing = false;
      state.pendingUiAction = null;
    },
  },
});

export const {
  hydrateSessionFromAuth,
  syncCartContext,
  setCurrentScreen,
  setLanguage,
  addMessage,
  patchContext,
  setProcessing,
  setPendingUiAction,
  clearPendingUiAction,
  resetConversation,
} = voiceOsSlice.actions;

export default voiceOsSlice.reducer;
