<?php
namespace App\Patterns\TemplateMethod\DirectChannel;

use App\Models\Channel;

abstract class DirectChannelCreator
{
    final public function findOrCreate(int $userId1, int $userId2): Channel
    {
        $directKey = $this->buildDirectKey($userId1, $userId2);
        $attributes = $this->buildChannelAttributes();

        $channel = Channel::firstOrCreate(
            ['direct_key' => $directKey],
            array_merge($attributes, [
                'type' => 'direct',
                'name' => null,
                'description' => null,
                'owner_id' => null,
            ]),
        );

        $channel->members()->syncWithoutDetaching([$userId1, $userId2]);

        return $channel;
    }

    abstract protected function buildDirectKey(int $userId1, int $userId2): string;

    abstract protected function buildChannelAttributes(): array;

    protected function baseKey(int $userId1, int $userId2): string
    {
        return min($userId1, $userId2) . ':' . max($userId1, $userId2);
    }
}
