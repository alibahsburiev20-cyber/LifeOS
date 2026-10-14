// SPDX-License-Identifier: Apache-2.0

// Model gateway: one adapter for the OpenAI-compatible Chat Completions interface (ADR 0003).
// It works with local runtimes such as Ollama and with hosted providers using the user's own key.

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ProviderConfig {
  baseUrl: string;
  model: string;
  apiKey?: string;
}

export interface GatewayOptions {
  timeoutMs?: number;
  fetchFn?: typeof fetch;
}

export type GatewayErrorCode = "unreachable" | "timeout" | "bad_status" | "bad_response";

/** Messages are generic on purpose: they never contain response bodies, prompts or keys. */
export class GatewayError extends Error {
  constructor(
    readonly code: GatewayErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "GatewayError";
  }
}

const DEFAULT_TIMEOUT_MS = 120_000;
const MAX_RESPONSE_CHARS = 2_000_000;

function isTimeout(err: unknown): boolean {
  const name = typeof err === "object" && err !== null && "name" in err ? String(err.name) : "";
  return name === "TimeoutError" || name === "AbortError";
}

export async function chatCompletion(
  config: ProviderConfig,
  messages: ChatMessage[],
  options: GatewayOptions = {},
): Promise<string> {
  const fetchFn = options.fetchFn ?? fetch;
  const url = `${config.baseUrl.replace(/\/+$/, "")}/chat/completions`;
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (config.apiKey) headers.authorization = `Bearer ${config.apiKey}`;

  let res: Response;
  let text: string;
  try {
    res = await fetchFn(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ model: config.model, messages, stream: false }),
      // Never follow redirects: they could carry the user's key to another host.
      redirect: "error",
      signal: AbortSignal.timeout(options.timeoutMs ?? DEFAULT_TIMEOUT_MS),
    });
    if (!res.ok) {
      await res.body?.cancel().catch(() => undefined);
      throw new GatewayError("bad_status", `The model server answered with status ${res.status}`);
    }
    text = await res.text();
  } catch (err) {
    if (err instanceof GatewayError) throw err;
    if (isTimeout(err)) throw new GatewayError("timeout", "The model request timed out");
    throw new GatewayError("unreachable", "Could not reach the model server");
  }

  if (text.length > MAX_RESPONSE_CHARS) {
    throw new GatewayError("bad_response", "The model response was too large");
  }
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new GatewayError("bad_response", "The model response was not valid JSON");
  }
  const content = (data as { choices?: { message?: { content?: unknown } }[] } | null)?.choices?.[0]
    ?.message?.content;
  if (typeof content !== "string" || content.trim() === "") {
    throw new GatewayError("bad_response", "The model response had no text");
  }
  return content;
}
