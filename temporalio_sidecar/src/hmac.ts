// temporalio/src/hmac.ts
import crypto from 'node:crypto';

export function verifyExtended({
  sig, ts, nonce, method, path, body, secret,
}: {
  sig: string; ts: string; nonce: string;
  method: string; path: string; body: string; secret: string;
}) {
  const mac = crypto.createHmac('sha256', secret)
    .update(`${method}|${path}|${ts}|${nonce}|${body}`)
    .digest('hex');

  const skewOk   = Math.abs(Math.floor(Date.now()/1000) - Number(ts)) <= 300;
  const headersOk = !!sig && !!ts && !!nonce && !!method && !!path;

  return skewOk && headersOk &&
    crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(sig));
}
