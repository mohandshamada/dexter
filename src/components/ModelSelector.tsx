import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { colors } from '../theme.js';

interface Provider {
  displayName: string;
  providerId: string;
  modelId: string;
  description: string;
}

const PROVIDERS: Provider[] = [
  {
    displayName: 'OpenAI',
    providerId: 'openai',
    modelId: 'gpt-4o',
    description: "GPT-4o - OpenAI's flagship model",
  },
  {
    displayName: 'Anthropic',
    providerId: 'anthropic',
    modelId: 'claude-3-5-sonnet-latest',
    description: "Claude 3.5 Sonnet - Best for complex agents",
  },
  {
    displayName: 'Google',
    providerId: 'google',
    modelId: 'gemini-1.5-pro',
    description: "Gemini 1.5 Pro - Google's most intelligent model",
  },
  {
    displayName: 'Ollama (Local)',
    providerId: 'ollama',
    modelId: 'ollama-llama3.1',
    description: "Llama 3.1 - Run locally via Ollama",
  },
];

export function getModelIdForProvider(providerId: string): string | undefined {
  const provider = PROVIDERS.find((p) => p.providerId === providerId);
  return provider?.modelId;
}

export function getProviderIdForModel(modelId: string): string | undefined {
  const provider = PROVIDERS.find((p) => p.modelId === modelId);
  return provider?.providerId;
}

interface ProviderSelectorProps {
  provider?: string;
  onSelect: (providerId: string | null) => void;
}

export function ProviderSelector({ provider, onSelect }: ProviderSelectorProps) {
  const [selectedIndex, setSelectedIndex] = useState(() => {
    if (provider) {
      const idx = PROVIDERS.findIndex((p) => p.providerId === provider);
      return idx >= 0 ? idx : 0;
    }
    return 0;
  });

  useInput((input, key) => {
    if (key.upArrow || input === 'k') {
      setSelectedIndex((prev) => Math.max(0, prev - 1));
    } else if (key.downArrow || input === 'j') {
      setSelectedIndex((prev) => Math.min(PROVIDERS.length - 1, prev + 1));
    } else if (key.return) {
      onSelect(PROVIDERS[selectedIndex].providerId);
    } else if (key.escape) {
      onSelect(null);
    }
  });

  return (
    <Box flexDirection="column" marginTop={1}>
      <Text color={colors.primary} bold>
        Select provider
      </Text>
      <Text color={colors.muted}>
        Switch between LLM providers. Applies to this session and future sessions.
      </Text>
      <Box marginTop={1} flexDirection="column">
        {PROVIDERS.map((p, idx) => {
          const isSelected = idx === selectedIndex;
          const isCurrent = provider === p.providerId;
          const prefix = isSelected ? '> ' : '  ';

          return (
            <Text
              key={p.providerId}
              color={isSelected ? colors.primaryLight : colors.primary}
              bold={isSelected}
            >
              {prefix}
              {idx + 1}. {p.displayName}
              {isCurrent ? ' ✓' : ''}
            </Text>
          );
        })}
      </Box>
      <Box marginTop={1}>
        <Text color={colors.muted}>Enter to confirm · esc to exit</Text>
      </Box>
    </Box>
  );
}

export { PROVIDERS };
