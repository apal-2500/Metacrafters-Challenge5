// import react functionalities
import React from 'react';
import logo from './logo.svg';
import './App.css';
import {
  Connection,
  PublicKey,
  clusterApiUrl,
  Keypair,
  LAMPORTS_PER_SOL,
  Transaction,
  sendAndConfirmTransaction,
  SystemProgram,
} from "@solana/web3.js";
import {useEffect , useState } from "react";

// create types
type DisplayEncoding = "utf8" | "hex";

type PhantomEvent = "disconnect" | "connect" | "accountChanged";
type PhantomRequestMethod =
  | "connect"
  | "disconnect"
  | "signTransaction"
  | "signAllTransactions"
  | "signMessage";

interface ConnectOpts {
  onlyIfTrusted: boolean;
}

// create a provider interface (hint: think of this as an object) to store the Phantom Provider
interface PhantomProvider {
  publicKey: PublicKey | null;
  isConnected: boolean | null;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
  signMessage: (
    message: Uint8Array | string,
    display?: DisplayEncoding
  ) => Promise<any>;
  connect: (opts?: Partial<ConnectOpts>) => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
  on: (event: PhantomEvent, handler: (args: any) => void) => void;
  request: (method: PhantomRequestMethod, params: any) => Promise<unknown>;
}

/**
  * @description gets Phantom provider, if it exists
  */
  const getProvider = (): PhantomProvider | undefined => {
    if ("solana" in window) {
      // @ts-ignore
      const provider = window.solana as any;
      if (provider.isPhantom) return provider as PhantomProvider;
  }
};

//Step 1: "Create an account"
function App() {
  // create state variable for the provider
  const [provider, setProvider] = useState<PhantomProvider | undefined>(
    undefined
  );
  
  //create state variable for generated keypair
  var [newPair, setNewPair] = useState<Keypair | undefined>(undefined);
  var [step2PKey, setstep2PKey] = useState('');
  var newPublicKeyStr;
  var step1pubKey;  
  // create state variable for the wallet key
  const [walletKey, setWalletKey] = useState<PhantomProvider | undefined>(
    undefined
    );
  
  // this is the function that runs whenever the component updates (e.g. render, refresh)
  useEffect(() => {
        const provider = getProvider();
  
        // if the phantom provider exists, set this as the provider
        if (provider) setProvider(provider);
        else setProvider(undefined);
  }, []);

  const createWallet = async () =>{
    //@ts-ignore
    const { solana } = window;
  
  // Create a new keypair
    const step1kPair = new Keypair();

  // Exact the public key from the keypair
    const step1Key = new PublicKey(step1kPair.publicKey).toString();
    step1pubKey = step1Key
    setNewPair(step1kPair);
    console.log("Public Key of the generated Step 1 keypair", step1kPair);


    const airDropSol = async () => {
        // Connect to the Devnet
        const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
        // Request airdrop of 2 SOL to the wallet
        console.log("Airdropping some SOL to Step 1 wallet!");
        const fromAirDropSignature = await connection.requestAirdrop(
            new PublicKey(step1kPair.publicKey),
            2 * LAMPORTS_PER_SOL
        );
        // Latest blockhash (unique identifer of the block) of the cluster
        let latestBlockHash = await connection.getLatestBlockhash();

        // Confirm transaction using the last valid block height (refers to its time)
        // to check for transaction expiration
        await connection.confirmTransaction({
            blockhash: latestBlockHash.blockhash,
            lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
            signature: fromAirDropSignature
        });

        console.log("Airdrop completed Step 1 Wallet");

        //Get balance for Step 1:
        let step1Balance = await connection.getBalance(new PublicKey(step1kPair.publicKey));
        console.log("Step 1 Balance:", step1Balance/LAMPORTS_PER_SOL)
    };
  

  //step 2: Connect to wallet:
    
//prompts user to connect wallet if it exists.
//This function is called when the connect wallet button is clicked
  const connectWallet = async () => {
    // @ts-ignore
    const { solana } = window;

  // checks if phantom wallet exists
    if (solana) {
      try {
// connects wallet and returns response which includes the wallet public key
        const response = await solana.connect();
        setstep2PKey(response.publicKey)
        console.log('Step 2 wallet account ', response.publicKey.toString());
// update walletKey to be the public key
        setWalletKey(response.publicKey.toString());
      } catch (err) {
    // { code: 4001, message: 'User rejected the request.' }
      }
    }
  };

//Step 3: Transfer Sol from Step 1 account to Step 2 account:
  const transferSol = async() => {
    //@ts-ignore
    const { solana } = window;

    // check for phantom wallet
    if (solana) {
      const step2Wallet = await solana.connect();
      const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
      var transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: step1kPair.publicKey,
          toPubkey: step2Wallet.publicKey,
          lamports: LAMPORTS_PER_SOL / 100
        })
      );
      //Sign transaction
      console.log(step1kPair)
        var signature = await sendAndConfirmTransaction(
          connection,
          transaction,
          [step1kPair]
        );
        console.log('Signature is ', signature);
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
            onClick={createWallet}
          >
            Create Solana Wallet
          </button>
        )}

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
        {provider && walletKey && <p>Connected account: {!walletKey.toString()}</p> }

      {provider && !walletKey && (
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
        )}
        
        {!provider && (
          <p>
            No provider found. Install{" "}
            <a href="https://phantom.app/">Phantom Browser extension</a>
          </p>
        )}
      </div>
    );
  };
}

export default App;