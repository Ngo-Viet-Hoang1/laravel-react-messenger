import { Combobox, Transition } from '@headlessui/react';
import {
    CheckIcon,
    ChevronUpDownIcon,
    XMarkIcon,
} from '@heroicons/react/20/solid';
import { Fragment, useState } from 'react';

export default function UserPicker({ value, options, onChange }) {
    const [query, setQuery] = useState('');

    const filteredPeople =
        query === ''
            ? options
            : options.filter((person) =>
                  person.name
                      .toLowerCase()
                      .replace(/\s+/g, '')
                      .includes(query.toLowerCase().replace(/\s+/g, '')),
              );

    const onSelected = (persons) => {
        setSelected(persons);
        onChange(persons);
    };

    return (
        <>
            <Combobox value={value} onChange={onChange} multiple>
                <div className="relative mt-1">
                    <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 dark:bg-gray-700 sm:text-sm">
                        <Combobox.Input
                            className="w-full border-none bg-transparent py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0 dark:text-gray-100"
                            displayValue={(person) => person.name}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Select users..."
                        />
                        <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronUpDownIcon
                                className="h-5 w-5 text-gray-400"
                                aria-hidden="true"
                            />
                        </Combobox.Button>
                    </div>
                    <Transition
                        as={Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                        afterLeave={() => setQuery('')}
                    >
                        <Combobox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none dark:bg-gray-700 sm:text-sm">
                            {filteredPeople.length === 0 && query !== '' ? (
                                <div className="relative cursor-default select-none px-4 py-2 text-gray-700 dark:text-gray-300">
                                    Nothing found.
                                </div>
                            ) : (
                                filteredPeople.map((person) => (
                                    <Combobox.Option
                                        key={person.id}
                                        className={({ active }) =>
                                            `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                                active
                                                    ? 'bg-teal-600 text-white'
                                                    : 'text-gray-900 dark:text-gray-100'
                                            }`
                                        }
                                        value={person}
                                    >
                                        {({ selected, active }) => (
                                            <>
                                                <span
                                                    className={`block truncate ${
                                                        selected
                                                            ? 'font-medium'
                                                            : 'font-normal'
                                                    }`}
                                                >
                                                    {person.name}
                                                </span>
                                                {selected ? (
                                                    <span
                                                        className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                                            active
                                                                ? 'text-white'
                                                                : 'text-teal-600'
                                                        }`}
                                                    >
                                                        <CheckIcon
                                                            className="h-5 w-5"
                                                            aria-hidden="true"
                                                        />
                                                    </span>
                                                ) : null}
                                            </>
                                        )}
                                    </Combobox.Option>
                                ))
                            )}
                        </Combobox.Options>
                    </Transition>
                </div>
            </Combobox>
            {value.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                    {value.map((person) => (
                        <div
                            key={person.id}
                            className="flex items-center gap-1 rounded bg-teal-500 px-2 py-1 text-xs font-semibold text-white"
                        >
                            {person.name}
                            <XMarkIcon
                                className="h-4 w-4 cursor-pointer opacity-70 hover:opacity-100"
                                onClick={() =>
                                    onChange(
                                        value.filter((p) => p.id !== person.id),
                                    )
                                }
                            />
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}
