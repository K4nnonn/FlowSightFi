import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const config = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV as keyof typeof PlaidEnvironments] || PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID!,
      'PLAID-SECRET': process.env.PLAID_SECRET!,
    },
  },
});

const client = new PlaidApi(config);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action } = req.body;

    if (action === 'create_link_token') {
      const response = await client.linkTokenCreate({
        user: {
          client_user_id: 'user-' + Date.now(),
        },
        client_name: 'FlowSightFI',
        products: ['transactions', 'accounts'],
        country_codes: ['US'],
        language: 'en',
      });

      return res.json(response.data);
    }

    if (action === 'exchange_public_token') {
      const { public_token } = req.body;
      
      if (!public_token) {
        return res.status(400).json({ error: 'public_token is required' });
      }

      const response = await client.itemPublicTokenExchange({
        public_token,
      });

      const { error } = await supabase
        .from('plaid_data')
        .insert({
          user_id: 'test-user',
          access_token: response.data.access_token,
          item_id: response.data.item_id,
          data: response.data,
          created_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({ error: 'Failed to store data' });
      }

      return res.json({
        access_token: response.data.access_token,
        item_id: response.data.item_id,
      });
    }

    if (action === 'get_accounts') {
      const { access_token } = req.body;
      
      if (!access_token) {
        return res.status(400).json({ error: 'access_token is required' });
      }

      const response = await client.accountsGet({
        access_token,
      });

      return res.json(response.data);
    }

    if (action === 'get_transactions') {
      const { access_token, start_date, end_date } = req.body;
      
      if (!access_token) {
        return res.status(400).json({ error: 'access_token is required' });
      }

      const response = await client.transactionsGet({
        access_token,
        start_date: start_date || '2024-01-01',
        end_date: end_date || new Date().toISOString().split('T')[0],
      });

      return res.json(response.data);
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (error) {
    console.error('Plaid API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}