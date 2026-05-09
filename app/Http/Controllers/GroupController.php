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
        $user_ids = $data['user_ids'] ?? [];
        $group = Group::create($data);

        $group->users()->attach(array_unique([$request->user()->id, ...$user_ids]));

        return redirect()->back();
    }

    public function update(UpdateGroupRequest $request, Group $group)
    {
        $data = $request->validated();
        $user_ids = $data['user_ids'] ?? [];
        $group->update($data);

        // Remove all users and attache the new ones
        $group->users()->detach();
        $group->users()->attach(array_unique([$request->user()->id, ...$user_ids]));

        return redirect()->back();
    }

    public function destroy(Group $group)
    {
        // check owner id
        if ($group->owner_id !== Auth()->id()) {
            abort(403);
        }

        DeleteGroupJob::dispatch($group)->delay(now()->addSecond(5));

        return response()->json(['message' => 'Group delete was sheduled and will be deleted soon.']);
    }
}
