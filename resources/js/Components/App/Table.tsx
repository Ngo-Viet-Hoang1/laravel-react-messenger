import React, { useRef, useEffect } from 'react';

export type TableColumn<T> = {
    title: React.ReactNode;
    key: string | number;
    dataIndex?: keyof T | string;
    align?: 'left' | 'center' | 'right';
    className?: string;
    render?: (record: T, index: number) => React.ReactNode;
};

export type TableProps<T> = {
    columns: TableColumn<T>[];
    dataSource: T[];
    rowKey: keyof T | ((record: T) => string | number);
    selection?: {
        selectedRowKeys: (string | number)[];
        onChange: (selectedRowKeys: any[]) => void;
    };
    isLoading?: boolean;
    className?: string;
};

export default function Table<T>({
    columns,
    dataSource,
    rowKey,
    selection,
    isLoading = false,
    className = '',
}: TableProps<T>) {
    const selectAllRef = useRef<HTMLInputElement>(null);

    const getRowKey = (record: T, index: number): string | number => {
        if (typeof rowKey === 'function') {
            return rowKey(record);
        }
        return record[rowKey] as unknown as string | number;
    };

    const isSelected = (record: T, index: number): boolean => {
        if (!selection) return false;
        const key = getRowKey(record, index);
        return selection.selectedRowKeys.includes(key);
    };

    const allRowKeys = dataSource.map((record, index) => getRowKey(record, index));
    const selectedCount = dataSource.filter((record, index) => isSelected(record, index)).length;
    const isAllSelected = dataSource.length > 0 && selectedCount === dataSource.length;
    const isIndeterminate = selectedCount > 0 && selectedCount < dataSource.length;

    useEffect(() => {
        if (selectAllRef.current) {
            selectAllRef.current.indeterminate = isIndeterminate;
        }
    }, [isIndeterminate]);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>): void => {
        if (!selection) return;
        if (e.target.checked) {
            const newSelected = Array.from(new Set([...selection.selectedRowKeys, ...allRowKeys]));
            selection.onChange(newSelected);
        } else {
            const newSelected = selection.selectedRowKeys.filter(
                (key) => !allRowKeys.includes(key)
            );
            selection.onChange(newSelected);
        }
    };

    const handleSelectRow = (record: T, index: number): void => {
        if (!selection) return;
        const key = getRowKey(record, index);
        const selected = isSelected(record, index);
        let newSelected: any[];
        if (selected) {
            newSelected = selection.selectedRowKeys.filter((k) => k !== key);
        } else {
            newSelected = [...selection.selectedRowKeys, key];
        }
        selection.onChange(newSelected);
    };

    const getAlignmentClass = (align?: 'left' | 'center' | 'right'): string => {
        if (align === 'center') return 'text-center';
        if (align === 'right') return 'text-right';
        return 'text-left';
    };

    return (
        <div className={`w-full overflow-x-auto ${className}`}>
            <table className="table w-full border-collapse">
                <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-700/50">
                        {selection && (
                            <th className="w-12 px-4 py-3 bg-slate-50/50 dark:bg-slate-800/30">
                                <label className="flex items-center">
                                    <input
                                        ref={selectAllRef}
                                        type="checkbox"
                                        className="checkbox checkbox-sm rounded border-slate-400 dark:border-slate-500 [--chkbg:black] [--chkfg:white] dark:[--chkbg:white] dark:[--chkfg:black] checked:border-black dark:checked:border-white"
                                        checked={isAllSelected}
                                        onChange={handleSelectAll}
                                        disabled={isLoading || dataSource.length === 0}
                                    />
                                </label>
                            </th>
                        )}
                        {columns.map((column) => (
                            <th
                                key={column.key}
                                className={`px-4 py-3 bg-slate-50/50 dark:bg-slate-800/30 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 ${getAlignmentClass(
                                    column.align
                                )} ${column.className || ''}`}
                            >
                                {column.title}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {isLoading ? (
                        Array.from({ length: Math.max(dataSource.length, 3) }).map((_, rowIndex) => (
                            <tr
                                key={`skeleton-${rowIndex}`}
                                className="border-b border-slate-100 dark:border-slate-700/50"
                            >
                                {selection && (
                                    <td className="px-4 py-3">
                                        <div className="h-4 w-4 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                                    </td>
                                )}
                                {columns.map((column) => (
                                    <td key={column.key} className="px-4 py-4">
                                        <div className="h-4 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                                    </td>
                                ))}
                            </tr>
                        ))
                    ) : dataSource.length === 0 ? (
                        <tr>
                            <td
                                colSpan={columns.length + (selection ? 1 : 0)}
                                className="py-12 text-center text-slate-400 dark:text-slate-500"
                            >
                                No data available
                            </td>
                        </tr>
                    ) : (
                        dataSource.map((record, index) => {
                            const selected = isSelected(record, index);
                            return (
                                <tr
                                    key={String(getRowKey(record, index))}
                                    className={`border-b border-slate-100 transition-colors hover:bg-slate-50/70 dark:border-slate-700/50 dark:hover:bg-slate-800/40 ${
                                        selected
                                            ? 'bg-indigo-50/30 dark:bg-indigo-950/20'
                                            : ''
                                    }`}
                                >
                                    {selection && (
                                        <td className="px-4 py-3">
                                            <label className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    className="checkbox checkbox-sm rounded border-slate-400 dark:border-slate-500 [--chkbg:black] [--chkfg:white] dark:[--chkbg:white] dark:[--chkfg:black] checked:border-black dark:checked:border-white"
                                                    checked={selected}
                                                    onChange={() => handleSelectRow(record, index)}
                                                />
                                            </label>
                                        </td>
                                    )}
                                    {columns.map((column) => {
                                        const alignClass = getAlignmentClass(column.align);
                                        let cellContent: React.ReactNode = null;

                                        if (column.render) {
                                            cellContent = column.render(record, index);
                                        } else if (column.dataIndex) {
                                            cellContent = record[
                                                column.dataIndex as keyof T
                                            ] as unknown as React.ReactNode;
                                        }

                                        return (
                                            <td
                                                key={column.key}
                                                className={`px-4 py-3.5 text-sm text-slate-700 dark:text-slate-300 align-middle ${alignClass} ${
                                                    column.className || ''
                                                }`}
                                            >
                                                {cellContent}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
}
