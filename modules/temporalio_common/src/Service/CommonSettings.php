<?php

namespace Drupal\temporalio_common\Service;

use Drupal\Core\Config\ConfigFactoryInterface;

class CommonSettings {
  public function __construct(private ConfigFactoryInterface $cfg) {}

  public function sidecarBaseUrl(): string {
    $url = (string) $this->cfg->get('temporalio_common.settings')->get('sidecar_base_url');
    return rtrim($url ?: 'http://localhost:3000', '/');
  }

  public function hmacSecret(): string {
    return (string) $this->cfg->get('temporalio_common.settings')->get('hmac_secret');
  }
}
