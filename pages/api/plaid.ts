import { NextApiRequest, NextApiResponse } from 'next';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

const configuration = new Configuration({
  basePath: PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

const client = new PlaidApi(configuration);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { action } = req.body;

    try {
      if (action === 'create_link_token') {
        const response = await client.linkTokenCreate({
          user: {
            client_user_id: 'user-id',
          },
          client_name: 'FlowSightFI',
          products: ['transactions'],
          country_codes: ['US'],
          language: 'en',
        } as any);
        
        res.status(200).json({ link_token: response.data.link_token });
      } else if (action === 'exchange_public_token') {
        const { public_token } = req.body;
        const response = await client.itemPublicTokenExchange({
          public_token: public_token,
        });
        
        res.status(200).json({ access_token: response.data.access_token });
      } else if (action === 'get_accounts') {
        const { access_token } = req.body;
        const response = await client.accountsGet({
          access_token: access_token,
        });
        
        res.status(200).json({ accounts: response.data.accounts });
      } else if (action === 'get_transactions') {
        const { access_token, start_date, end_date } = req.body;
        const response = await client.transactionsGet({
          access_token: access_token,
          start_date: start_date,
          end_date: end_date,
        });
        
        res.status(200).json({ 
          accounts: response.data.accounts,
          transactions: response.data.transactions,
          total_transactions: response.data.total_transactions,
        });
      } else {
        res.status(400).json({ error: 'Invalid action' });
      }
    } catch (error) {
      console.error('Plaid API error:', error);
      res.status(500).json({ error: 'Failed to process request' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
