import midtransClient from 'midtrans-client';
import { config } from './env.js';

export const snap = new midtransClient.Snap({
  isProduction: config.midtrans.isProduction,
  serverKey: config.midtrans.serverKey,
  clientKey: config.midtrans.clientKey,
});

export const coreApi = new midtransClient.CoreApi({
  isProduction: config.midtrans.isProduction,
  serverKey: config.midtrans.serverKey,
  clientKey: config.midtrans.clientKey,
});

