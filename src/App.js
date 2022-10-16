import React, { useEffect, useState, useCallback } from "react";
import "./App.css";

const getEthereumObject = () => window.ethereum;

function App() {
  
  const [currentAccount, setCurrentAccount] = useState("");

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

        <button className="waveButton" onClick={null}>
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
