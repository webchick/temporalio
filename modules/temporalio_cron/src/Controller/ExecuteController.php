<?php

namespace Drupal\temporalio_cron\Controller;

use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Drupal\temporalio_common\Service\CommonSettings;

class ExecuteController extends ControllerBase {
  public function __construct(private CommonSettings $common) {}
  public static function create(\Symfony\Component\DependencyInjection\ContainerInterface $c) {
    return new static($c->get('temporalio_common.settings'));
  }
  public function execute(Request $request): JsonResponse {
    $body = $request->getContent();
    $sig = $request->headers->get('X-Signature');
    $ts  = $request->headers->get('X-Timestamp');
    $calc = hash_hmac('sha256', $ts . '.' . $body, $this->common->hmacSecret());
    if (!hash_equals($calc, (string) $sig) || abs(time() - (int) $ts) > 300) return new JsonResponse(['error' => 'invalid signature'], 401);
    $data = json_decode($body, true) ?: [];
    $spec = $data['callable'] ?? NULL;
    $args = $data['args'] ?? [];
    if (!$spec) return new JsonResponse(['error' => 'missing callable'], 400);
    try { $res = $this->invoke($spec, $args); return new JsonResponse(['ok' => true, 'result' => $res]); }
    catch (\Throwable $e) { return new JsonResponse(['error' => $e->getMessage()], 500); }
  }
  protected function invoke(array $spec, array $args) {
    switch ($spec['type'] ?? '') {
      case 'function': return call_user_func_array($spec['value'], $args);
      case 'static_method': return call_user_func_array([$spec['class'], $spec['method']], $args);
      default: throw new \InvalidArgumentException('Unsupported callable');
    }
  }
}
