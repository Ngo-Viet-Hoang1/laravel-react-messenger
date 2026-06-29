import { type ChatItem } from '@/types';
import axios, { AxiosError } from 'axios';
import { useCallback, useState } from 'react';

type GenerateSuggestionArgs = {
    channel: ChatItem | null;
    currentMessage: string;
};

type UseAiMessageSuggestionReturn = {
    generateSuggestion: (
        args: GenerateSuggestionArgs,
    ) => Promise<string | null>;
    generating: boolean;
};

export const useAiMessageSuggestion = (
    onError: (message: string) => void,
): UseAiMessageSuggestionReturn => {
    const [generating, setGenerating] = useState(false);

    const generateSuggestion = useCallback(
        async ({
            channel,
            currentMessage,
        }: GenerateSuggestionArgs): Promise<string | null> => {
            if (!channel) {
                onError('Please select a channel first');

                return null;
            }

            setGenerating(true);

            try {
                const { data } = await axios.post<{ suggestion: string }>(
                    route('channels.message-suggestions.store', channel.id),
                    {
                        current_message: currentMessage,
                    },
                );

                return data.suggestion;
            } catch (error) {
                if (error instanceof AxiosError && error.response?.status === 503) {
                    onError(
                        'AI is busy right now. Please wait a moment and try again.',
                    );
                } else {
                    onError('Failed to generate AI suggestion. Please try again.');
                }

                return null;
            } finally {
                setGenerating(false);
            }
        },
        [onError],
    );

    return { generateSuggestion, generating };
};
