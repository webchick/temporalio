<?php

namespace Drupal\temporalio_batch\Controller;

use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\HttpFoundation\Response;

class BatchStatusController extends ControllerBase {
  public function view(string $batchId): Response {
    $markup = '<h2>Batch ' . htmlspecialchars($batchId) . '</h2><p>Processing in Temporal. Refresh to see updates.</p>';
    return new Response($markup);
  }
}
