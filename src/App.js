import React, { useEffect, useState } from 'react';
import twitterLogo from './assets/twitter-logo.svg';
import './App.css';
import myEpicGame from './utils/MyEpicGame.json';
import SelectCharacter from './Components/SelectCharacter';
import Arena from './Components/Arena';
import LoadingIndicator from './Components/LoadingIndicator';

import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, transformCharacterData } from './constants';

// Constants
const TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const App = () => {
    /**
     *  Just a state variable we use to store our user's public wallet.
     */
    const [currentAccount, setCurrentAccount] = useState(null);
    const [characterNFT, setCharacterNFT] = useState(null);

    const [isLoading, setIsLoading] = useState(false);
    /**
     * Create new action that will run on component Load
     */
    // Actions
    const checkIfWalletIsConnected = async () => {
        try {
            const { ethereum } = window;

            if (!ethereum) {
                console.log('Make sure you have MetaMask!');
                /**
                 *  set is loading here because we use return in the next line
                 */
                setIsLoading(false);
                return;
            } else {
                console.log('We have the ethereum object', ethereum);

                /**
                 *  Check if we're authorized to access user's wallet
                 */
                const accounts = await ethereum.request({ method: 'eth_accounts' });

                /**
                 *  User can have multiple authorized accounts, we grab the first one if it's there
                 */
                if (accounts.length !== 0) {
                    const account = accounts[0];
                    console.log('Found an authorized account:', account);
                    setCurrentAccount(account);
                } else {
                    console.log('No authorized account found.');
                }
            }
        } catch (error) {
            console.log(error);
        }
        /**
         * release the state property after all the function logic
         */
        setIsLoading(false);
    };

    const renderContent = () => {
        /**
         *  If the app is currently loading, render out LoadingIndicator
         */
        if (isLoading) {
            return <LoadingIndicator />
        }

        /**
         *  If user has not yet connected to app, show connect to wallet button
         */
        if (!currentAccount) {
            return (
                <div className="connect-wallet-container">
                    <img 
                        src="https://64.media.tumblr.com/c2f7a611402f96abaae2390248c77009/tumblr_nz2l9budf21ujtcw4o1_500.gifv"
                        alt="One Punch Man Gif"
                    />
                    <button
                        className="cta-button connect-wallet-button"
                        onClick={connectWalletAction}
                    >
                        Connnect Wallet To Get Started
                    </button>
                </div>
            );
            /**
             * If user has connected to app AND does not have a character NFT, show SelectCharacter component
             */
        } else if (currentAccount && !characterNFT) {
            return <SelectCharacter setCharacterNFT={setCharacterNFT} />
        } else if (currentAccount && characterNFT) {
            return (
                <Arena characterNFT={characterNFT} setCharacterNFT={setCharacterNFT} />
            );
        }
    };


    /**
     *  Connect wallet
     */
    const connectWalletAction = async () => {
        try {
            const { ethereum } = window;

            if (!ethereum) {
                alert('Get MetaMask');
                return;
            }

            /**
             *  Fancy method to request access to account
             */
            const accounts = await ethereum.request({
                method: 'eth_requestAccounts',
            });

            /**
             *  Prints out public address once we authorize Metamask.
             */
            console.log('Connected', accounts[0]);
            setCurrentAccount(accounts[0]);
        } catch (error) {
            console.log(error)
        }
    };

    /**
     * This runs our function when the page loads.
     */
    useEffect(() => {
        /**
         *  Anytime componenet mounts, immediately set Loading state
         */
        setIsLoading(true);
        checkIfWalletIsConnected();
    }, []);

    useEffect(() => {
        /**
          *  The function we call that interacts with our smart contract
          */
        const fetchNFTMetadata = async () => {
    console.log('Checking for Character NFT on address:', currentAccount);

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const gameContract = new ethers.Contract(
      CONTRACT_ADDRESS,
      myEpicGame.abi,
      signer
    );

    const txn = await gameContract.checkIfUserHasNFT();
    if (txn.name) {
      console.log('User has character NFT');
      setCharacterNFT(transformCharacterData(txn));
    } else {
      console.log('No character NFT found');
    }
    /**
     *  Once fetching is done, set Loading state to false
     */
    setIsLoading(false);
  };

  /*
   * We only want to run this, if we have a connected wallet
   */
  if (currentAccount) {
    console.log('CurrentAccount:', currentAccount);
    fetchNFTMetadata();
  }
}, [currentAccount]);


  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text">👊🏾 Saikyō Hero 👊🏾</p>
          <p className="sub-text">Team up to beat the Strongest Hero</p>
           {renderContent()}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built with @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;