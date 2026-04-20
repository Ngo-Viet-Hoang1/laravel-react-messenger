import { useEffect, useRef } from 'react';

type Props = {
    value: string;
    placeholder?: string;
    disabled?: boolean;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onSend?: () => void;
};

const NewMessageInput = ({
    value,
    placeholder,
    disabled,
    onChange,
    onSend,
}: Props) => {
    const input = useRef<HTMLTextAreaElement>(null);
    const maxHeight = 160;

    const onInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSend?.();
        }
    };

    const onChangeEvent = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setTimeout(() => adjustHeight(), 0);
        onChange(e);
    };

    const adjustHeight = () => {
        if (input.current) {
            input.current.style.height = 'auto';

            const nextHeight = Math.min(input.current.scrollHeight, maxHeight);
            input.current.style.height = `${nextHeight}px`;
            input.current.style.overflowY =
                input.current.scrollHeight > maxHeight ? 'auto' : 'hidden';
        }
    };

    useEffect(() => {
        adjustHeight();
    }, [value]);

    return (
        <textarea
            ref={input}
            value={value}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="textarea textarea-bordered block max-h-40 min-h-[42px] w-full resize-none rounded-[22px] border-slate-300 bg-slate-50 py-2 pl-3 pr-11 leading-5 text-slate-800 transition-colors duration-150 placeholder:text-slate-400 hover:border-slate-400 focus:border-slate-400 focus:outline-none focus-visible:ring-1 focus-visible:ring-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-slate-500 dark:focus:border-slate-500 dark:focus-visible:ring-slate-600"
            onChange={onChangeEvent}
            onKeyDown={onInputKeyDown}
        />
    );
};

export default NewMessageInput;
