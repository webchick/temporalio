<?php

namespace Drupal\temporalio_batch\Service;

use GuzzleHttp\ClientInterface;
use Drupal\temporalio_common\Service\CommonSettings;

class BatchRunner {
  public function __construct(private ClientInterface $http, private CommonSettings $common) {}

  protected function baseUrl(): string { return $this->common->sidecarBaseUrl(); }
  protected function secret(): string { return $this->common->hmacSecret(); }

  protected function sign(array $payload): array {
    $body = json_encode($payload, JSON_UNESCAPED_SLASHES);
    $ts = (string) time();
    $sig = hash_hmac('sha256', $ts . '.' . $body, $this->secret());
    return [
      'headers' => [
        'Content-Type' => 'application/json',
        'X-Signature' => $sig,
        'X-Timestamp' => $ts,
      ],
      'body' => $body,
    ];
  }

  public function start(array $batch): string {
    $ops = array_map(function($op) {
      [$callable, $args] = [$op[0], array_slice($op, 1)];
      return ['callable' => $this->spec($callable), 'args' => $args];
    }, $batch['operations'] ?? []);

    $id = 'batch:' . bin2hex(random_bytes(6));
    $payload = ['batchId' => $id, 'title' => $batch['title'] ?? 'Batch', 'finishedCallback' => isset($batch['finished']) ? $this->spec($batch['finished']) : NULL, 'operations' => $ops];
    $this->http->request('POST', $this->baseUrl() . '/batch/start', $this->sign($payload));
    \Drupal::state()->set('temporalio_batch.last_id', $id);
    return $id;
  }

  protected function spec($callable): array {
    if (is_string($callable)) return ['type' => 'function', 'value' => $callable];
    if (is_array($callable) && count($callable) === 2) {
      [$clsOrObj, $method] = $callable;
      $class = is_object($clsOrObj) ? get_class($clsOrObj) : $clsOrObj;
      return ['type' => 'static_method', 'class' => $class, 'method' => $method];
    }
    throw new \InvalidArgumentException('Unsupported callable');
  }
}
