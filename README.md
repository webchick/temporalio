# TemporalIO × Drupal Reliability Bundle

**Folders**
- `drupal/` — Drupal modules
  - `temporalio_common` — shared settings (HMAC secret, sidecar base URL)
  - `temporalio_queue`  — Queue API → Temporal
  - `temporalio_batch`  — Batch API → Temporal
  - `temporalio_cron`   — Cron via Temporal Schedules
- `temporalio/` — TemporalIO worker & bridge servers (renamed from `sidecar/`)

## Configure once
Visit `/admin/config/system/temporalio-common` or set via `settings.php`:
```php
$config['temporalio_common.settings']['hmac_secret'] = getenv('TEMPORALIO_HMAC_SECRET');
$config['temporalio_common.settings']['sidecar_base_url'] = getenv('TEMPORALIO_SIDECAR_URL') ?: 'http://localhost:3000';
```

## TemporalIO runtime env (`temporalio/.env` from `.env.example`)
```
TEMPORAL_ADDRESS=localhost:7233
TEMPORAL_NAMESPACE=default
HMAC_SECRET=change-me
PORT=3000
DRUPAL_BASE=http://localhost:8080
```
