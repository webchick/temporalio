import { proxyActivities } from '@temporalio/workflow';
const { executeQueueWorker } = proxyActivities<{ executeQueueWorker(drupalBase: string, secret: string, body: any): Promise<void>; }>({
  startToCloseTimeout: '5 minutes',
  retry: { maximumAttempts: 10 },
});
export interface QueueItemArgs { queue: string; data: any; drupalBase: string; secret: string; }
export async function temporalQueueItemWorkflow(args: QueueItemArgs) {
  await executeQueueWorker(args.drupalBase, args.secret, { queue: args.queue, data: args.data });
}
