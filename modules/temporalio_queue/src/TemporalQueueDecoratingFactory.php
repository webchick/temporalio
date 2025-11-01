<?php

namespace Drupal\temporalio_queue;

use Drupal\Core\Queue\QueueFactoryInterface;
use Drupal\Core\Queue\QueueInterface;
use GuzzleHttp\ClientInterface;
use Drupal\temporalio_common\Service\CommonSettings;

class TemporalQueueDecoratingFactory implements QueueFactoryInterface {
  public function __construct(
    private ClientInterface $http,
    private CommonSettings $common,
    private QueueFactoryInterface $inner
  ) {}

  public function get($name): QueueInterface {
    return new TemporalQueue($name, $this->http, $this->common);
  }
}
