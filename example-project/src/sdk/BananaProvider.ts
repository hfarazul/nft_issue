import { BytesLike, ethers } from "ethers";
import { EntryPoint__factory, UserOperationStruct } from "@account-abstraction/contracts";
import { MyWalletDeployer__factory } from "./types/factories/MyWalletDeployer__factory"; // ---
import { MyPaymasterApi } from "./MyPayMasterApi";
import { MyWalletApi } from "./MyWalletApi";
import { HttpRpcClient } from "@account-abstraction/sdk/dist/src/HttpRpcClient";
import { ERC4337EthersProvider } from "@account-abstraction/sdk";
import { MyTouchIdWallet__factory } from "./types/factories/MyTouchIdWallet__factory"; // --
import { getGasFee } from "./utils/GetGasFee";
import getClientConfigInfo, { Chains } from "./Constants";
import { registerFingerprint } from "./WebAuthnContext";
import { BananaSigner } from "./BananaSigner";
import { hexConcat } from "ethers/lib/utils.js";
import { MyWalletDeployer } from "./types";
import constructUserOpWithInitCode from "./initUserOp";
import { BananaCookie } from "./BananaCookie";
import {
  setUserCredentials,
  getUserCredentials,
  checkInitCodeStatus,
  checkIsWalletNameExist
} from "./Controller";
import {
  PublicKey,
  ClientConfig,
  UserCredentialObject,
} from "./interfaces/Banana.interface";

const addresses = {
  "Verifier": "0x9Bd0782Cc9C70a57aCAc290077a7e0fc8A4E7C4B",
  "OTPFactory": "0x2A671dCA3fFD012116f2f31B694E66388Cc4CEcF",
  "MyWalletDeployer": "0xe6a89A44d41d0C91eCD4E85367cca622A8000457",
  "Greeter": "0x4221F0B190EeE400FFB8610E4eEc1481dc3E121c",
  "UniswapV2": "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
  "Staking": "0x1CA35dB18E7f594864b703107FeaE4a24974FCb5",
  "Elliptic": "0xa5d0D7e820F6f8A0DC68722e41801a1dcfAE2403"
};

export class Banana {
  Provider: ClientConfig;
  SCWContract!: ethers.Contract;
  accountApi!: MyWalletApi;
  httpRpcClient!: HttpRpcClient;
  publicKey!: PublicKey;
  bananaSigner!: BananaSigner;
  jsonRpcProvider!: ethers.providers.JsonRpcProvider;
  walletAddress!: string;
  aaProvider!: ERC4337EthersProvider;
  cookieObject!: UserCredentialObject;
  cookie: BananaCookie;
  walletIdentifier!: string;
  jsonRpcProviderUrl: string;

  constructor(readonly chain: Chains, readonly jsonRpcProvideurl: string) {
    this.Provider = getClientConfigInfo(chain);
    this.jsonRpcProviderUrl = jsonRpcProvideurl;
    this.jsonRpcProvider = new ethers.providers.JsonRpcProvider(
      this.jsonRpcProviderUrl
    );
    this.cookie = new BananaCookie();
  }

  private createBananaSignerInstance = () => {
    this.bananaSigner = new BananaSigner(this.jsonRpcProvider, this.publicKey);
  };

  private initiateSigner = async (walletIdentifier: string) => {
    const walletName = this.cookie.getCookie("bananaUser");
    if (!!walletName) {
      this.cookieObject = this.cookie.getCookie(walletName);
      if (this.cookieObject) {
        const q0Value = this.cookieObject.q0;
        const q1Value = this.cookieObject.q1;
        const encodedId = this.cookieObject.encodedId;
        this.publicKey = {
          q0: q0Value,
          q1: q1Value,
          encodedId: encodedId,
        };
        this.walletIdentifier = walletName;
        this.createBananaSignerInstance();
        return;
      } else {
        const walletCreds = await getUserCredentials(walletIdentifier);
        // get and check cred here
        // else of below if should not be triggered as we are already getting wallet name from cookie means the creds are initialized
        if (!!walletCreds) {
          this.cookieObject = walletCreds;
          const q0Value = this.cookieObject.q0;
          const q1Value = this.cookieObject.q1;
          const encodedId = this.cookieObject.encodedId;
          this.publicKey = {
            q0: q0Value,
            q1: q1Value,
            encodedId: encodedId,
          };
          this.walletIdentifier = walletName;
          this.createBananaSignerInstance();
          return;
        }
      }
    } else {
      // when nothing in cookie or cred is there but with no username in that case fetching key from user provided walletname
      const walletCreds = await getUserCredentials(walletIdentifier);
      if (!!walletCreds) {
        this.cookieObject = walletCreds;
        const q0Value = this.cookieObject.q0;
        const q1Value = this.cookieObject.q1;
        const encodedId = this.cookieObject.encodedId;
        this.publicKey = {
          q0: q0Value,
          q1: q1Value,
          encodedId: encodedId,
        };
        this.walletIdentifier = walletIdentifier;
        this.createBananaSignerInstance();
        return;
      }
      // he must have sent the username for registering wallet
    }
    this.walletIdentifier = walletIdentifier;
    this.publicKey = await registerFingerprint();
    this.bananaSigner = new BananaSigner(this.jsonRpcProvider, this.publicKey);
  };

