<?php

declare(strict_types=1);

namespace Lyel\Pay;

class LyelPayException extends \RuntimeException
{
    public function __construct(
        public readonly int $statusCode,
        string $message,
    ) {
        parent::__construct($message);
    }
}

class Client
{
    private const BASE_URL = 'https://api.lyelpay.com';

    public readonly PaymentIntents $paymentIntents;

    public function __construct(
        private readonly string $secretKey,
        private readonly string $baseUrl = self::BASE_URL,
    ) {
        $this->paymentIntents = new PaymentIntents($this);
    }

    public function post(string $path, array $payload): array
    {
        return $this->request('POST', $path, $payload);
    }

    public function get(string $path, ?string $sessionToken = null): array
    {
        return $this->request('GET', $path, null, $sessionToken);
    }

    private function request(string $method, string $path, ?array $payload, ?string $sessionToken = null): array
    {
        $url = rtrim($this->baseUrl, '/') . $path;

        $headers = [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $this->secretKey,
        ];

        if ($sessionToken !== null) {
            $headers[] = 'x-session-token: ' . $sessionToken;
        }

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);

        if ($payload !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        }

        $body = curl_exec($ch);
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $data = json_decode((string) $body, true) ?? [];

        if ($status < 200 || $status >= 300) {
            $message = $data['message'] ?? "HTTP {$status}";
            throw new LyelPayException($status, $message);
        }

        return $data;
    }
}
