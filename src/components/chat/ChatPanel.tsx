'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSettingsStore, AI_PROVIDERS } from '@/store/settings-store';
import { useFloorplanStore } from '@/store/floorplan-store';
import { SettingsDialog } from '@/components/settings/SettingsDialog';
import { FURNITURE_DIMENSIONS } from '@/types/floorplan';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: ToolCallResult[];
}

interface ToolCallResult {
  tool: string;
  args: Record<string, unknown>;
  executed: boolean;
}

export function ChatPanel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    selectedProvider,
    selectedModel,
    getActiveApiKey,
    hasValidApiKey,
    userName,
  } = useSettingsStore();

  const {
    present: floorplan,
    addWall,
    removeWall,
    addDoor,
    addWindow,
    addFurniture,
    updateFurniture,
    removeFurniture,
    addRoom,
    resetFloorplan,
  } = useFloorplanStore();

  const apiKey = getActiveApiKey();
  const providerName = AI_PROVIDERS.find((p) => p.id === selectedProvider)?.name;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Execute a tool call
  const executeToolCall = useCallback(
    (tool: string, args: Record<string, unknown>): boolean => {
      try {
        switch (tool) {
          case 'addWall': {
            const { startX, startY, endX, endY, thickness } = args as {
              startX: number;
              startY: number;
              endX: number;
              endY: number;
              thickness?: number;
            };
            addWall({ x: startX, y: startY }, { x: endX, y: endY }, thickness);
            return true;
          }

          case 'removeWall': {
            const { wallId } = args as { wallId: string };
            removeWall(wallId);
            return true;
          }

          case 'addDoor': {
            const { wallId, position, width, swingDirection } = args as {
              wallId: string;
              position: number;
              width?: number;
              swingDirection?: 'left' | 'right';
            };
            const doorId = addDoor(wallId, position, width);
            if (swingDirection) {
              // Could update door swing direction here if needed
            }
            return !!doorId;
          }

          case 'addWindow': {
            const { wallId, position, width, height } = args as {
              wallId: string;
              position: number;
              width?: number;
              height?: number;
            };
            const windowId = addWindow(wallId, position, width, height);
            return !!windowId;
          }

          case 'addFurniture': {
            const { type, x, y, rotation } = args as {
              type: string;
              x: number;
              y: number;
              rotation?: number;
            };
            const dimensions = FURNITURE_DIMENSIONS[type];
            if (!dimensions) {
              console.error('Unknown furniture type:', type);
              return false;
            }
            const furnitureId = addFurniture(type, { x, y }, dimensions.width, dimensions.height);
            if (rotation && furnitureId) {
              updateFurniture(furnitureId, { rotation });
            }
            return !!furnitureId;
          }

          case 'moveFurniture': {
            const { furnitureId, x, y } = args as {
              furnitureId: string;
              x: number;
              y: number;
            };
            updateFurniture(furnitureId, { position: { x, y } });
            return true;
          }

          case 'rotateFurniture': {
            const { furnitureId, rotation } = args as {
              furnitureId: string;
              rotation: number;
            };
            updateFurniture(furnitureId, { rotation });
            return true;
          }

          case 'removeFurniture': {
            const { furnitureId } = args as { furnitureId: string };
            removeFurniture(furnitureId);
            return true;
          }

          case 'addRoom': {
            const { name, type, wallIds } = args as {
              name: string;
              type: string;
              wallIds: string[];
            };
            addRoom(name, type as any, wallIds);
            return true;
          }

          case 'clearAll': {
            const { confirm } = args as { confirm: boolean };
            if (confirm) {
              resetFloorplan();
              return true;
            }
            return false;
          }

          default:
            console.warn('Unknown tool:', tool);
            return false;
        }
      } catch (err) {
        console.error('Error executing tool:', tool, err);
        return false;
      }
    },
    [
      addWall,
      removeWall,
      addDoor,
      addWindow,
      addFurniture,
      updateFurniture,
      removeFurniture,
      addRoom,
      resetFloorplan,
    ]
  );

  // Parse streaming response for tool calls
  // AI SDK format: 9:{"toolCallId":"...","toolName":"addWall","args":{...}}
  const parseToolCalls = (text: string): ToolCallResult[] => {
    const toolCalls: ToolCallResult[] = [];

    // Match AI SDK tool call format (prefixed with letter/number and colon)
    const toolCallRegex = /[a-z0-9]:(\{"toolCallId"[^}]+\})/gi;
    let match;

    while ((match = toolCallRegex.exec(text)) !== null) {
      try {
        const parsed = JSON.parse(match[1]);
        if (parsed.toolName && parsed.args) {
          toolCalls.push({
            tool: parsed.toolName,
            args: parsed.args,
            executed: false,
          });
        }
      } catch {
        // Ignore parsing errors
      }
    }

    // Also try to match tool calls in a simpler JSON format
    const simpleRegex = /"toolName"\s*:\s*"(\w+)"\s*,\s*"args"\s*:\s*(\{[^}]+\})/g;
    while ((match = simpleRegex.exec(text)) !== null) {
      try {
        const tool = match[1];
        const args = JSON.parse(match[2]);
        // Check if we already have this tool call
        const exists = toolCalls.some(
          (tc) => tc.tool === tool && JSON.stringify(tc.args) === JSON.stringify(args)
        );
        if (!exists) {
          toolCalls.push({ tool, args, executed: false });
        }
      } catch {
        // Ignore parsing errors
      }
    }

    return toolCalls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          provider: selectedProvider,
          model: selectedModel,
          apiKey,
          floorplan: {
            walls: floorplan.walls,
            doors: floorplan.doors,
            windows: floorplan.windows,
            furniture: floorplan.furniture,
            rooms: floorplan.rooms,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        toolCalls: [],
      };
      setMessages((prev) => [...prev, assistantMessage]);

      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullContent += chunk;

        // Parse and execute tool calls as they come in
        const toolCalls = parseToolCalls(fullContent);
        const newToolCalls = toolCalls.filter(
          (tc) =>
            !assistantMessage.toolCalls?.some(
              (existing) =>
                existing.tool === tc.tool &&
                JSON.stringify(existing.args) === JSON.stringify(tc.args)
            )
        );

        // Execute new tool calls
        for (const tc of newToolCalls) {
          tc.executed = executeToolCall(tc.tool, tc.args);
        }

        // Clean the content by removing tool result JSON
        const cleanContent = fullContent
          .replace(/{"success":true,"action":"\w+","args":{[^}]+}}/g, '')
          .replace(/\n{3,}/g, '\n\n')
          .trim();

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessage.id
              ? {
                  ...m,
                  content: cleanContent,
                  toolCalls: [...(assistantMessage.toolCalls || []), ...newToolCalls],
                }
              : m
          )
        );

        // Update the reference for next iteration
        assistantMessage.toolCalls = [
          ...(assistantMessage.toolCalls || []),
          ...newToolCalls,
        ];
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasValidApiKey()) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-4 text-center">
        <div className="mb-4 text-4xl">🔑</div>
        <h3 className="mb-2 font-medium">API Key Required</h3>
        <p className="mb-4 text-sm text-gray-500">
          Configure your AI provider API key to use the chat assistant.
        </p>
        <SettingsDialog trigger={<Button>Configure API Key</Button>} />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div>
          <h3 className="font-medium">AI Assistant</h3>
          <p className="text-xs text-gray-500">
            {providerName} · {selectedModel}
          </p>
        </div>
        <SettingsDialog
          trigger={
            <Button variant="ghost" size="sm">
              ⚙
            </Button>
          }
        />
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-gray-500">
            <div className="mb-2 text-3xl">💬</div>
            <p className="text-sm">Ask me anything about your floorplan!</p>
            <p className="mt-2 text-xs">
              Try: &quot;Add a 12x10 foot bedroom&quot; or &quot;Place a queen bed&quot;
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id}>
                <div
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    {message.role === 'user' && userName && (
                      <p className="mb-1 text-xs opacity-75">{userName}</p>
                    )}
                    <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                  </div>
                </div>
                {/* Show tool calls */}
                {message.toolCalls && message.toolCalls.length > 0 && (
                  <div className="mt-2 ml-2 space-y-1">
                    {message.toolCalls.map((tc, i) => (
                      <div
                        key={i}
                        className={`text-xs px-2 py-1 rounded ${
                          tc.executed
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {tc.executed ? '✓' : '○'} {tc.tool}(
                        {Object.entries(tc.args)
                          .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
                          .join(', ')}
                        )
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex justify-start">
                <div className="rounded-lg bg-gray-100 px-3 py-2">
                  <div className="flex space-x-1">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
                    <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0.1s]"></div>
                    <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0.2s]"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Error */}
      {error && (
        <div className="border-t bg-red-50 px-4 py-2 text-sm text-red-600">
          Error: {error}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t p-4">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about your floorplan..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !inputValue.trim()}>
            Send
          </Button>
        </div>
      </form>
    </div>
  );
}
