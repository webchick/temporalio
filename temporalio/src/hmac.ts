import crypto from 'node:crypto';
export function verify(sig: string, ts: string, body: string, secret: string) {
  const mac = crypto.createHmac('sha256', secret).update(`${ts}.${body}`).digest('hex');
  const skewOk = Math.abs(Math.floor(Date.now()/1000) - Number(ts)) <= 300;
  return skewOk && crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(sig));
}
