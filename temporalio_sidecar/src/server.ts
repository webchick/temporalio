// temporalio/src/server.ts
import 'dotenv/config';
import express from 'express';
import { Connection, Client } from '@temporalio/client';
import { verifyExtended } from './hmac';

const app = express();
app.use(express.json());

const TEMPORAL_ADDRESS  = process.env.TEMPORAL_ADDRESS!;
const TEMPORAL_NAMESPACE = process.env.TEMPORAL_NAMESPACE!;
const HMAC_SECRET = process.env.HMAC_SECRET!;
const DRUPAL_BASE = process.env.DRUPAL_BASE!.replace(/\/$/, '');

// Shared Temporal client
const clientPromise = Connection.connect({ address: TEMPORAL_ADDRESS })
  .then(conn => new Client({ connection: conn, namespace: TEMPORAL_NAMESPACE }));

// Small helper to DRY verification
function verifyReq(req: express.Request, body: string): boolean {
  const sig   = req.header('X-Signature') ?? '';
  const ts    = req.header('X-Timestamp') ?? '';
  const nonce = req.header('X-Nonce') ?? '';
  return verifyExtended({ sig, ts, nonce, method: req.method, path: req.path, body, secret: HMAC_SECRET });
}

// ---- Healthcheck ----
app.get('/health', (_req, res) => res.json({ ok: true }));

// ---- Queue: /queue/enqueue ----
app.post('/queue/enqueue', async (req, res) => {
  const raw = JSON.stringify(req.body ?? {});
  if (!verifyReq(req, raw)) return res.status(401).json({ error: 'bad signature' });

  const { queue, data, idempotencyKey } = req.body;
  try {
    const client = await clientPromise;
    await client.workflow.start('temporalQueueItemWorkflow', {
      taskQueue: 'queue-items',
      workflowId: `q:${queue}:${idempotencyKey ?? Date.now()}`,
      args: [{ queue, data, drupalBase: DRUPAL_BASE, secret: HMAC_SECRET }],
    });
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ---- Batch: /batch/start ----
app.post('/batch/start', async (req, res) => {
  const raw = JSON.stringify(req.body ?? {});
  if (!verifyReq(req, raw)) return res.status(401).json({ error: 'bad signature' });

  const { batchId, title, operations, finishedCallback } = req.body;
  try {
    const client = await clientPromise;
    await client.workflow.start('temporalBatchWorkflow', {
      taskQueue: 'batches',
      workflowId: batchId,
      args: [{ batchId, title, operations, finishedCallback, drupalBase: DRUPAL_BASE, secret: HMAC_SECRET }],
    });
    res.json({ ok: true, batchId });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ---- Cron schedules: /schedules/upsert & /schedules/delete ----
app.post('/schedules/upsert', async (req, res) => {
  const raw = JSON.stringify(req.body ?? {});
  if (!verifyReq(req, raw)) return res.status(401).json({ error: 'bad signature' });

  const { id, cron, callable, options } = req.body;
  try {
    const client = await clientPromise;
    await client.schedule.upsert(id, {
      spec: { cronExpressions: [cron], timeZone: options?.timezone ?? 'UTC' },
      policies: { overlap: 'BUFFER_ONE' },
      action: {
        type: 'startWorkflow',
        workflowType: 'cronRunWorkflow',
        taskQueue: 'cron-runs',
        args: [{ id, callable, drupalBase: DRUPAL_BASE, secret: HMAC_SECRET }],
      },
      state: { paused: false },
      jitter: options?.jitterSec ? { maxDuration: `${options.jitterSec}s` } : undefined,
    });
    res.json({ ok: true, id });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/schedules/delete', async (req, res) => {
  const raw = JSON.stringify(req.body ?? {});
  if (!verifyReq(req, raw)) return res.status(401).json({ error: 'bad signature' });

  const { id } = req.body;
  try {
    const client = await clientPromise;
    await client.schedule.delete(id);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ---- Start server on a single port ----
const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => console.log(`Temporal bridge listening on :${PORT}`));