  getAAProvider = async () => {
    if (this.aaProvider) return this.aaProvider;

    let signer = this.bananaSigner;
    let network = await this.jsonRpcProvider.getNetwork();

    const entryPoint = EntryPoint__factory.connect(
      this.Provider.bundlerUrl,
      this.jsonRpcProvider
    );

    const MyWalletDeployer = MyWalletDeployer__factory.connect(
      addresses.MyWalletDeployer,
      signer
    );
    const factoryAddress = MyWalletDeployer.address;

    const myPaymasterApi = new MyPaymasterApi();

    const smartWalletAPI = new MyWalletApi({
      provider: this.jsonRpcProvider,
      entryPointAddress: this.Provider.entryPointAddress,
      accountAddress: this.walletAddress,
      owner: signer,
      factoryAddress: factoryAddress,
      paymasterAPI: myPaymasterApi,
    });

    this.accountApi = smartWalletAPI;

    const httpRpcClient = new HttpRpcClient(
      this.Provider.bundlerUrl,
      this.Provider.entryPointAddress,
      network.chainId
    );

    this.httpRpcClient = httpRpcClient;

    this.aaProvider = await new ERC4337EthersProvider(
      network.chainId,
      this.Provider,
      signer,
      this.jsonRpcProvider,
      httpRpcClient,
      entryPoint,
      smartWalletAPI
    ).init();

    return this.aaProvider;
  };

  private getAccountInitCode(factory: MyWalletDeployer, salt = 0): BytesLike {
    return hexConcat([
      factory.address,
      factory.interface.encodeFunctionData("deployWallet", [
        this.Provider.entryPointAddress,
        this.bananaSigner.address,
        0,
        [this.publicKey.q0, this.publicKey.q1],
        addresses.Elliptic,
      ]),
    ]);
  }

  getWalletAddress = async (walletIdentifier: string) => {
    await this.initiateSigner(walletIdentifier);
    this.walletIdentifier = walletIdentifier; //  repetation
    let signer = this.bananaSigner;
    let ownerAddress = await signer.getAddress();

    if (!this.cookieObject) {
      const MyWalletDeployer = MyWalletDeployer__factory.connect(
        addresses.MyWalletDeployer,
        signer // we require signer here as we are deploying the SCW with q0 and q1 and for getting it we need to register user if he is not already registered
      );
      try {
        this.walletAddress = await MyWalletDeployer.getDeploymentAddress(
          this.Provider.entryPointAddress,
          ownerAddress,
          0,
          [this.publicKey.q0, this.publicKey.q1],
          addresses.Elliptic
        );
        // cred generation complete here now we need to save it in cookie and server
        this.cookieObject = {
          q0: this.publicKey.q0,
          q1: this.publicKey.q1,
          walletAddress: this.walletAddress,
          initcode: false,
          encodedId: this.publicKey.encodedId,
          username: walletIdentifier,
        };
        // saving cookie correspond to user Identifier in cookie
        this.cookie.setCookie(
          "bananaUser",
          JSON.stringify(walletIdentifier)
        );
        this.cookie.setCookie(
          walletIdentifier,
          JSON.stringify(this.cookieObject)
        );

        // saving cookie correspond to user Identifier in server
        const setCredentialsStatus = await setUserCredentials(
          walletIdentifier,
          this.cookieObject
        );
        if (!setCredentialsStatus.success) {
          //! Raise a popup here in case it fails to save
          console.log("Some error ocured while saving");
          return { error: 'Failed to save wallet creds to serever' }
        }
      } catch (err) {
        console.log(err);
        throw err;
      }
    } else {
      //@ts-ignore
      this.walletAddress = this.cookieObject.walletAddress;
    }

    // check if cred is there in cookie if not save in cookie && check if username is there in cookie if not save in cookie
    this.postCookieChecks(walletIdentifier);
    this.aaProvider = await this.getAAProvider();
    return this.walletAddress;
  };

  getWalletName = () => {
    return this.cookie.getCookie("bananaUser");
  };

  private postCookieChecks = async (walletIdentifier: string) => {
    // check for username
    const walletName = this.cookie.getCookie("bananaUser");
    if (!!walletName) {
      this.cookie.setCookie(walletName, JSON.stringify(this.cookieObject));
      return;
    }
    this.cookie.setCookie("bananaUser", JSON.stringify(walletIdentifier));
    this.cookie.setCookie(walletIdentifier, JSON.stringify(this.cookieObject));
  };

  getZkProof = ()=> {
    const abi = ethers.utils.defaultAbiCoder;
    const callDataProof = abi.encode(
      ["uint256[2]", "uint256[2][2]", "uint256[2]", "uint256[2]"],
      [
        [0, 0],
        [
          [0, 0],
          [0, 0],
        ],
        [0, 0],
        [0, 0],
      ]
    );
    return callDataProof;
  }

