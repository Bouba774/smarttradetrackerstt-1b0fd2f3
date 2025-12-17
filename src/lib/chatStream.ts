import { TraderUserData } from '@/hooks/useTraderUserData';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface StreamChatOptions {
  messages: Message[];
  userData: TraderUserData;
  language: string;
  onStart: () => void;
  onDelta: (content: string) => void;
  onError: (error: Error) => void;
  onDone: () => void;
}

export const streamChat = async ({
  messages,
  userData,
  language,
  onStart,
  onDelta,
  onError,
  onDone,
}: StreamChatOptions): Promise<void> => {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        messages,
        userData,
        language,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erreur de connexion');
    }

    if (!response.body) throw new Error('No response body');

    onStart();

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let assistantContent = '';
    let textBuffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (line.startsWith(':') || line.trim() === '') continue;
        if (!line.startsWith('data: ')) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') break;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            assistantContent += content;
            onDelta(assistantContent);
          }
        } catch {
          textBuffer = line + '\n' + textBuffer;
          break;
        }
      }
    }

    onDone();
  } catch (error) {
    onError(error instanceof Error ? error : new Error('Une erreur est survenue'));
  }
};
