import {
    Combobox,
    ComboboxButton,
    ComboboxInput,
    ComboboxOption,
    ComboboxOptions,
} from '@headlessui/react';
import { CheckIcon, ChevronDownIcon } from '@heroicons/react/16/solid';
import { useMemo, useState } from 'react';

type Props<T> = {
    value: T[];
    options: T[];
    onChange: (items: T[]) => void;
    getDisplayValue: (items: T[]) => string;
    getItemLabel: (item: T) => string;
    getItemKey: (item: T) => string | number;
    filterItem: (item: T, query: string) => boolean;
    placeholder?: string;
    noResultsText?: string;
};

export default function MultiSelectCombobox<T>({
    value,
    options,
    onChange,
    getDisplayValue,
    getItemLabel,
    getItemKey,
    filterItem,
    placeholder = 'Select...',
    noResultsText = 'No results found',
}: Props<T>) {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredOptions = useMemo(() => {
        return options.filter((option) => filterItem(option, searchQuery));
    }, [options, filterItem, searchQuery]);

    return (
        <Combobox
            value={value}
            onChange={onChange}
            onClose={() => setSearchQuery('')}
            multiple
        >
            <div className="relative">
                <ComboboxInput
                    className="w-full rounded-md border-slate-300 bg-white py-2 pl-3 pr-10 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:focus:border-indigo-600 dark:focus:ring-indigo-600"
                    displayValue={getDisplayValue}
                    placeholder={placeholder}
                    onChange={(event) => setSearchQuery(event.target.value)}
                />
                <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronDownIcon className="h-5 w-5 text-slate-400" />
                </ComboboxButton>
            </div>

            <ComboboxOptions
                anchor="bottom"
                transition
                className="z-50 mt-1 max-h-60 w-[var(--input-width)] overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 transition duration-100 ease-in focus:outline-none data-[closed]:opacity-0 dark:bg-slate-800 dark:ring-white/10 sm:text-sm"
            >
                {filteredOptions.length > 0 ? (
                    filteredOptions.map((item) => (
                        <ComboboxOption
                            key={getItemKey(item)}
                            value={item}
                            className="group relative cursor-pointer select-none py-2 pl-10 pr-4 text-slate-900 data-[focus]:bg-indigo-100 data-[focus]:text-indigo-900 dark:text-slate-200 dark:data-[focus]:bg-indigo-500/20 dark:data-[focus]:text-indigo-200"
                        >
                            <span className="block truncate font-normal group-data-[selected]:font-medium">
                                {getItemLabel(item)}
                            </span>
                            <span className="absolute inset-y-0 left-0 hidden items-center pl-3 text-indigo-600 group-data-[selected]:flex dark:text-indigo-400">
                                <CheckIcon className="h-5 w-5" />
                            </span>
                        </ComboboxOption>
                    ))
                ) : (
                    <div className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">
                        {noResultsText}
                    </div>
                )}
            </ComboboxOptions>
        </Combobox>
    );
}
