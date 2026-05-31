import { cx, reactNodeToText } from '@/utils';
import {
    ArrowsRightLeftIcon,
    Bars3Icon,
    CheckIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    ClipboardIcon,
} from '@heroicons/react/24/outline';
import React, { useCallback, useRef, useState } from 'react';

type Props = {
    children?: React.ReactNode;
    className?: string;
    inline?: boolean;
};

const COLLAPSE_THRESHOLD = 10;
const PREVIEW_LINES = 10;
const LINE_NUMBER_THRESHOLD = 4;

export const CodeBlock = ({ children, className, inline }: Props) => {
    const [copied, setCopied] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [wrapMode, setWrapMode] = useState(true);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const rawText = reactNodeToText(children).replace(/\n$/, '');
    const lines = rawText.split('\n');
    const isCollapsible = lines.length > COLLAPSE_THRESHOLD;
    const showLineNumbers = lines.length >= LINE_NUMBER_THRESHOLD;
    const visibleLines =
        isCollapsible && !expanded ? lines.slice(0, PREVIEW_LINES) : lines;

    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(rawText);
        } catch {
            const ta = document.createElement('textarea');
            ta.value = rawText;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.focus();
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
        }
        setCopied(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    }, [rawText]);

    if (inline) {
        return (
            <code className={cx('chat-inline-code', className)}>
                {children}
            </code>
        );
    }

    const hiddenCount = lines.length - PREVIEW_LINES;

    const lineContentCls = wrapMode
        ? 'table-cell whitespace-pre-wrap break-all [overflow-wrap:anywhere]'
        : 'table-cell whitespace-pre break-normal [overflow-wrap:normal]';

    return (
        <div className="relative my-1 overflow-hidden rounded-md bg-gray-200 dark:bg-slate-800">
            {/* ── Toolbar ── */}
            <div className="flex justify-end gap-0.5 px-2 pt-1">
                <button
                    className="cb-tool-btn"
                    onClick={() => setWrapMode((w) => !w)}
                    aria-label={
                        wrapMode
                            ? 'Switch to scroll mode'
                            : 'Switch to wrap mode'
                    }
                    title={wrapMode ? 'Scroll mode' : 'Wrap mode'}
                >
                    <span className="flex items-center leading-[0]">
                        {wrapMode ? (
                            <Bars3Icon className="h-3.5 w-3.5" />
                        ) : (
                            <ArrowsRightLeftIcon className="h-3.5 w-3.5" />
                        )}
                    </span>
                    <span>{wrapMode ? 'Scroll' : 'Wrap'}</span>
                </button>

                <button
                    className="cb-tool-btn"
                    onClick={handleCopy}
                    aria-label={copied ? 'Copied!' : 'Copy code'}
                    title={copied ? 'Copied!' : 'Copy code'}
                >
                    <span className="flex items-center leading-[0]">
                        {copied ? (
                            <CheckIcon className="h-3.5 w-3.5" />
                        ) : (
                            <ClipboardIcon className="h-3.5 w-3.5" />
                        )}
                    </span>
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
            </div>

            {/* ── Code area ── */}
            <pre
                className={cx(
                    'cb-pre',
                    wrapMode
                        ? 'overflow-x-hidden whitespace-pre-wrap break-all'
                        : 'overflow-x-auto whitespace-pre',
                    className,
                )}
            >
                {showLineNumbers ? (
                    <code className="block bg-transparent p-0 font-normal text-inherit">
                        {visibleLines.map((line, i) => (
                            <span key={i} className="table-row">
                                <span
                                    className="pointer-events-none table-cell min-w-10 select-none pr-5 text-right text-xs text-slate-400/60 dark:text-slate-600"
                                    aria-hidden="true"
                                >
                                    {i + 1}
                                </span>
                                <span className={lineContentCls}>
                                    {line}
                                    {i < visibleLines.length - 1 ? '\n' : ''}
                                </span>
                            </span>
                        ))}
                    </code>
                ) : (
                    <code
                        className={cx(
                            'bg-transparent p-0 font-normal text-inherit',
                            className,
                        )}
                    >
                        {children}
                    </code>
                )}
            </pre>

            {/* ── Show more / less ── */}
            {isCollapsible && (
                <button
                    className="cb-expand-btn"
                    onClick={() => setExpanded((e) => !e)}
                    aria-expanded={expanded}
                >
                    <span className="flex items-center leading-[0]">
                        {expanded ? (
                            <ChevronUpIcon className="h-3.5 w-3.5" />
                        ) : (
                            <ChevronDownIcon className="h-3.5 w-3.5" />
                        )}
                    </span>
                    {expanded
                        ? 'Show less'
                        : `Show ${hiddenCount} more line${hiddenCount !== 1 ? 's' : ''}`}
                </button>
            )}
        </div>
    );
};

export default CodeBlock;
