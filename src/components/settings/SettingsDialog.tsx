'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useSettingsStore,
  AI_PROVIDERS,
  type AIProvider,
} from '@/store/settings-store';

interface SettingsDialogProps {
  trigger?: React.ReactNode;
}

export function SettingsDialog({ trigger }: SettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const {
    anthropicApiKey,
    openaiApiKey,
    googleApiKey,
    selectedProvider,
    selectedModel,
    userName,
    setApiKey,
    setSelectedProvider,
    setSelectedModel,
    setUserName,
    hasValidApiKey,
  } = useSettingsStore();

  const currentProvider = AI_PROVIDERS.find((p) => p.id === selectedProvider);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">Settings</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure your AI provider and API keys to enable the chat assistant.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="api" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="api">API Keys</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="api" className="space-y-4 mt-4">
            {/* Provider Selection */}
            <div className="space-y-2">
              <Label htmlFor="provider">AI Provider</Label>
              <Select
                value={selectedProvider}
                onValueChange={(value) => setSelectedProvider(value as AIProvider)}
              >
                <SelectTrigger id="provider">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {AI_PROVIDERS.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Model Selection */}
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger id="model">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {currentProvider?.models.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* API Keys */}
            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="anthropic-key">
                  Anthropic API Key
                  {selectedProvider === 'anthropic' && (
                    <span className="ml-2 text-xs text-blue-600">(active)</span>
                  )}
                </Label>
                <Input
                  id="anthropic-key"
                  type="password"
                  placeholder="sk-ant-..."
                  value={anthropicApiKey}
                  onChange={(e) => setApiKey('anthropic', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="openai-key">
                  OpenAI API Key
                  {selectedProvider === 'openai' && (
                    <span className="ml-2 text-xs text-blue-600">(active)</span>
                  )}
                </Label>
                <Input
                  id="openai-key"
                  type="password"
                  placeholder="sk-..."
                  value={openaiApiKey}
                  onChange={(e) => setApiKey('openai', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="google-key">
                  Google AI API Key
                  {selectedProvider === 'google' && (
                    <span className="ml-2 text-xs text-blue-600">(active)</span>
                  )}
                </Label>
                <Input
                  id="google-key"
                  type="password"
                  placeholder="AIza..."
                  value={googleApiKey}
                  onChange={(e) => setApiKey('google', e.target.value)}
                />
              </div>
            </div>

            {/* Status */}
            <div className="pt-2">
              {hasValidApiKey() ? (
                <p className="text-sm text-green-600">
                  ✓ API key configured for {currentProvider?.name}
                </p>
              ) : (
                <p className="text-sm text-amber-600">
                  ⚠ Please enter an API key for {currentProvider?.name}
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="profile" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="username">Display Name</Label>
              <Input
                id="username"
                placeholder="Your name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                This name will be shown in the chat interface.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end mt-4">
          <Button onClick={() => setOpen(false)}>Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
