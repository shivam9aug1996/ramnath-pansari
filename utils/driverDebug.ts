/** Normalize RTK Query / fetch / plain Error shapes for driver alerts. */
export function formatDriverError(error: unknown): {
  message: string;
  status?: number | string;
  code?: string;
  raw?: unknown;
} {
  if (error == null) {
    return { message: "Unknown error" };
  }

  if (error instanceof Error) {
    return { message: error.message, raw: { name: error.name, stack: error.stack } };
  }

  const rtk = error as {
    status?: number | string;
    data?: { error?: { message?: string; code?: string }; message?: string };
    error?: string;
  };

  const apiMessage =
    rtk.data?.error?.message ??
    rtk.data?.message ??
    (typeof rtk.error === "string" ? rtk.error : undefined);

  if (apiMessage) {
    return {
      message: apiMessage,
      status: rtk.status,
      code: rtk.data?.error?.code,
      raw: rtk,
    };
  }

  if (rtk.status === "FETCH_ERROR") {
    return {
      message: "Network error — check backend URL and that the server is running",
      status: rtk.status,
      raw: rtk,
    };
  }

  if (rtk.status === "PARSING_ERROR") {
    return {
      message: "Invalid response from server",
      status: rtk.status,
      raw: rtk,
    };
  }

  if (typeof rtk.status === "number") {
    return {
      message: `Request failed (${rtk.status})`,
      status: rtk.status,
      raw: rtk,
    };
  }

  try {
    return { message: String(error), raw: error };
  } catch {
    return { message: "Unknown error" };
  }
}

export function getDriverErrorMessage(error: unknown, fallback: string) {
  return formatDriverError(error).message || fallback;
}
