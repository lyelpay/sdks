<?php

declare(strict_types=1);

namespace Lyel\Pay;

class WebhookEvent
{
    public function __construct(
        public readonly string $id,
        public readonly string $type,
        public readonly int $created,
        public readonly array $data,
    ) {}
}

class Webhook
{
    private const TOLERANCE_SECONDS = 300;

    public function constructEvent(string $payload, string $header, string $secret): WebhookEvent
    {
        $parts = [];
        foreach (explode(',', $header) as $part) {
            [$k, $v] = explode('=', $part, 2) + [null, null];
            if ($k !== null && $v !== null) {
                $parts[$k] = $v;
            }
        }

        $timestamp = $parts['t'] ?? null;
        $signature = $parts['v1'] ?? null;

        if ($timestamp === null || $signature === null) {
            throw new \InvalidArgumentException('Invalid webhook signature header');
        }

        $ts = (int) $timestamp;
        $now = time();
        if (abs($now - $ts) > self::TOLERANCE_SECONDS) {
            throw new \RuntimeException('Webhook timestamp too old');
        }

        $signed = $timestamp . '.' . $payload;
        $expected = hash_hmac('sha256', $signed, $secret);

        if (!hash_equals($expected, $signature)) {
            throw new \RuntimeException('Webhook signature mismatch');
        }

        $body = json_decode($payload, true);

        return new WebhookEvent(
            id: $body['id'],
            type: $body['type'],
            created: $body['created'],
            data: $body['data'],
        );
    }
}
