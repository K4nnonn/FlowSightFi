import { useEffect, useState } from 'react';
import Head from 'next/head';

declare global {
  interface Window {
    Plaid: any;
  }
}

interface PlaidData {
  accounts?: any[];
  transactions?: any[];
}

export default function Home() {
  const [linkToken, setLinkToken] = useState(null);
  const [plaidHandler, setPlaidHandler] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [plaidData, setPlaidData] = useState({});
  const [loading, setLoading] = useState(false);

  // Fetch link token from backend
  useEffect(() => {
    const fetchLinkToken = async () => {
      try {
        const response = await fetch('/api/plaid', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'create_link_token' }),
        });
        const data = await response.json();
        setLinkToken(data.link_token);
      } catch (error) {
        console.error('Error fetching link token:', error);
      }
    };

    fetchLinkToken();
  }, []);

  // Load Plaid Link script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js';
    script.onload = () => console.log('Plaid script loaded');
    script.onerror = () => console.error('Failed to load Plaid script');
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // Initialize Plaid Link
  useEffect(() => {
    if (linkToken && typeof window !== 'undefined' && window.Plaid) {
      const handler = window.Plaid.create({
        token: linkToken,
        onSuccess: async (public_token: string, metadata: any) => {
          setLoading(true);
          try {
            const response = await fetch('/api/plaid', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'exchange_public_token',
                public_token,
              }),
            });
            const data = await response.json();
            setAccessToken(data.access_token);
            setIsConnected(true);
            console.log('Connected successfully:', data);
          } catch (error) {
            console.error('Error exchanging token:', error);
          } finally {
            setLoading(false);
          }
        },
        onExit: (err: any, metadata: any) => {
          if (err) {
            console.error('Plaid Link exit error:', err);
          }
        },
      });
      setPlaidHandler(handler);
    }
  }, [linkToken]);

  const fetchAccountData = async () => {
    if (!accessToken) return;
    
    setLoading(true);
    try {
      const [accountsResponse, transactionsResponse] = await Promise.all([
        fetch('/api/plaid', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'get_accounts',
            access_token: accessToken,
          }),
        }),
        fetch('/api/plaid', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'get_transactions',
            access_token: accessToken,
          }),
        }),
      ]);

      const accountsData = await accountsResponse.json();
      const transactionsData = await transactionsResponse.json();

      setPlaidData({
        accounts: accountsData.accounts,
        transactions: transactionsData.transactions,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      
FlowSightFI - Smart Financial Insights





          {/* Header */}
          

              FlowSightFI


              Connect your bank accounts and unlock AI-powered financial insights to optimize your spending and savings.
            


          {/* Main Content */}
          
            {!isConnected ? (
              







                    Connect Your Bank Account
                  

                    Securely link your bank account to start analyzing your financial data with AI-powered insights.
                  

 plaidHandler?.open()}
                  disabled={!plaidHandler || loading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-colors duration-200"
                >
                  {loading ? 'Connecting...' : 'Connect Bank Account'}
                

🔒 Your data is encrypted and secure
🏦 Works with 11,000+ banks
⚡ Real-time transaction monitoring


            ) : (
              



                      Account Connected! 🎉
                    

                      {loading ? 'Loading...' : 'Fetch Data'}
                    


                  {plaidData.accounts && (
                    
Your Accounts

                        {plaidData.accounts.map((account: any) => (
                          


{account.name}
{account.subtype}



                                  ${account.balances.current?.toLocaleString() || 'N/A'}
                                
Current Balance



                        ))}
                      

                  )}

                  {plaidData.transactions && (
                    
Recent Transactions

                        {plaidData.transactions.slice(0, 10).map((transaction: any) => (
                          


{transaction.name}
{transaction.date}

 0 ? 'text-red-600' : 'text-green-600'}`}>
                                ${Math.abs(transaction.amount).toFixed(2)}
                              


                        ))}
                      

                  )}
                

            )}
          

          {/* Footer */}
          
© 2025 FlowSightFI. All rights reserved.

Privacy Policy
Terms of Service
Data Retention Policy




    
  );
}