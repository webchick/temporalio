# Temporal.io × Drupal Bundle

## 1. What this project does

This bundle integrates [Temporal](https://temporal.io) with Drupal to make background jobs reliable, observable, and resumable.

It replaces Drupal’s fragile PHP-based background systems with Temporal workflows and schedules.  
That means:

- **Cron tasks** always run on time and never overlap.
- **Queue workers** survive crashes and retries automatically.
- **Batch operations** can pause, resume, and resume mid-way after failure.
- **Everything is visible** in the Temporal Web UI.

### Modules included

| Module | Description |
|---------|-------------|
| `temporalio_common` | Centralized configuration (HMAC secret, Temporal worker URL) |
| `temporalio_queue`  | Wraps Drupal’s Queue API in Temporal workflows |
| `temporalio_batch`  | Executes Drupal Batch API jobs via Temporal |
| `temporalio_cron`   | Runs Drupal cron tasks via Temporal Schedules |
| `temporalio/`       | Node.js worker runtime that connects to Temporal Cloud or Server |

---

## 2. Why Temporal?

Drupal’s background systems — cron, queues, and batches — are limited by PHP’s request model.  
If a process dies or times out, work is lost or duplicated. Temporal fixes that by orchestrating work **durably** and **transparently**.

| Problem | Without Temporal | With Temporal |
|----------|------------------|----------------|
| Missed cron runs | Happens frequently | Runs reliably via Temporal Schedules |
| Job crashes | Work lost | Workflows automatically retry |
| Duplicates | Common | Idempotent workflows ensure exactly-once execution |
| Long operations | Timeout mid-way | Resume exactly where left off |
| Visibility | Manual logs | Full timeline in Temporal Web |
| Approvals / human steps | Difficult | Built-in Signals and Queries |

In short, **Temporal adds reliability, visibility, and control** to Drupal background jobs — without forcing you into microservices.

---

## 3. Installation instructions

### A) Prerequisites

- PHP 8.1+ and Drupal 10+
- Node.js 18+
- Either:
  - A [Temporal Server](https://github.com/temporalio/temporal) running locally, or  
  - A [Temporal Cloud](https://temporal.io/cloud) account/namespace

---

### B) Install Drupal modules

Unzip this bundle inside your Drupal project and enable modules:

```bash
drush en temporalio_common temporalio_queue temporalio_batch temporalio_cron -y
```

---

### C) Configure settings

Go to:

```
/admin/config/system/temporalio-common
```

or set the configuration in `settings.php`:

```php
$config['temporalio_common.settings']['hmac_secret'] = getenv('TEMPORALIO_HMAC_SECRET');
$config['temporalio_common.settings']['sidecar_base_url'] = getenv('TEMPORALIO_SIDECAR_URL') ?: 'http://localhost:3000';
```

---

### D) Generate an HMAC secret

Use a long random string for signing communication between Drupal and the Temporal worker:

```bash
openssl rand -hex 32
```

Set this same secret in both:

- Drupal’s settings (above)
- The Temporal worker `.env` file:
  ```bash
  HMAC_SECRET=your-random-secret
  ```

---

### E) Run the Temporal worker

The Temporal runtime lives under the `temporalio/` folder.

Install dependencies and start it:

```bash
cd temporalio
npm install
cp .env.example .env
# Edit .env with your Temporal + Drupal info:
# - HMAC_SECRET (same as Drupal)
# - DRUPAL_BASE (your Drupal site URL)
# - TEMPORAL_ADDRESS (Temporal server hostname)
# - TEMPORAL_NAMESPACE (Cloud namespace, or 'default' locally)
npm run dev     # starts HTTP bridge servers
npm run worker  # runs the Temporal worker process
```

---

## 4. Testing your installation

### A) Start Temporal Web

If running Temporal Server locally:
```bash
temporal server start-dev
```

Then open the **Temporal Web UI** at:

```
http://localhost:8233
```

---

### B) Enqueue a test queue item

In Drupal’s PHP runtime (Devel eval or `drush php`):

```php
\Drupal::queue('example_queue')->createItem(['message' => 'Hello Temporal!']);
```

---

### C) Create a sample batch process

```php
$batch = [
  'title' => t('Example Temporal batch'),
  'operations' => [
    ['\\Drupal\\my_module\\ExampleBatch::process', []],
  ],
];
temporalio_batch_set($batch);
temporalio_batch_process();
```

---

### D) Observe in Temporal Web

Go to Temporal Web UI, and you should see workflows like:

- `temporalQueueItemWorkflow`
- `temporalBatchWorkflow`
- `cronRunWorkflow`

Click one to view:
- Execution history
- Activity retries
- Progress events
- Logs and errors (if any)

---

### E) Validate HMAC security

Stop the worker and try to enqueue a new job.  
You should see an `invalid signature` error until the worker restarts — confirming that only authenticated calls succeed.

---

### ✅ Success

You’ve now got a fully reliable, resumable Drupal background system powered by Temporal.
