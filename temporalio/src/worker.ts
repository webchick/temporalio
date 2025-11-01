import { Worker } from '@temporalio/worker';

async function run() {
  const worker = await Worker.create({
    workflowsPath: new URL('./workflows.js', import.meta.url).pathname,
    activities: {
      ...(await import('./queue.activities.js')),
      ...(await import('./batch.activities.js')),
      ...(await import('./cron.activities.js')),
    },
    taskQueue: 'default'
  });
  await worker.run();
}

run().catch((err) => { console.error(err); process.exit(1); });
