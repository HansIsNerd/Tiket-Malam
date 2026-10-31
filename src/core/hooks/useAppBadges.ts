import { useEffect, useMemo } from 'react';
import { useGameStore } from '@core/stores/gameStore';
import { useUiStore } from '@core/stores/uiStore';

export type AppBadges = Record<string, number>;

export function useAppBadges(): AppBadges {
  const mailData = useGameStore((s) => s.mailData);
  const chatData = useGameStore((s) => s.chatData);
  const acknowledgedMailIds = useUiStore((s) => s.acknowledgedMailIds);
  const unlockedThreadIds = useUiStore((s) => s.unlockedChatThreadIds);
  const seenThreadIds = useUiStore((s) => s.seenChatThreadIds);

  return useMemo(() => {
    const mail = (mailData?.mails ?? []).filter(
      (m) => m.unread && !acknowledgedMailIds.includes(m.id),
    ).length;
    const chat = (chatData?.threads ?? []).filter((t) => {
      if (t.locked === true && !unlockedThreadIds.includes(t.id)) return false;
      if (seenThreadIds.includes(t.id)) return false;
      const last = t.messages[t.messages.length - 1];
      return last !== undefined && last.from !== 'player';
    }).length;
    return { mail, chat };
  }, [mailData, chatData, acknowledgedMailIds, unlockedThreadIds, seenThreadIds]);
}

export function useBadgeAcknowledge(): void {
  const mailData = useGameStore((s) => s.mailData);
  const chatData = useGameStore((s) => s.chatData);
  const acknowledgedMailIds = useUiStore((s) => s.acknowledgedMailIds);
  const unlockedThreadIds = useUiStore((s) => s.unlockedChatThreadIds);
  const seenThreadIds = useUiStore((s) => s.seenChatThreadIds);
  const acknowledgeMails = useUiStore((s) => s.acknowledgeMails);
  const markChatThreadsSeen = useUiStore((s) => s.markChatThreadsSeen);
  const focusedAppId = useUiStore(
    (s) => s.windows.find((w) => w.id === s.focusedWindowId && !w.isMinimized)?.appId ?? null,
  );

  const unreadMailIds = useMemo(
    () =>
      (mailData?.mails ?? [])
        .filter((m) => m.unread && !acknowledgedMailIds.includes(m.id))
        .map((m) => m.id),
    [mailData, acknowledgedMailIds],
  );

  const unreadThreadIds = useMemo(
    () =>
      (chatData?.threads ?? [])
        .filter((t) => {
          if (t.locked === true && !unlockedThreadIds.includes(t.id)) return false;
          if (seenThreadIds.includes(t.id)) return false;
          const last = t.messages[t.messages.length - 1];
          return last !== undefined && last.from !== 'player';
        })
        .map((t) => t.id),
    [chatData, unlockedThreadIds, seenThreadIds],
  );

  useEffect(() => {
    if (focusedAppId === 'mail' && unreadMailIds.length > 0) {
      acknowledgeMails(unreadMailIds);
    }
  }, [focusedAppId, unreadMailIds, acknowledgeMails]);

  useEffect(() => {
    if (focusedAppId === 'chat' && unreadThreadIds.length > 0) {
      markChatThreadsSeen(unreadThreadIds);
    }
  }, [focusedAppId, unreadThreadIds, markChatThreadsSeen]);
}