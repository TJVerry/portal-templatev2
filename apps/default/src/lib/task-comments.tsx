import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';

import type { UseLiveNodesResult } from '@/hooks/use-live-nodes';
import { toMessages } from '@/lib/chat';
import type { ChatMessage } from '@/lib/chat';

/**
 * Task comments. A comment is a chat message in "Portal — Messages" with `taskId` (and `taskTitle`) in its Data.
 * So no new list column is needed, the comment also shows in Chat with a "Task:" tag,
 * and the chat relay sends it to the GHL inbox like any other message.
 */

interface TaskCommentsValue {
  messages: UseLiveNodesResult;
  email: string;
  name: string;
  /** Comments by task row id, oldest first. */
  byTask: Map<string, ChatMessage[]>;
}

const TaskCommentsContext = createContext<TaskCommentsValue | null>(null);

export function TaskCommentsProvider({
  messages,
  email,
  name,
  children,
}: {
  messages: UseLiveNodesResult;
  email: string;
  name: string;
  children: ReactNode;
}) {
  const byTask = useMemo(() => {
    const map = new Map<string, ChatMessage[]>();
    for (const m of toMessages(messages.nodes)) {
      const id = m.data.taskId;
      if (id == null || id === '') continue;
      map.set(id, [...(map.get(id) ?? []), m]);
    }
    return map;
  }, [messages.nodes]);
  const value = useMemo(() => ({ messages, email, name, byTask }), [messages, email, name, byTask]);
  return <TaskCommentsContext.Provider value={value}>{children}</TaskCommentsContext.Provider>;
}

/** Null outside the portal (no provider): task cards then show no comments. */
export function useTaskComments(): TaskCommentsValue | null {
  return useContext(TaskCommentsContext);
}
