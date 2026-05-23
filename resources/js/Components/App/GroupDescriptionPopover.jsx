import { Popover, Transition } from '@headlessui/react';
import {
    CheckIcon,
    ExclamationTriangleIcon,
    PencilIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { Fragment, useState } from 'react';

export default function GroupDescriptionPopover({
    group,
    canEdit,
    onUpdateDescription,
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [description, setDescription] = useState(
        group.description || 'Không có mô tả nào.',
    );

    const handleSave = () => {
        if (onUpdateDescription) {
            onUpdateDescription(description);
        }
        setIsEditing(false);
    };

    return (
        <Popover className="relative">
            {({ open }) => (
                <>
                    <Popover.Button
                        className={`rounded-full p-2 transition hover:bg-gray-100 dark:hover:bg-gray-800 ${open ? 'bg-gray-200 dark:bg-gray-800' : ''}`}
                    >
                        <ExclamationTriangleIcon className="height-6 w-6 text-gray-500" />
                    </Popover.Button>

                    <Transition
                        as={Fragment}
                        enter="transition ease-out duration-200"
                        enterFrom="opacity-0 translate-y-1"
                        enterTo="opacity-100 translate-y-0"
                        leave="transition ease-in duration-150"
                        leaveFrom="opacity-100 translate-y-0"
                        leaveTo="opacity-0 translate-y-1"
                    >
                        <Popover.Panel className="absolute right-0 z-50 mt-3 w-80 max-w-sm transform px-4 sm:px-0 lg:max-w-3xl">
                            <div className="overflow-hidden rounded-lg bg-white p-4 shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-900">
                                <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-2 dark:border-gray-800">
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                        Description
                                    </h3>
                                    {description && (
                                        <div className="text-xs">
                                            {description}
                                        </div>
                                    )}
                                    {!description && (
                                        <div className="text-xs italic text-gray-500 dark:text-gray-400">
                                            No description provided.
                                        </div>
                                    )}
                                    {canEdit && !isEditing && (
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-600"
                                        >
                                            <PencilIcon className="height-4 w-4" />{' '}
                                            Edit
                                        </button>
                                    )}
                                </div>

                                {isEditing ? (
                                    <div className="space-y-2">
                                        <textarea
                                            rows="3"
                                            className="w-full rounded-md border p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                                            value={description}
                                            onChange={(e) =>
                                                setDescription(e.target.value)
                                            }
                                        />
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => {
                                                    setIsEditing(false);
                                                    setDescription(
                                                        group.description,
                                                    );
                                                }}
                                                className="rounded p-1 text-gray-500 hover:bg-gray-100"
                                            >
                                                <XMarkIcon className="height-5 w-5" />
                                            </button>
                                            <button
                                                onClick={handleSave}
                                                className="rounded p-1 text-green-600 hover:bg-green-50"
                                            >
                                                <CheckIcon className="height-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-400">
                                        {group.description ||
                                            'No description provided.'}
                                    </p>
                                )}

                                <div className="mt-4 border-t border-gray-100 pt-2 text-xs text-gray-400 dark:border-gray-800">
                                    Created At:{' '}
                                    {new Date(
                                        group.created_at,
                                    ).toLocaleDateString('vi-VN')}
                                </div>
                            </div>
                        </Popover.Panel>
                    </Transition>
                </>
            )}
        </Popover>
    );
}
