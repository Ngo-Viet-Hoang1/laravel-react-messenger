<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreGroupRequest;
use App\Http\Requests\UpdateGroupRequest;
use App\Jobs\DeleteGroupJob;
use App\Models\Group;

class GroupController extends Controller
{
    public function store(StoreGroupRequest $request)
    {
        $data = $request->validated();

        $group = Group::create([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'owner_id' => $request->user()->id,
        ]);

        $group->users()->attach($data['user_ids']);

        return redirect()->route('chat.group', $group->id);
    }

    public function update(UpdateGroupRequest $request, Group $group)
    {
        $data = $request->validated();

        $group->update([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
        ]);

        $group->users()->sync($data['user_ids']);

        return redirect()->route('chat.group', $group->id);
    }

    public function destroy(Group $group)
    {
        if (!auth()->user()?->is_admin && $group->owner_id !== auth()->id()) {
            abort(403, 'Only the group owner can delete the group.');
        }

        DeleteGroupJob::dispatch($group->id)->delay(now()->addSeconds(1));

        return response()->json(['message' => "Group {$group->name} was scheduled and will be deleted soon."]);
    }
}
