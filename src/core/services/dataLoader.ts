import type { ZodType } from 'zod';
import { ChatDataSchema } from '@core/types/chat';
import type { ChatData } from '@core/types/chat';
import { TicketDataSchema } from '@core/types/tickets';
import type { TicketData } from '@core/types/tickets';
import { MailDataSchema } from '@core/types/mail';
import type { MailData } from '@core/types/mail';
import { FileDataSchema } from '@core/types/files';
import type { FileData } from '@core/types/files';
import { DirectoryDataSchema } from '@core/types/directory';
import type { DirectoryData } from '@core/types/directory';

const CHAT_DATA_URL = '/data/chat.json';
const TICKET_DATA_URL = '/data/tickets.json';
const MAIL_DATA_URL = '/data/mail.json';
const FILE_DATA_URL = '/data/files.json';
const DIRECTORY_DATA_URL = '/data/directory.json';

export interface GameData {
  chatData: ChatData;
  ticketData: TicketData;
  mailData: MailData;
  fileData: FileData;
  directoryData: DirectoryData;
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Gagal memuat ${url}: HTTP ${response.status}`);
  }
  return response.json();
}

async function loadValidated<T>(url: string, schema: ZodType<T>): Promise<T> {
  const raw = await fetchJson(url);
  const result = schema.safeParse(raw);

  if (!result.success) {
    if (import.meta.env.DEV) {
      const details = result.error.issues
        .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
        .join('\n');
      throw new Error(`Validasi ${url} gagal:\n${details}`);
    }
    throw new Error('Data permainan tidak valid');
  }

  return result.data;
}

export function loadChatData(): Promise<ChatData> {
  return loadValidated(CHAT_DATA_URL, ChatDataSchema);
}

export function loadTicketData(): Promise<TicketData> {
  return loadValidated(TICKET_DATA_URL, TicketDataSchema);
}

export function loadMailData(): Promise<MailData> {
  return loadValidated(MAIL_DATA_URL, MailDataSchema);
}

export function loadFileData(): Promise<FileData> {
  return loadValidated(FILE_DATA_URL, FileDataSchema);
}

export function loadDirectoryData(): Promise<DirectoryData> {
  return loadValidated(DIRECTORY_DATA_URL, DirectoryDataSchema);
}

export async function loadAllData(): Promise<GameData> {
  const [chatData, ticketData, mailData, fileData, directoryData] = await Promise.all([
    loadChatData(),
    loadTicketData(),
    loadMailData(),
    loadFileData(),
    loadDirectoryData(),
  ]);
  return { chatData, ticketData, mailData, fileData, directoryData };
}