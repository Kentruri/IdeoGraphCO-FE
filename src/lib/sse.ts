/**
 * Lector de Server-Sent Events sobre `fetch`.
 *
 * `EventSource` solo hace GET y la explicación en vivo se pide con POST (lleva
 * el texto en el cuerpo), así que el stream se lee a mano desde
 * `response.body`. Sigue el formato de la especificación: líneas `event:` y
 * `data:`, comentarios que empiezan por `:` (el BE manda `: ping` como
 * keep-alive) y una línea en blanco que cierra cada evento.
 */

export interface ServerSentEvent {
  /** Nombre del evento (`message` si el servidor no lo dice). */
  event: string;
  /** Las líneas `data:` del evento, unidas con saltos de línea. */
  data: string;
}

export async function* readServerSentEvents(
  body: ReadableStream<Uint8Array>
): AsyncGenerator<ServerSentEvent> {
  const reader = body.getReader();
  // `stream: true` no corta un carácter de varios bytes (tildes, «») entre trozos.
  const decoder = new TextDecoder();
  let buffer = "";
  let event = "message";
  let data: string[] = [];

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let newline = buffer.indexOf("\n");
      while (newline !== -1) {
        const line = buffer.slice(0, newline).replace(/\r$/, "");
        buffer = buffer.slice(newline + 1);
        newline = buffer.indexOf("\n");

        if (line === "") {
          if (data.length > 0) yield { event, data: data.join("\n") };
          event = "message";
          data = [];
          continue;
        }
        if (line.startsWith(":")) continue;

        const colon = line.indexOf(":");
        const field = colon === -1 ? line : line.slice(0, colon);
        const fieldValue =
          colon === -1 ? "" : line.slice(colon + 1).replace(/^ /, "");
        if (field === "event") event = fieldValue;
        else if (field === "data") data.push(fieldValue);
      }
    }
  } finally {
    reader.releaseLock();
  }
}
