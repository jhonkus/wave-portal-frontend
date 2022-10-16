import React, { useEffect, useState, useCallback } from "react";
import { ethers } from "ethers";
import "./App.css";
import abi from "./utils/WavePortal.json";


const getEthereumObject = () => window.ethereum;

function App() {
  const [currentAccount, setCurrentAccount] = useState("");

  /**
   * Create a variable here that holds the contract address after you deploy!
   */
  const contractAddress = "0x1c37BE624c899c056e1d16bA367e145f22652dF8";

  /**
   * Create a variable here that references the abi content!
   */
  const contractABI = abi.abi;


  const wave = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());

        /*
        * Execute the actual wave from your smart contract
        */
         const waveTxn = await wavePortalContract.wave();
         console.log("Mining...", waveTxn.hash);
 
         await waveTxn.wait();
         console.log("Mined -- ", waveTxn.hash);
 
         count = await wavePortalContract.getTotalWaves();
         console.log("Retrieved total wave count...", count.toNumber());

      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  }

  /*
   * This function returns the first linked account found.
   * If there is no account linked, it will return null.
   */
  const findMetaMaskAccount = useCallback(async () => {
    try {
      const ethereum = getEthereumObject();

      /*
       * First make sure we have access to the Ethereum object.
       */
      if (!ethereum) {
        console.error("Make sure you have Metamask!");
        return null;
      }

      console.log("We have the Ethereum object", ethereum);
      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length > 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        if (account !== null) {
          setCurrentAccount(account);
        }
        // return account;
      } else {
        console.error("No authorized account found");
        // return null;
      }
    } catch (error) {
      console.error(error);
      return null;
    }
  }, []);

  const connectWallet = async () => {
    try {
      const ethereum = getEthereumObject();
      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.error(error);
    }
  };
  
  /*
   * The passed callback function will be run when the page loads.
   * More technically, when the App component "mounts".
   */
  useEffect(() => {
    findMetaMaskAccount().catch(console.error);
  }, [findMetaMaskAccount]);

  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">👋 Hello there!</div>

        <div className="bio">
          I am john and I worked on Ethereum Smart contract so that's pretty
          cool right? Connect your Ethereum wallet and wave at me!
        </div>

        <button className="waveButton" onClick={wave}>
          Wave at Me
        </button>

        {/*
         * If there is no currentAccount render this button
         */}
        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}

      </div>
    </div>
  );
}

export default App;
