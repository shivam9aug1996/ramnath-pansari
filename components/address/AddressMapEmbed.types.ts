export type AddressMapEmbedProps = {
  uri: string;
  mapKey: number;
  authToken: string | null | undefined;
  /** When true, native uses WebView renderLoading; web shows overlay. */
  isLoading?: boolean;
  onLoadStart: () => void;
  onLoadEnd: () => void;
  onError: () => void;
  onLocationMessage: (raw: string) => void;
};
