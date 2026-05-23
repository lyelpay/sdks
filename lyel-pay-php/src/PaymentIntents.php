<?php

declare(strict_types=1);

namespace Lyel\Pay;

class PaymentIntents
{
    public function __construct(private readonly Client $client) {}

    public function create(
        string $amount,
        string $currency,
        ?string $description = null,
        ?array $metadata = null,
    ): array {
        $payload = ['amount' => $amount, 'currency' => $currency];
        if ($description !== null) $payload['description'] = $description;
        if ($metadata !== null) $payload['metadata'] = $metadata;

        return $this->client->post('/gateway/v1/payment-intents', $payload);
    }

    public function retrieve(string $sessionToken): array
    {
        return $this->client->get('/gateway/v1/payment-intents/status', $sessionToken);
    }
}
