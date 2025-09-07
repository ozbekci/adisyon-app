import express, { Request, Response } from 'express';
import http from 'http';
import https from 'https';
import { Server as SocketIOServer } from 'socket.io';
import { DatabaseManager } from '../database/DatabaseManager';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import jwt from 'jsonwebtoken';
import { app } from 'electron';
import { authenticate, requireAuth } from './auth';

export interface StartedServer {
  api: express.Express;
  httpServer: http.Server;
  io: SocketIOServer;
}

export async function startServer(dbManager: DatabaseManager): Promise<StartedServer> {
  const api = express();
  api.use(express.json());

  // ====== Handshake key management (RSA, RS256) ======
 
  function ensureDirSecure(dir: string) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    try { fs.chmodSync(dir, 0o700); } catch { /* ignore */ }
  }

  // JTI replay tracking (Redis if available, else in-memory)
  const usedJti = new Map<string, number>(); // fallback
  let redisClient: any = null;
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    try {
      // Lazy require to avoid dev dependency
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { createClient } = require('redis');
      redisClient = createClient({ url: redisUrl });
      redisClient.on('error', (e: any) => console.warn('Redis error:', e?.toString?.()));
      redisClient.connect().catch((e: any) => console.warn('Redis connect error:', e?.toString?.()));
      console.log('Handshake: Redis replay store enabled');
    } catch (e) {
      console.warn('Redis module not available; using in-memory replay store');
      redisClient = null;
    }
  }
  async function consumeJti(jti: string, ttlMs: number): Promise<boolean> {
    const now = Date.now();
    if (redisClient) {
      try {
        // SET key value NX PX ttl => returns 'OK' if set, null if exists
        const r = await redisClient.set(`jti:${jti}`, '1', { NX: true, PX: ttlMs });
        return r === 'OK';
      } catch (e) {
        console.warn('Redis consumeJti failed, falling back to memory:', e?.toString?.());
      }
    }
    const exp = now + ttlMs;
    if (usedJti.has(jti)) return false;
    usedJti.set(jti, exp);
    return true;
  }
  setInterval(() => {
    const now = Date.now();
    for (const [j, exp] of usedJti.entries()) if (exp < now) usedJti.delete(j);
  }, 60_000).unref();

  /* ============== Health ============== */
  api.get('/health', (_req: Request, res: Response) => res.json({ ok: true }));

  /* ============== Auth ============== */
  api.post('/auth/login', async (req: Request, res: Response) => {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'username & password required' } });
    try {
      const result = await authenticate(dbManager, username, password);
      if (!result) return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Geçersiz kullanıcı veya parola' } });
      return res.json({ user: result.user, token: result.tokens, migrated: result.migrated });
    } catch (e: any) {
      return res.status(500).json({ error: { code: 'AUTH_ERROR', message: e.message } });
    }
  });

  /* ============== Features / Mobile ============== */

  api.get('/features/mobile', async (_req: Request, res: Response) => {
    const flags = await dbManager.getFeatureFlags();
    res.json({ mobileEnabled: flags.mobileEnabled });
  });

  api.put('/features/mobile', async (req: Request, res: Response) => {
    const { mobileEnabled } = req.body || {};
    if (typeof mobileEnabled !== 'boolean') {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'mobileEnabled boolean olmalı' } });
    }
    try {
      await dbManager.setMobileEnabled(mobileEnabled);
      const flags = await dbManager.getFeatureFlags();
      res.json({ mobileEnabled: flags.mobileEnabled });
    } catch (e: any) {
      res.status(500).json({ error: { code: 'SERVER_ERROR', message: e.message } });
    }
  });

  api.post('/owner/verify', async (req: Request, res: Response) => {
    const { password } = req.body || {};
    if (!password) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'password required' } });
    const user = await dbManager.authenticateUser('admin', password);
    if (!user) return res.status(401).json({ error: { code: 'OWNER_AUTH_FAILED', message: 'Geçersiz parola' } });
    res.json({ verified: true });
  });

  /* ============== Waiters ============== */
  api.get('/waiters/active', async (_req: Request, res: Response) => {
    const list = await dbManager.getActiveWaiters();
    res.json(list);
  });

  // Waiter login: supports either (username/password) or (waiterId/pin)
  api.post('/waiter/login', async (req: Request, res: Response) => {
    const { username, password, waiterId, pin } = req.body || {};

    console.log(req)
    // Validate minimal inputs for either flow
    if (!(waiterId && pin) ) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'username/password veya waiterId/pin gerekli' } });
    }
    try {
        const verify = await dbManager.verifyWaiterPin(Number(waiterId), String(pin));
        if (!verify.ok) {
          return res.status(401).json({ error: { code: 'WAITER_AUTH_FAILED', message: 'Geçersiz kullanıcı veya PIN' } });
        }
        // verifyWaiterPin zaten last_checkin_at alanını güncelliyor; token üretip döndür.
        const token = Buffer.from(`${verify.waiter.id}:waiter:${Date.now()}`).toString('base64');
        const now = (dbManager as any).getTurkeyDateTime();
        return res.json({ token, waiter: { id: verify.waiter.id, name: verify.waiter.name, username: verify.waiter.username }, lastCheckin: now });
    } catch (e: any) {
      
      res.status(500).json({ error: { code: 'SERVER_ERROR', message: e.message } });
    }
  });

  // Removed PIN set endpoint; waiters must use username/password

  api.get('/waiter/status', async (req: Request, res: Response) => {
    const waiterId = Number(req.query.waiterId);
    if (!waiterId) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'waiterId required' } });
    const status = await dbManager.waiterStatus(waiterId);
    res.json(status);
  });

  /* ============== Tables & Menu (Mobile/Public) ============== */
  api.get('/tables', async (req: Request, res: Response) => {
    const auth = requireAuth(req.headers.authorization);
    if (!auth) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Token gerekli' } });
    try {
      const tables = await dbManager.getTables();
      res.json(tables);
    } catch (e: any) { res.status(500).json({ error: { code: 'SERVER_ERROR', message: e.message } }); }
  });

  api.get('/menu', async (_req: Request, res: Response) => {
    try {
      const items = await dbManager.getMenuItems();
      const categories = Array.from(new Set(items.map(i => i.category))).sort();
      res.json({ categories, items });
    } catch (e: any) { res.status(500).json({ error: { code: 'SERVER_ERROR', message: e.message } }); }
  });

  /* ============== Orders (Mobile) ============== */
  api.get('/orders/open', async (req: Request, res: Response) => {
    const tableId = Number(req.query.tableId);
    if (!tableId) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'tableId required' } });
    try {
      const order = await dbManager.getOpenOrderForTable(tableId);
      res.json(order);
    } catch (e: any) { res.status(500).json({ error: { code: 'SERVER_ERROR', message: e.message } }); }
  });

  api.post('/orders', async (req: Request, res: Response) => {
    const { tableId, orderType, items } = req.body || {};
    if (!items || !Array.isArray(items) || items.length === 0) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'items required' } });
    try {
      const enriched: any[] = [];
      for (const it of items) {
        if (!it.menuItemId || !it.quantity) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'menuItemId & quantity required for each item' } });
        const price = await dbManager.getActiveMenuItemPrice(it.menuItemId);
        if (price == null) return res.status(409).json({ error: { code: 'MENU_ITEM_UNAVAILABLE', message: 'Ürün yok' } });
        enriched.push({ menuItemId: it.menuItemId, quantity: it.quantity, price, notes: it.notes });
      }
      const order = await dbManager.createOrder({ tableId, orderType, items: enriched });
      res.status(201).json(order);
    } catch (e: any) { res.status(500).json({ error: { code: 'SERVER_ERROR', message: e.message } }); }
  });

  api.post('/orders/:id/items', async (req: Request, res: Response) => {
    const orderId = Number(req.params.id);
    const { items } = req.body || {};
    if (!orderId || !Array.isArray(items)) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'orderId & items required' } });
    try {
      const updated = await dbManager.addItemsToOrder(orderId, items);
      res.json(updated);
    } catch (e: any) {
      if (e.message === 'ORDER_NOT_FOUND') return res.status(404).json({ error: { code: 'ORDER_NOT_FOUND', message: 'Sipariş bulunamadı' } });
      if (e.message === 'ORDER_LOCKED') return res.status(409).json({ error: { code: 'ORDER_LOCKED', message: 'Sipariş kilitli' } });
      if (e.message === 'MENU_ITEM_UNAVAILABLE') return res.status(409).json({ error: { code: 'MENU_ITEM_UNAVAILABLE', message: 'Ürün mevcut değil' } });
      res.status(500).json({ error: { code: 'SERVER_ERROR', message: e.message } });
    }
  });

  api.patch('/orders/:id/status', async (req: Request, res: Response) => {
    const orderId = Number(req.params.id);
    const { status, version } = req.body || {};
    if (!orderId || !status) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'status required' } });
    try {
      const updated = await dbManager.updateOrderStatusValidated(orderId, status, version);
      res.json(updated);
    } catch (e: any) {
      if (e.message === 'ORDER_NOT_FOUND') return res.status(404).json({ error: { code: 'ORDER_NOT_FOUND', message: 'Sipariş yok' } });
      if (e.message === 'INVALID_STATUS') return res.status(400).json({ error: { code: 'INVALID_STATUS', message: 'Geçersiz geçiş' } });
      if (e.message === 'VERSION_CONFLICT') return res.status(409).json({ error: { code: 'VERSION_CONFLICT', message: 'Versiyon uyuşmazlığı' } });
      res.status(500).json({ error: { code: 'SERVER_ERROR', message: e.message } });
    }
  });

  api.get('/orders/:id', async (req: Request, res: Response) => {
    const orderId = Number(req.params.id);
    if (!orderId) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'id required' } });
    const order = await dbManager.getOrderPublic(orderId);
    if (!order) return res.status(404).json({ error: { code: 'ORDER_NOT_FOUND', message: 'Sipariş yok' } });
    res.json(order);
  });

  api.get('/orders/active', async (_req: Request, res: Response) => {
    try {
      const list = await dbManager.listActiveOrders();
      res.json(list);
    } catch (e: any) { res.status(500).json({ error: { code: 'SERVER_ERROR', message: e.message } }); }
  });

  // Duplicate /tables route kept for compatibility (can be removed later)
  api.get('/tables', async (req: Request, res: Response) => {
    const auth = requireAuth(req.headers.authorization);
    if (!auth) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Token gerekli' } });
    try { const tables = await dbManager.getTables(); res.json(tables); }
    catch (e: any) { res.status(500).json({ error: { code: 'SERVER_ERROR', message: e.message } }); }
  });

  // Optional HTTPS support if key/cert provided
  let httpServer: http.Server | https.Server;
  const keyFile = process.env.HTTPS_KEY_FILE;
  const certFile = process.env.HTTPS_CERT_FILE;
  if (keyFile && certFile && fs.existsSync(keyFile) && fs.existsSync(certFile)) {
    try {
      const key = fs.readFileSync(keyFile);
      const cert = fs.readFileSync(certFile);
      httpServer = https.createServer({ key, cert }, api);
      console.log('Starting HTTPS server');
    } catch (e) {
      console.warn('HTTPS setup failed, falling back to HTTP:', (e as any)?.toString?.());
      httpServer = http.createServer(api);
    }
  } else {
    httpServer = http.createServer(api);
  }
  const io = new SocketIOServer(httpServer, { cors: { origin: '*' } });
  io.on('connection', socket => {
    socket.on('auth', (token: string) => {
      const payload = requireAuth('Bearer ' + token);
      if (!payload) {
        socket.emit('auth_error', 'invalid_token');
        socket.disconnect();
      } else {
        (socket as any).user = payload;
        socket.emit('auth_ok');
      }
    });
  });

  const PORT = process.env.PORT || 4000;
  httpServer.listen(PORT, () => console.log('API & WS listening on', PORT));

  return { api, httpServer, io };
}
