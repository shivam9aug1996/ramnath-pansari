import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/types/global";
import { useFetchCartQuery } from "@/redux/features/cartSlice";
import store from "@/redux/store";
import { mapCartItemsFromApi } from "../cartMapping";
import { handleUserMessage } from "../conversationManager";
import {
  addMessage,
  clearPendingUiAction,
  hydrateSessionFromAuth,
  patchContext,
  resetConversation,
  setPendingUiAction,
  setProcessing,
  syncCartContext,
} from "../conversationSlice";
import type { ChatMessage, ConversationContext, UiAction } from "../types";
import { performUiHandoff } from "../uiHandoff";

type VoiceOsRoot = RootState & {
  voiceOs: {
    sessionId: string;
    context: ConversationContext;
    messages: ChatMessage[];
    isProcessing: boolean;
    pendingUiAction: UiAction | null;
  };
};

export function useVoiceOs() {
  const dispatch = useDispatch();
  const userData = useSelector((state: RootState) => state.auth?.userData);
  const voiceOs = useSelector(
    (state: RootState) => (state as VoiceOsRoot).voiceOs,
  );
  const userId = userData?._id;

  const { data: cartData } = useFetchCartQuery(
    { userId },
    { skip: !userId },
  );

  useEffect(() => {
    dispatch(
      hydrateSessionFromAuth({
        customerId: userData?._id ?? null,
        customerName: userData?.name ?? null,
      }),
    );
  }, [dispatch, userData?._id, userData?.name]);

  useEffect(() => {
    const items = mapCartItemsFromApi(cartData);
    dispatch(
      syncCartContext({
        cartItemCount: items.length,
        cartItems: items,
      }),
    );
  }, [cartData, dispatch]);

  useEffect(() => {
    const action = voiceOs?.pendingUiAction;
    if (!action) return;
    const timer = setTimeout(() => {
      performUiHandoff(action);
      dispatch(clearPendingUiAction());
    }, 350);
    return () => clearTimeout(timer);
  }, [voiceOs?.pendingUiAction, dispatch]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || voiceOs?.isProcessing) return;

      dispatch(addMessage({ role: "user", content: trimmed }));
      dispatch(setProcessing(true));

      try {
        const session = (store.getState() as VoiceOsRoot).voiceOs.context;
        const result = await handleUserMessage(trimmed, session, {
          dispatch: store.dispatch,
          getState: store.getState,
        });

        if (Object.keys(result.contextPatch).length > 0) {
          dispatch(patchContext(result.contextPatch));
        }

        dispatch(
          addMessage({
            role: "assistant",
            content: result.assistantMessage,
            products: result.products,
            uiAction: result.uiAction,
          }),
        );

        if (result.uiAction) {
          // OPEN_SEARCH_RESULTS stays on the message as a "More results" button;
          // don't auto-navigate away from the chat chip list.
          if (result.uiAction.action !== "OPEN_SEARCH_RESULTS") {
            dispatch(setPendingUiAction(result.uiAction));
          }
        }
      } catch (err) {
        dispatch(
          addMessage({
            role: "assistant",
            content:
              err instanceof Error
                ? `Error: ${err.message}`
                : "Something went wrong. Try again.",
          }),
        );
      } finally {
        dispatch(setProcessing(false));
      }
    },
    [dispatch, voiceOs?.isProcessing],
  );

  const reset = useCallback(() => {
    dispatch(resetConversation());
  }, [dispatch]);

  return {
    sessionId: voiceOs?.sessionId,
    context: voiceOs?.context,
    messages: voiceOs?.messages ?? [],
    isProcessing: Boolean(voiceOs?.isProcessing),
    sendMessage,
    reset,
  };
}
