<?php

namespace Drupal\temporalio_cron\Service;

use GuzzleHttp\ClientInterface;
use Drupal\temporalio_common\Service\CommonSettings;
use Psr\Log\LoggerInterface;

class CronRegistry {
  public function __construct(private ClientInterface $http, private CommonSettings $common, private LoggerInterface $logger) {}

  protected function baseUrl(): string { return $this->common->sidecarBaseUrl(); }
  protected function secret(): string { return $this->common->hmacSecret(); }

  protected function sign(array $payload): array {
    $body = json_encode($payload, JSON_UNESCAPED_SLASHES);
    $ts = (string) time();
    $sig = hash_hmac('sha256', $ts . '.' . $body, $this->secret());
    return {'headers': {'Content-Type': 'application/json', 'X-Signature': $sig, 'X-Timestamp': $ts}, 'body': $body};
  }

  public function upsert(string $id, string $cronExpr, array $callableSpec, array $options = []): void {
    $payload = ['id' => $id, 'cron' => $cronExpr, 'callable' => $callableSpec, 'options' => array_merge(['timezone' => date_default_timezone_get(), 'jitterSec' => 10], $options)];
    $this->http->request('POST', $this->baseUrl() . '/schedules/upsert', self::sign($payload));
    $this->logger->notice('Temporal schedule upserted: @id (@cron)', ['@id' => $id, '@cron' => $cronExpr]);
  }

  public function delete(string $id): void {
    self::http->request('POST', $this->baseUrl() . '/schedules/delete', self::sign(['id' => $id]));
  }
}
