import { LengthAwarePaginationMeta, PaginationMetaLink } from '@/types/pagination';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

type Props = {
    meta: LengthAwarePaginationMeta;
    onPageChange: (url: string) => void;
};

export default function TablePagination({ meta, onPageChange }: Props) {
    if (meta.last_page <= 1) return null;

    const prevLink = meta.links[0];
    const nextLink = meta.links[meta.links.length - 1];

    const paginationLinks = meta.links.slice(1, -1);

    const handleClick = (e: React.MouseEvent, url: string | null): void => {
        e.preventDefault();
        if (url) {
            onPageChange(url);
        }
    };

    const navClassName =
        'flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700';
    const disabledClassName =
        'flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 dark:text-slate-600';

    return (
        <div className="shrink-0 border-t border-slate-200 bg-white px-6 py-3 dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Showing{' '}
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                        {meta.from}
                    </span>
                    {' to '}
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                        {meta.to}
                    </span>
                    {' of '}
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                        {meta.total}
                    </span>
                    {' users'}
                </p>

                <div className="flex items-center gap-1">
                    {prevLink?.url ? (
                        <button
                            onClick={(e) => handleClick(e, prevLink.url)}
                            className={navClassName}
                        >
                            <ChevronLeftIcon className="h-4 w-4" />
                        </button>
                    ) : (
                        <span className={disabledClassName}>
                            <ChevronLeftIcon className="h-4 w-4" />
                        </span>
                    )}

                    {paginationLinks.map((link: PaginationMetaLink) => (
                        <button
                            key={link.label}
                            onClick={(e) => handleClick(e, link.url)}
                            disabled={!link.url}
                            className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors ${link.active
                                    ? 'bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-800'
                                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 disabled:opacity-50'
                                }`}
                        >
                            {link.label}
                        </button>
                    ))}

                    {nextLink?.url ? (
                        <button
                            onClick={(e) => handleClick(e, nextLink.url)}
                            className={navClassName}
                        >
                            <ChevronRightIcon className="h-4 w-4" />
                        </button>
                    ) : (
                        <span className={disabledClassName}>
                            <ChevronRightIcon className="h-4 w-4" />
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
