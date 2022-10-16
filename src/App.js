import React, { useEffect, useState, useCallback } from "react";
import { ethers } from "ethers";
import "./App.css";
import abi from "./utils/WavePortal.json";
import Spinner from "react-bootstrap/Spinner";

const getEthereumObject = () => window.ethereum;

function App() {
  const [currentAccount, setCurrentAccount] = useState("");
  const [totalWave, setTotalWave] = useState(0);
  const [isMining, setIsMining] = useState(false);
  /*
   * All state property to store all waves
   */
  const [allWaves, setAllWaves] = useState([]);

  /**
   * Create a variable here that holds the contract address after you deploy!
   */
  const contractAddress = "0xe22b34533E99F37e6CdE6DDC9DcfbC20CdaA754d";

  /**
   * Create a variable here that references the abi content!
   */
  const contractABI = abi.abi;

  /*
   * Create a method that gets all waves from your contract
   */
  const getAllWaves = async () => {
    console.log("== getAllWaves==");
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        /*
         * Call the getAllWaves method from your Smart Contract
         */
        const waves = await wavePortalContract.getAllWaves();

        /*
         * We only need address, timestamp, and message in our UI so let's
         * pick those out
         */
        let wavesCleaned = [];
        waves.forEach((wave) => {
          wavesCleaned.push({
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message,
          });
        });
        console.log("==wavesCleaned: ",wavesCleaned);
        /*
         * Store our data in React State
         */
        setAllWaves(wavesCleaned);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const wave = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        setIsMining(true);
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());

        /*
         * Execute the actual wave from your smart contract
         */
        const waveTxn = await wavePortalContract.wave("This is a message");
        console.log("Mining...", waveTxn.hash);

        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);

        count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());

        setTotalWave(count.toNumber());
        getAllWaves();
        setIsMining(false);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      setIsMining(false);
      console.log(error);
    }
  };

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

        {isMining && (
          <div>
            <Spinner animation="grow" size="sm" /> Wait mining ...{" "}
          </div>
        )}

        {!isMining && totalWave > 0 && <div>Total wave count: {totalWave}</div>}
        {/*
         * If there is no currentAccount render this button
         */}
        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}

        {allWaves.map((wave, index) => {
          return (
            <div
              key={index}
              style={{
                backgroundColor: "OldLace",
                marginTop: "16px",
                padding: "8px",
              }}
            >
              <div>No: {index + 1}</div>
              <div>Address: {wave.address}</div>
              <div>Time: {wave.timestamp.toString()}</div>
              <div>Message: {wave.message}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;
