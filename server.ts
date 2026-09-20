import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const PRODUCTION_CRYPTOBOT_TOKEN = '635195:AA8ZrofzsxEgReQqhpQdWg1J2aLdXYV8FSD';
const CRYPTO_PAY_BASE_URL = 'https://pay.crypt.bot/api';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'gta6-companion-server' });
  });

  // Crypto Pay: Create Invoice
  app.post('/api/cryptobot/createInvoice', async (req, res) => {
    try {
      const { asset = 'USDT', amount = '2.99', description = 'GTA 6 Leonida - Пожизненный VIP Pass', payload = '' } = req.body || {};

      const response = await fetch(`${CRYPTO_PAY_BASE_URL}/createInvoice`, {
        method: 'POST',
        headers: {
          'Crypto-Pay-API-TOKEN': PRODUCTION_CRYPTOBOT_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          asset,
          amount,
          description,
          payload
        })
      });

      const data = await response.json();
      res.status(response.status).json(data);
    } catch (err: any) {
      console.error('Server error creating invoice:', err);
      res.status(500).json({
        ok: false,
        error: {
          code: 500,
          name: 'INTERNAL_SERVER_ERROR',
          description: err?.message || 'Не удалось связаться со шлюзом Crypto Pay'
        }
      });
    }
  });

  // Crypto Pay: Get Invoices / Verify
  app.get('/api/cryptobot/getInvoices', async (req, res) => {
    try {
      const urlParams = new URLSearchParams();
      if (req.query.invoice_ids) {
        urlParams.set('invoice_ids', String(req.query.invoice_ids));
      }
      if (req.query.status) {
        urlParams.set('status', String(req.query.status));
      }
      if (req.query.count) {
        urlParams.set('count', String(req.query.count));
      }

      const queryString = urlParams.toString();
      const targetUrl = `${CRYPTO_PAY_BASE_URL}/getInvoices${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'Crypto-Pay-API-TOKEN': PRODUCTION_CRYPTOBOT_TOKEN
        }
      });

      const data = await response.json();
      res.status(response.status).json(data);
    } catch (err: any) {
      console.error('Server error fetching invoices:', err);
      res.status(500).json({
        ok: false,
        error: {
          code: 500,
          name: 'INTERNAL_SERVER_ERROR',
          description: err?.message || 'Не удалось связаться со шлюзом Crypto Pay'
        }
      });
    }
  });

  // Vite middleware in development vs static serving in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
