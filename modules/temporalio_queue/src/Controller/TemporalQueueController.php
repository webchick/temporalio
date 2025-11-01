<?php

namespace Drupal\temporalio_queue\Controller;

use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Drupal\Core\Queue\QueueWorkerManagerInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Drupal\temporalio_common\Service\CommonSettings;

class TemporalQueueController extends ControllerBase {
  public function __construct(
    protected QueueWorkerManagerInterface $manager,
    protected \Symfony\Component\HttpFoundation\RequestStack $requestStack,
    protected CommonSettings $common,
  ) {}

  public static function create(ContainerInterface $c) {
    return new static($c->get('plugin.manager.queue_worker'), $c->get('request_stack'), $c->get('temporalio_common.settings'));
  }

  public function execute(Request $request): JsonResponse {
    $body = $request->getContent();
    $sig = $request->headers->get('X-Signature');
    $ts  = $request->headers->get('X-Timestamp');
    $calc = hash_hmac('sha256', $ts . '.' . $body, $this->common->hmacSecret());
    if (!hash_equals($calc, (string) $sig) || abs(time() - (int) $ts) > 300) return new JsonResponse(['error' => 'invalid signature'], 401);

    $payload = json_decode($body, true) ?: [];
    $queue = (string) ($payload['queue'] ?? '');
    $data  = $payload['data'] ?? null;
    if (!$queue || !$this->manager->hasDefinition($queue)) return new JsonResponse(['error' => 'unknown queue'], 400);

    $plugin = $this->manager->createInstance($queue);
    try { $plugin->processItem($data); return new JsonResponse(['ok' => true]); }
    catch (\Throwable $e) { return new JsonResponse(['error' => $e->getMessage()], 500); }
  }
}
