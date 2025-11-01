import axios from 'axios';
export async function runOperation(drupalBase: string, secret: string, body: any) {
  const payload = JSON.stringify(body);
  const ts = Math.floor(Date.now()/1000).toString();
  const crypto = await import('node:crypto');
  const mac = crypto.createHmac('sha256', secret).update(`${ts}.${payload}`).digest('hex');
  await axios.post(`${drupalBase}/temporalio/batch/execute`, payload, {
    headers: { 'Content-Type': 'application/json', 'X-Timestamp': ts, 'X-Signature': mac },
    timeout: 20000,
  });
}
export async function notifyDrupal(_drupalBase: string, _secret: string, _body: any) {}
