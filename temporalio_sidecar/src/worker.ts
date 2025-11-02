import { Worker } from '@temporalio/worker';
import { fileURLToPath } from 'node:url';

// Activities
import * as queueActs from './queue.activities';
import * as batchActs from './batch.activities';
import * as cronActs from './cron.activities';

async function run() {
  const workflowsPath = fileURLToPath(new URL('./workflows.ts', import.meta.url)); // <-- decode %20

  const worker = await Worker.create({
    workflowsPath,
    activities: { ...queueActs, ...batchActs, ...cronActs },
    taskQueue: 'default',
  });

  await worker.run();
}

run().catch((err) => { console.error(err); process.exit(1); });
