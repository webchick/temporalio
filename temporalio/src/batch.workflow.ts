import { proxyActivities, defineSignal, setHandler } from '@temporalio/workflow';
const { runOperation, notifyDrupal } = proxyActivities<{ runOperation(drupalBase: string, secret: string, body: any): Promise<void>; notifyDrupal(drupalBase: string, secret: string, body: any): Promise<void>; }>({
  startToCloseTimeout: '15 minutes',
  retry: { maximumAttempts: 10 },
});
export interface BatchArgs {
  batchId: string;
  title?: string;
  operations: { callable: any; args: any[] }[];
  finishedCallback?: any | null;
  drupalBase: string;
  secret: string;
}
export const pause = defineSignal('pause');
export const resume = defineSignal('resume');
export const cancel = defineSignal('cancel');
export async function temporalBatchWorkflow(args: BatchArgs) {
  let isPaused = false, isCanceled = false;
  setHandler(pause, () => { isPaused = true; });
  setHandler(resume, () => { isPaused = false; });
  setHandler(cancel, () => { isCanceled = true; });
  for (let i = 0; i < args.operations.length; i++) {
    if (isCanceled) break;
    while (isPaused) { await new Promise(r => setTimeout(r, 1000)); }
    const op = args.operations[i];
    await notifyDrupal(args.drupalBase, args.secret, { batchId: args.batchId, step: 'running', index: i, total: args.operations.length });
    await runOperation(args.drupalBase, args.secret, { batchId: args.batchId, op });
    await notifyDrupal(args.drupalBase, args.secret, { batchId: args.batchId, step: 'completed', index: i+1, total: args.operations.length });
  }
  if (!isCanceled && args.finishedCallback) {
    await runOperation(args.drupalBase, args.secret, { batchId: args.batchId, op: { callable: args.finishedCallback, args: [] } });
  }
}
