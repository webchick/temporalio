import { proxyActivities } from '@temporalio/workflow';
const { execDrupal } = proxyActivities<{ execDrupal(drupalBase: string, secret: string, body: any): Promise<void>; }>({
  startToCloseTimeout: '10 minutes',
  retry: { maximumAttempts: 10 },
});
export interface CronRunArgs { id: string; callable: any; drupalBase: string; secret: string; }
export async function cronRunWorkflow(args: CronRunArgs) {
  await execDrupal(args.drupalBase, args.secret, { id: args.id, callable: args.callable, args: [] });
}
