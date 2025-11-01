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

app.post('/queue/enqueue', async (req, res) => {
  const raw = JSON.stringify(req.body);
  const sig = req.header('X-Signature') ?? '';
  const ts = req.header('X-Timestamp') ?? '';
  if (!verify(sig, ts, raw, HMAC_SECRET)) return res.status(401).json({ error: 'bad signature' });

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

app.listen(process.env.PORT || 3000, () => console.log('TemporalIO queue server listening'));
