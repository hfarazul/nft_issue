/* eslint-disable @typescript-eslint/no-unused-vars */
import "./Navbar.scss";
import React from "react";
import { useContext, useState } from "react";
import { Link } from "react-router-dom";
// import { Banana } from "../../sdk/BananaProvider";
import { Banana } from "@rize-labs/banana-wallet-sdk/src/BananaProvider"
import { useEffect } from "react";
import * as buffer from "buffer";
import { BigNumberish, ethers } from "ethers";
import { BallTriangle } from "react-loader-spinner";
import { Chains } from "@rize-labs/banana-wallet-sdk/src/Constants";
import { SignerContext } from '../../context/signerProvider'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import { FaRegCopy } from 'react-icons/fa'
import toast, { Toaster } from "react-hot-toast";

const Navbar = () => {

  const [scwAddress, setSCWAddress] = useState("");
  const [load, setLoad] = useState(false);

  // let nullBanana = new Banana(Chains.optimismTestnet, 'https://opt-goerli.g.alchemy.com/v2/Q37EPFzF1O8kJt4oTob4ytwuUFTW0Gas');

 let nullBanana = new Banana(Chains.mumbai , 'https://polygon-mumbai.g.alchemy.com/v2/cNkdRWeB8oylSQJSA2V3Xev2PYh5YGr4');

  const [banana, setbanana] = useState(nullBanana)
  const signerContext = useContext(SignerContext);
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [userIdentifier, setUserIdentifier] = useState('');
  const [walletName, setWalletName] = useState('');

  const deployBanana = async () => {
    const bananaInstance = signerContext.initSigner()
    console.log(" this is instance foremd ", bananaInstance);
    setbanana(bananaInstance);
    try {
      console.log("Clicked !!");
      setLoad(true);
      let walletName = bananaInstance.getWalletName();
      setWalletName(walletName);
      console.log(walletName)
      let SCWAddress;
      console.log(" this is uername idenfitier ", userIdentifier)

      if(userIdentifier === '') {
        SCWAddress = (await bananaInstance.connectWallet(walletName)).address
        console.log('from connect walle ', SCWAddress);
      } else {
        walletName = userIdentifier;
        if(walletName) {
          SCWAddress = (await bananaInstance.createWallet(walletName)).address
          // getWalletAddress(walletName);
          console.log("SCW addrss", SCWAddress)
        } else {
          // dev need to ask for user 
          const walletName = userIdentifier; //

          if(walletName === '') {
            toast.success('please enter wallet identifier ');
            return;
          }
          SCWAddress = (await bananaInstance.connectWallet(walletName)).address
          console.log("controlled reach here!!! ");
          setWalletName(walletName);
          toast.success("Successfully deployed wallet !!");
        }
      }
      setSCWAddress(SCWAddress);
      setLoad(false);
    } catch (err) {
      console.log(err);
    }
  };
  
  return (
    <>
    <Toaster />
      <div className="navbar">
        <div className="brand-name">
          <Link to ="/" style={{textDecoration: 'none'}}>
          <span className="brand-name-blue">Stake !!</span>
          </Link>
        </div>
        <ul className="nav-items">
          <li>
            <BallTriangle
              height={50}
              width={50}
              radius={5}
              color="#D2691E"
              ariaLabel="ball-triangle-loading"
              visible={load}
            />
          </li>
          <li>
            {scwAddress === "" ? (
              <button className="scw-btn" onClick={() => deployBanana()}>
                Connect SCW
              </button>
            ) : (
              <p>
                SCW:
                {scwAddress.slice(0, 7) + "...." + scwAddress.slice(37, 42)}
                <CopyToClipboard text={scwAddress} onCopy={() => toast.success('Address copied')}>
                <FaRegCopy style={{ marginLeft: "10px" }} />
              </CopyToClipboard>
              </p>
            )}
            </li>
            <li>
              {!!walletName ? <button className="scw-btn"> {walletName} </button> : 
            <input type={"text"} className="user-identifier-input" onChange={(e) => setUserIdentifier(e.target.value) } placeholder="wallet name" /> }
          </li>
        </ul>
      </div>
    </>
  );
};

export default Navbar;
