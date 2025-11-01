# Temporal.io x Drupal Integration

## What is this?
This is a set of modules that integrate Drupal core functionality with [Temporal](https://temporal.io/).

The following modules exist so far:

* **temporalio_batch**: A Temporal backend for the [Drupal Batch API](https://api.drupal.org/api/drupal/core%21lib%21Drupal%21Core%21Queue%21Batch.php/class/Batch/).
* **temporalio_cron**: A Temporal backend for the [Drupal Cron service](https://api.drupal.org/api/drupal/core%21lib%21Drupal%21Core%21Cron.php/class/Cron/).
* **temporalio_queue**: A Temporal backend for the [Drupal Queue system](https://api.drupal.org/api/drupal/core%21core.api.php/group/queue).
* (more to come!)

## Why Temporal?

* **No more lost jobs** – Temporal makes various workflows (e.g. cron, queues, and batches) durable: if PHP crashes or the site restarts, work just resumes where it left off.
* **Automatic retries with backoff** – Stop writing retry loops; Temporal handles failures, exponential backoff, and limits for you.
* **Progress you can see** – Every job, batch, or schedule is tracked in Temporal Web with start time, status, retries, and results.
* **Cron that never misses** – Temporal’s built-in scheduler runs exactly on time, even if your site gets no traffic.
* **Exactly-once execution** – Temporal guarantees no double-processing or half-finished jobs.
* **Pause, resume, or cancel long tasks** – Great for imports, rebuilds, and migrations that would normally time out.
* **Simple human-in-loop steps** – Pause a workflow and wait for an approval Signal before continuing.
* **Same Drupal APIs, more reliability** – You keep calling regular Drupal APIs, but they run through Temporal behind the scenes.

**TL;DR**: Temporal turns Drupal’s background tasks into reliable, observable, self-healing workflows — without rewriting your site into microservices.