  private setCookieOnceWalletDeployed = async (initCodeStatus: boolean) => {
    if (navigator.cookieEnabled) {
      const walletIdentifier = this.cookie.getCookie("bananaUser");
      this.cookieObject = this.cookie.getCookie(walletIdentifier);
      this.cookieObject.initcode = true;
      this.cookie.setCookie(
        walletIdentifier,
        JSON.stringify(this.cookieObject)
      );
      const setCredentialsStatus = await setUserCredentials(
        walletIdentifier,
        this.cookieObject
      );
      console.log("Cookie set status: ", setCredentialsStatus);
    } else {
      console.log("Cookies are not enabled in the browser.");
    }
  }

  private sendUserOpToBundler = async (userOp: UserOperationStruct) => {
    try {
      const uHash = await this.httpRpcClient.sendUserOpToBundler(
        userOp as any
      );
      return uHash;
    } catch (err) {
      console.log(err);
    }
  }

  private constructuUserOp = async (callDataProof: string, functionCallData: string, value:string, destination: string, isInitCode: boolean, initCode: BytesLike) => {
    const userOpCallData = this.SCWContract.interface.encodeFunctionData(
      "exec",
      [
        destination,
        ethers.utils.parseEther(value),
        [functionCallData, callDataProof],
      ]
    );
    if(isInitCode) {
      const encodedCallData = this.SCWContract.interface.encodeFunctionData(
        "execFromEntryPoint",
        [this.SCWContract.address, 0, userOpCallData]
      );
      const userOp = await constructUserOpWithInitCode(
          this.jsonRpcProvider,
          this.walletAddress,
          encodedCallData,
          initCode
      ); 
      return userOp;
    }
    let userOp;
    try {
      userOp = await this.accountApi.createUnsignedUserOp({
        target: this.walletAddress,
        data: userOpCallData,
        ...(await getGasFee(this.jsonRpcProvider)),
      });
    } catch (err) {
      console.log(err);
    }
    return userOp;
  }

  private constructAndSendUserOp = async (funcCallData: string, destination:string, value: string, isInitCode: boolean, initCode: BytesLike) => {
    const callDataProof = this.getZkProof();
    const userOp = await this.constructuUserOp(callDataProof, funcCallData, value, destination, isInitCode, initCode);
    const reqId = await this.accountApi.getUserOpHash(userOp as any);
    let processStatus = true;
    let finalUserOp;
    while(processStatus) {
      const { newUserOp, process } = await this.bananaSigner.signUserOp(userOp as any, reqId, this.cookieObject.encodedId);
      if(process === 'success') { 
        finalUserOp = newUserOp;
        processStatus = false; 
      }
    }
    if(!isInitCode && finalUserOp) {
      finalUserOp.callGasLimit = 3e6;
      finalUserOp.verificationGasLimit = 3e6;
    }
    const uHash: string = await this.sendUserOpToBundler(finalUserOp as any) || '';
    let initCodeSetStatus = false;;
    if(!!uHash) {
      if(uHash.length === 66) {
        initCodeSetStatus = true;
      }
    }
    if(isInitCode) {
      this.setCookieOnceWalletDeployed(initCodeSetStatus);
    }
    return uHash;
  } 

  private initWalletAndTransact = async (
    funcCallData: string,
    destination: string,
    value: string
  ) => {
    const MyWalletDeployer = MyWalletDeployer__factory.connect(
      addresses.MyWalletDeployer,
      this.bananaSigner
    );
    this.SCWContract = MyTouchIdWallet__factory.connect(
      this.walletAddress || "",
      this.bananaSigner
    );
    const initCode = this.getAccountInitCode(MyWalletDeployer);
    const transactionHash = await this.constructAndSendUserOp(funcCallData, destination, value, true, initCode);
    return transactionHash;
  };

  execute = async (
    funcCallData: string,
    destination: string,
    value: string
  ) => {
    const walletCreds = this.cookie.getCookie(this.walletIdentifier);

    if(walletCreds) {
      if(!walletCreds.initcode) {
        let uHash = await this.initWalletAndTransact(
          funcCallData,
          destination,
          value
        );
        return uHash;
      }
    } else {
      const initCodeStatus = await checkInitCodeStatus(this.walletIdentifier);
      if(!initCodeStatus.isInitCode) {
        let uHash = await this.initWalletAndTransact(
          funcCallData,
          destination,
          value
        );
        return uHash;
      }
    }

    const aaProvider = await this.getAAProvider();
    const aaSigner = aaProvider.getSigner();
    this.SCWContract = MyTouchIdWallet__factory.connect(
      this.walletAddress || "",
      this.bananaSigner
    );
    this.SCWContract = this.SCWContract.connect(aaSigner);
    const transactionHash = await this.constructAndSendUserOp(funcCallData, destination, value, false, '');
    return transactionHash;
  };

  isWalletNameUnique = async (walletName: string) => {
    try {
      const isWalletNameExist = await checkIsWalletNameExist(walletName);
      return isWalletNameExist;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
}
