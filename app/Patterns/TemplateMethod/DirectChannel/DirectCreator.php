<?php
namespace App\Patterns\TemplateMethod\DirectChannel;

class DirectCreator extends DirectChannelCreator
{
    protected function buildDirectKey(int $userId1, int $userId2): string
    {
        return $this->baseKey($userId1, $userId2);
    }

    protected function buildChannelAttributes(): array
    {
        return ['is_e2ee_enabled' => false];
    }
}
