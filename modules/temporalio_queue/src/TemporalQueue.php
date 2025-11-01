<?php

namespace Drupal\temporalio_queue;

use Drupal\Core\Queue\QueueInterface;
use GuzzleHttp\ClientInterface;
use Drupal\temporalio_common\Service\CommonSettings;

class TemporalQueue implements QueueInterface {
  public function __construct(
    protected string $name,
    protected ClientInterface $http,
    protected CommonSettings $common,
  ) {}

  protected function baseUrl(): string { return $this->common->sidecarBaseUrl(); }
  protected function secret(): string { return $this->common->hmacSecret(); }

  protected function sign(array $payload): array {
    $body = json_encode($payload, JSON_UNESCAPED_SLASHES);
    $ts = (string) time();
    $sig = hash_hmac('sha256', $ts . '.' . $body, $this->secret());
    return {'headers': {'Content-Type': 'application/json', 'X-Signature': $sig, 'X-Timestamp': $ts}, 'body': $body};
  }

  public function createItem($data) {
    $payload = ['queue' => $this->name, 'data' => $data, 'idempotencyKey' => \Drupal::service('uuid')->generate()];
    $this->http->request('POST', $this->baseUrl() . '/queue/enqueue', $this->sign($payload));
  }
  public function numberOfItems(): int { return 0; }
  public function createQueue() {}
  public function deleteQueue() {}
  public function claimItem($lease_time = 3600) { return false; }
  public function deleteItem($item) {}
  public function releaseItem($item) {}
}
