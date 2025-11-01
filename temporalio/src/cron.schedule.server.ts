import 'dotenv/config';
import express from 'express';
import { Connection, Client } from '@temporalio/client';
import { verify } from './hmac.js';

const app = express();
app.use(express.json());

const TEMPORAL_ADDRESS = process.env.TEMPORAL_ADDRESS!;
const TEMPORAL_NAMESPACE = process.env.TEMPORAL_NAMESPACE!;
const HMAC_SECRET = process.env.HMAC_SECRET!;
const DRUPAL_BASE = process.env.DRUPAL_BASE!.replace(/\/$/, '');

const connectionPromise = Connection.connect({ address: TEMPORAL_ADDRESS });
const clientPromise = connectionPromise.then(conn => new Client({ connection: conn, namespace: TEMPORAL_NAMESPACE }));

app.post('/schedules/upsert', async (req, res) => {
  const raw = JSON.stringify(req.body);
  const sig = req.header('X-Signature') ?? '';
  const ts = req.header('X-Timestamp') ?? '';
  if (!verify(sig, ts, raw, HMAC_SECRET)) return res.status(401).json({ error: 'bad signature' });

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
  const raw = JSON.stringify(req.body);
  const sig = req.header('X-Signature') ?? '';
  const ts = req.header('X-Timestamp') ?? '';
  if (!verify(sig, ts, raw, HMAC_SECRET)) return res.status(401).json({ error: 'bad signature' });

  const { id } = req.body;
  try {
    const client = await clientPromise;
    await client.schedule.delete(id);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(process.env.PORT || 3000, () => console.log('TemporalIO cron server listening'));
