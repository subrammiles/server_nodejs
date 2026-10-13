import { Router } from 'express';

export const paymentsRouter = Router();

paymentsRouter.get('/balance', (req, res) => res.json({ balance: 100, currency: 'USD' }));
paymentsRouter.post('/withdraw', (req, res) => res.json({ withdrawn: req.body.amount, balance: 100 - req.body.amount }));
