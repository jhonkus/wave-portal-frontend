import React, { useEffect, useState, useCallback } from "react";
import { ethers } from "ethers";
import "./App.css";
import abi from "./utils/WavePortal.json";
import { Spinner, Button, Image } from "react-bootstrap";
import Form from "react-bootstrap/Form";

const getEthereumObject = () => window.ethereum;

function App() {
  const [currentAccount, setCurrentAccount] = useState("");
  const [totalWave, setTotalWave] = useState(0);
  const [isMining, setIsMining] = useState(false);
  const [isRightNetwork, setIsRightNetwork] = useState(true);
  const [isConnectingToWallet, setIsConnectingToWallet] = useState(false);
  const [noWallet, setNoWallet] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  /*
   * All state property to store all waves
   */
  const [allWaves, setAllWaves] = useState([]);
  const [messageValue, setMessageValue] = useState("");

  function reverseArr(input) {
    var ret = new Array();
    for (var i = input.length - 1; i >= 0; i--) {
      ret.push(input[i]);
    }
    return ret;
  }

  /**
   * Create a variable here that holds the contract address after you deploy!
   */
  const contractAddress = "0x01CADD8c13487D0468f9B487CC60c3f174C67c69";

  /**
   * Create a variable here that references the abi content!
   */
  const contractABI = abi.abi;

  /*
   * Create a method that gets all waves from your contract
   */
  const getAllWaves = useCallback(async () => {
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
        const wavesCleaned = waves.map((wave) => {
          return {
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message,
          };
        });

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
  }, [contractABI]);

  const wave = async () => {
    if (messageValue.length === 0 || messageValue.length > 500) {
      console.log("No message inputed!");
      setErrorMsg("Please write something, even just 'Hi', max 500 character!");
      setIsError(true);

      return;
    }

    setErrorMsg("");
    setIsError(false);
    // console.log("Gif link:", inputValue);

    setIsError(false);
    setIsConnectingToWallet(true);

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

        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());

        /*
         * Execute the actual wave from your smart contract
         */
        const waveTxn = await wavePortalContract.wave(messageValue, {
          gasLimit: 500000,
        });
        setIsConnectingToWallet(false);
        setIsMining(true);
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
      setIsConnectingToWallet(false);
      console.log(error);
      setErrorMsg(
        "Process was fail or canceled!, if fail please try in next 5 minutes"
      );
      setIsError(true);
    } finally {
      setIsMining(false);
      setMessageValue("");
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
        setNoWallet(true);

        return null;
      }

      setNoWallet(false);

      console.log("We have the Ethereum object", ethereum);
      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length > 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        if (account !== null) {
          setCurrentAccount(account);
          getAllWaves();
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
  }, [getAllWaves]);

  const connectWallet = async () => {
    try {
      setIsConnectingToWallet(true);
      const ethereum = getEthereumObject();
      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      console.log("Connected", accounts[0]);

      if (accounts.length > 0) {
        let chainId = await ethereum.request({ method: "eth_chainId" });
        console.log("Connected to chain " + chainId);

        // String, hex code of the chainId of the Rinkebey test network
        const goerliChainId = "0x5";
        if (chainId !== goerliChainId) {
          setIsRightNetwork(false);
          // alert("You are not connected to the Goerli Test Network!");
        } else {
          setIsRightNetwork(true);
          console.log("You are connected to goerli network!");
        }
      }
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsConnectingToWallet(false);
    }
  };

  /**
   * Listen in for emitter events!
   */
  useEffect(() => {
    let wavePortalContract;

    const onNewWave = (from, timestamp, message) => {
      console.log("NewWave", from, timestamp, message);
      setAllWaves((prevState) => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
      ]);
    };

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      wavePortalContract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );
      wavePortalContract.on("NewWave", onNewWave);
    }

    return () => {
      if (wavePortalContract) {
        wavePortalContract.off("NewWave", onNewWave);
      }
    };
  }, [contractABI]);

  const onMessageChange = (event) => {
    const { value } = event.target;
    console.log("Msg: ", value);
    setMessageValue(value);

    console.log("Msg: ", messageValue);
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
        {noWallet && (
          <div className="warning">
            Sorry, we cannot find Metamask wallet installed ! Please install it
            first,{" "}
            <a href="https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn">
              click here
            </a>
          </div>
        )}

        {!isRightNetwork && currentAccount && (
          <div className="warning">
            Your walet not conecting to Goerli network, please switch to Goerli
            network and try to connect again!
          </div>
        )}
        <div className="header">👋 Hello there!</div>

        <div className="bio">
          <Image
            src="https://avatars.githubusercontent.com/u/8806824?v=4"
            style={{ width: "70px", height: "70px", margin: "10px" }}
            align="left"
            alt="john image"
            roundedCircle
          />
          I am a developer and also write articles on medium.com,  <a href="https://putukusuma.medium.com/" target="_new">here is my articles.</a> Currently I'm looking for a blockchain job! Connect your Ethereum wallet to the <b>Goerli</b> network
 and contact me if you have any blockchain remote job be it full time or part time!
 or you can leave a message just to say hi to me.
        </div>

        {isRightNetwork &&
          !isConnectingToWallet &&
          !isMining &&
          currentAccount && (
            <>
              <Form
                onSubmit={(event) => {
                  event.preventDefault();
                  wave();
                }}
              >
                <Form.Group
                  className="mb-3"
                  controlId="exampleForm.ControlTextarea1"
                >
                  <Form.Label>Message</Form.Label>
                  <Form.Control
                    as="textarea"
                    onChange={onMessageChange}
                    value={messageValue}
                    rows={5}
                  />
                </Form.Group>

                {isError && (
                  <div
                    style={{
                      textAlign: "left",
                      marginBottom: "20px",
                      color: "red",
                    }}
                  >
                    {errorMsg}
                  </div>
                )}

                <button type="submit" className="cta-button submit-msg-button">
                  Send message
                </button>
                
              </Form>

              {/* <Button className="waveButton" variant="success" onClick={wave}>
              Wave at Me
            </Button> */}
            </>
          )}

        {isMining && (
          <div style={{ color: "blue" }}>
            <Spinner animation="grow" size="sm" /> Wait mining ...{" "}
          </div>
        )}

        {!isMining && totalWave > 0 && <div>Total wave count: {totalWave}</div>}
        {/*
         * If there is no currentAccount render this button
         */}
        {(!currentAccount || !isRightNetwork) && (
          <>
            <Button variant="outline-primary" onClick={connectWallet}>
              Connect Wallet
            </Button>
          </>
        )}

        {isConnectingToWallet && (
          <div style={{ color: "blue" }}>
            {" "}
            <Spinner animation="border" size="sm" /> Waiting confirmation,
            please see your wallet and confirm the transaction!
          </div>
        )}

        {/* {allWaves.reverse()} */}

        {reverseArr(allWaves)
          .slice(0, 200)
          .map((wave, index) => {
            return (
              <div
                key={index}
                style={{
                  backgroundColor: "OldLace",
                  marginTop: "16px",
                  padding: "8px",
                  fontSize: "0.8em",
                }}
              >
                <div>No: {allWaves.length - index}</div>
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
