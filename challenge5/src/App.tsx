// importfunctionalities
import React, { Fragment } from 'react';
import logo from './logo.svg';
import './App.css';
import { 
  PublicKey, 
  Transaction, 
  Keypair, 
  Connection, 
  clusterApiUrl, 
  LAMPORTS_PER_SOL, 
  SystemProgram, 
  sendAndConfirmTransaction 
} from '@solana/web3.js';
import { useEffect, useState } from 'react';

// create types
type DisplayEncoding = 'utf8' | 'hex';

type PhantomEvent = 'disconnect' | 'connect' | 'accountChanged';
type PhantomRequestMethod = 'connect' | 'disconnect' | 'signTransaction' | 'signAllTransactions' | 'signMessage';

interface ConnectOpts {
  onlyIfTrusted: boolean;
}

// create a provider interface (hint: think of this as an object) to store the Phantom Provider
interface PhantomProvider {
  publicKey: PublicKey | null;
  isConnected: boolean | null;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
  signMessage: (message: Uint8Array | string, display?: DisplayEncoding) => Promise<any>;
  connect: (opts?: Partial<ConnectOpts>) => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
  on: (event: PhantomEvent, handler: (args: any) => void) => void;
  request: (method: PhantomRequestMethod, params: any) => Promise<unknown>;
}

/**
 * @description gets Phantom provider, if it exists
 */
const getProvider = (): PhantomProvider | undefined => {
  if ('solana' in window) {
    // @ts-ignore
    const provider = window.solana as any;
    if (provider.isPhantom) return provider as PhantomProvider;
  }
};

window.Buffer = window.Buffer || require('buffer').Buffer;

function App() {
  // create state variable for the provider
  const [provider, setProvider] = useState<PhantomProvider | undefined>(undefined);

  // create state variable for the wallet key
  const [walletKey, setWalletKey] = useState<PhantomProvider | undefined>(undefined);

  //generated wallet key
  const [secKey, setSecKey] = useState<any>();
  const [fromKey, setpubKey] = useState('');
  //wallet balance
  const [balance, setBalance] = useState(0);
  const [signature, setSignature] = useState('');

  // this is the function that runs whenever the component updates (e.g. render, refresh)
  useEffect(() => {
    const provider = getProvider();

    // if the phantom provider exists, set this as the provider
    if (provider) setProvider(provider);
    else setProvider(undefined);
  }, []);

  /**
   * @description prompts user to connect wallet if it exists.
   * This function is called when the connect wallet button is clicked
   */

  //Connect Wallet
  const connectWallet = async () => {
    // @ts-ignore
    const { solana } = window;

    // checks if phantom wallet exists
    if (solana) {
      try {
        // connects wallet and returns response which includes the wallet public key
        const response = await solana.connect();
        console.log('wallet account ', response.publicKey.toString());
        // update walletKey to be the public key
        setWalletKey(response.publicKey.toString());
      } catch (err) {
        // { code: 4001, message: 'User rejected the request.' }
      }
    }
  };

  //Create an account
  const createAccount = async () => {
    const newPair = Keypair.generate();
    const fromKey = newPair.publicKey.toString();
    const secKey = newPair.secretKey;
    setSecKey(secKey);
    setpubKey(fromKey);

    //airdrop Sol
    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
    const fromAirDropSignature = await connection.requestAirdrop(
        new PublicKey(fromKey),
        2 * LAMPORTS_PER_SOL
    );
    let latestBlockHash = await connection.getLatestBlockhash();
    // to check for transaction expiration
    await connection.confirmTransaction({
      blockhash: latestBlockHash.blockhash,
      lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      signature: fromAirDropSignature,
    });

  //Update Balance
  const getWalletBalance = async () => {
    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
    const walletBalance = await connection.getBalance(new PublicKey(fromKey));
    setBalance(walletBalance);
  };
    await getWalletBalance();
}

  //Transfer Sol
  const transferSol = async () => {
    // @ts-ignore
    const { solana } = window;

    // checks if phantom wallet exists
    if (solana) {
      try {
        // connects wallet and returns response which includes the wallet public key
        const response = await solana.connect();
        const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: new PublicKey(fromKey),
            toPubkey: response.publicKey,
            lamports: 2 * LAMPORTS_PER_SOL,
          })
        );
        // Sign transaction
        const signature = await sendAndConfirmTransaction(connection, transaction, [Keypair.fromSecretKey(secKey)]);
        setSignature(signature);
      } catch (err) {
        // { code: 4001, message: 'User rejected the request.' }
        console.log('Insufficient Balance');
      }
    }
  };
// HTML code for the app
  return (
    <div className="App">
      <header className="App-header">
        <h2>Challenge 5</h2>
      </header>    
      {provider && !walletKey && (
          <button
            style={{
              fontSize: "16px",
              padding: "15px",
              fontWeight: "bold",
              borderRadius: "5px",
            }}
            onClick={createAccount}
          >
            Create Solana Wallet
          </button>
        )}
        <p> Wallet created and airdrop complete</p>
      {provider && !walletKey && (
          <button
            style={{
              fontSize: "16px",
              padding: "15px",
              fontWeight: "bold",
              borderRadius: "5px",
            }}
            onClick={connectWallet}
          >
            Connect Wallet
          </button>
        )}
        {provider && walletKey && 
        <>
        <p>Connected account: {!walletKey.toString()}</p> 
      
          <button
            style={{
              fontSize: "16px",
              padding: "15px",
              fontWeight: "bold",
              borderRadius: "5px",
            }}
            onClick={transferSol}
          >
            Transfer SOL
          </button>
          </>
        }
      
        {!provider && (
          <p>
            No provider found. Install{" "}
            <a href="https://phantom.app/">Phantom Browser extension</a>
          </p>
        )}
      </div>
    );
}

export default App;