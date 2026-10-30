import { ChatDataSchema } from '@core/types/chat';
import type { ChatData } from '@core/types/chat';

const CHAT_DATA_URL = '/data/chat.json';

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Gagal memuat ${url}: HTTP ${response.status}`);
  }
  return response.json();
}

export async function loadChatData(): Promise<ChatData> {
  const raw = await fetchJson(CHAT_DATA_URL);
  const result = ChatDataSchema.safeParse(raw);

  if (!result.success) {
    if (import.meta.env.DEV) {
      const details = result.error.issues
        .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
        .join('\n');
      throw new Error(`Validasi ${CHAT_DATA_URL} gagal:\n${details}`);
    }
    throw new Error('Data permainan tidak valid');
  }

  return result.data;
}