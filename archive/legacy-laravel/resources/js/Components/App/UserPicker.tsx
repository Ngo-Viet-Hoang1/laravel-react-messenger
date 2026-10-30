import { ChatMember } from '@/types';
import MultiSelectCombobox from '../Breeze/MultiSelectCombobox';

type Props = {
    selectedUsers: ChatMember[];
    users: ChatMember[];
    onUsersChange: (users: ChatMember[]) => void;
};

const UserPicker = ({ selectedUsers, users, onUsersChange }: Props) => {
    return (
        <div>
            <MultiSelectCombobox<ChatMember>
                value={selectedUsers}
                options={users}
                onChange={onUsersChange}
                placeholder="Select users..."
                noResultsText="No users found"
                getItemKey={(user) => user.id}
                getItemLabel={(user) => user.name ?? ''}
                getDisplayValue={(users) =>
                    users.length > 0
                        ? users.map((u) => u.name ?? '').join(', ')
                        : 'Select users...'
                }
                filterItem={(user, query) =>
                    (user.name ?? '')
                        .toLowerCase()
                        .includes(query.toLowerCase())
                }
            />

            {selectedUsers.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                    {selectedUsers.map((user) => (
                        <div
                            key={user.id}
                            className="flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-300"
                        >
                            {user.name ?? 'Unknown'}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default UserPicker;
