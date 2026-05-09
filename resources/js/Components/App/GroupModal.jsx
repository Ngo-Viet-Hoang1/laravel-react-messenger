import TextAreaInput from "@/Components/TextAreaInput";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import Modal from "@/Components/Modal";
import TextInput from "@/Components/TextInput";
import SecondaryButton from "@/Components/SecondaryButton";
import PrimaryButton from "@/Components/PrimaryButton";
import UserPicker from "@/Components/App/UserPicker";
import { useForm, usePage } from "@inertiajs/react";
import { useEventBus } from "@/EventBus";
import { useEffect, useState } from "react";

export default function GroupModal({ show = false, onClose = () => { } }) {
    const page = usePage();
    const conversations = page.props?.conversation ?? [];
    const { on, emit } = useEventBus();
    const [group, setGroup] = useState({});

    const { data, setData, processing, reset, post, put, errors } = useForm({
        id: "",
        name: "",
        description: "",
        user_ids: [],
    });

    const users = conversations.filter((c) => !c.is_group);

    const createOrUpdateGroup = (e) => {
        e.preventDefault();

        if (group.id) {
            put(route("group.update", group.id), {
                onSuccess: () => {
                    emit("toast.show", `Group "${data.name}" was updated.`);
                    closeModal();
                }
            });
            return;
        }

        post(route("group.store"), {
            onSuccess: () => {
                emit("toast.show", `Group "${data.name}" was created.`);
                closeModal();
            }
        });
    }

    const closeModal = () => {
        reset();
        onClose();
    }

    useEffect(() => {
        return on("GroupModal.show", (group) => {
            setData({
                name: group.name,
                description: group.description,
                user_ids: (group.users ?? [])
                    .filter((u) => group.owner_id !== u.id)
                    .map((u) => u.id),
            });
            setGroup(group);
        });
    }, [on]);

    return (
        <Modal show={show} onClose={closeModal}>
            <form onSubmit={createOrUpdateGroup}
                className="p-6 overflow-y-auto"
            >
                <h2 className="text-xl font-medium text-gray-900 dark:text-gray-100">
                    {group.id
                        ? `Edit Group "${group.name}"`
                        : "Create new Group"}
                </h2>

                <div className="mt-8">
                    <InputLabel htmlFor="name" value="Name" />

                    <TextInput
                        id="name"
                        className="mt-1 block w-full"
                        value={data.name}
                        disabled={!!group.id}
                        onChange={(e) => setData("name", e.target.value)}
                        required
                        isFocused
                    />
                    <InputError message={errors.name} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="description" value="Description" />
                    <TextAreaInput
                        id="description"
                        rows={3}
                        className="mt-1 block w-full"
                        value={data.description || ""}
                        onChange={(e) => setData("description", e.target.value)}
                    />
                    <InputError message={errors.description} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel value="Selected Users" />

                    <UserPicker
                        value={
                            users.filter((u) => group.owner_id !== u.id
                                             && data.user_ids.includes(u.id)) || []
                        }
                        options={users}
                        onSelect={(users) => {
                            setData("user_ids", users.map((u) => u.id));
                        }}
                    />
                    <InputError message={errors.user_ids} className="mt-2" />
                </div>

                <div className="flex mt-6 justify-end">
                    <SecondaryButton onClick={closeModal}>
                        Cancel
                    </SecondaryButton>
                    <PrimaryButton className="ml-3" disabled={processing}>
                        {group.id ? "Update" : "Create"}
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}




