<?php
namespace App\Patterns\TemplateMethod\DirectChannel;

class E2EEDirectCreator extends DirectChannelCreator
{
    protected function buildDirectKey(int $userId1, int $userId2): string
    {
        return 'e2ee:' . $this->baseKey($userId1, $userId2);
    }

    protected function buildChannelAttributes(): array
    {
        return ['is_e2ee_enabled' => true];
    }
}
