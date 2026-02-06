'use client';

import { FloorplanCanvas } from '@/components/canvas/FloorplanCanvas';
import { Toolbar } from '@/components/toolbar/Toolbar';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { SettingsDialog } from '@/components/settings/SettingsDialog';
import { useFloorplanStore } from '@/store/floorplan-store';
import { useUIStore } from '@/store/ui-store';
import { Button } from '@/components/ui/button';

export default function Home() {
  const { present: floorplan } = useFloorplanStore();
  const { openPanels, togglePanel } = useUIStore();

  const showChat = openPanels.includes('chat');

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden">
      {/* Header */}
      <header className="flex h-12 items-center justify-between border-b bg-white px-4">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">Floorplan Editor</h1>
          <span className="text-sm text-gray-500">{floorplan.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            {floorplan.walls.length} walls | {floorplan.furniture.length} items
          </span>
          <Button
            variant={showChat ? 'default' : 'outline'}
            size="sm"
            onClick={() => togglePanel('chat')}
          >
            💬 Chat
          </Button>
          <SettingsDialog
            trigger={
              <Button variant="outline" size="sm">
                ⚙ Settings
              </Button>
            }
          />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Toolbar */}
        <aside className="w-28 flex-shrink-0">
          <Toolbar />
        </aside>

        {/* Canvas Area */}
        <main className="flex-1 h-full">
          <FloorplanCanvas />
        </main>

        {/* Chat Panel */}
        {showChat && (
          <aside className="w-80 flex-shrink-0 border-l bg-white">
            <ChatPanel />
          </aside>
        )}

        {/* Properties Panel */}
        {!showChat && (
          <aside className="w-64 flex-shrink-0 border-l bg-white p-4">
            <h2 className="mb-4 font-medium">Properties</h2>
            <p className="text-sm text-gray-500">
              Select an object to view and edit its properties.
            </p>
          </aside>
        )}
      </div>
    </div>
  );
}
