import React from 'react';

export type FilterSelectOption = {
    value: string;
    label: string;
};

type FilterSelectProps = {
    value: string;
    onChange: (value: string) => void;
    options: FilterSelectOption[];
};

export default function FilterSelect({
    value,
    onChange,
    options,
}: FilterSelectProps): React.JSX.Element {
    return (
        <select
            value={value}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>): void =>
                onChange(e.target.value)
            }
            className="select-bordered select h-10 min-h-0 rounded-lg border-slate-200 bg-white text-sm text-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:focus:border-indigo-400"
        >
            {options.map((opt: FilterSelectOption) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
    );
}
