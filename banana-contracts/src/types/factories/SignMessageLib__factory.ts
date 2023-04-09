/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../common";
import type {
  SignMessageLib,
  SignMessageLibInterface,
} from "../SignMessageLib";

const _abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "msgHash",
        type: "bytes32",
      },
    ],
    name: "SignMsg",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "message",
        type: "bytes",
      },
    ],
    name: "getMessageHash",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "_data",
        type: "bytes",
      },
    ],
    name: "signMessage",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const _bytecode =
  "0x60808060405234610016576103b7908161001c8239f35b600080fdfe6080604052600436101561001257600080fd5b6000803560e01c80630a1028c4146100ef576385a5affe1461003357600080fd5b346100ec5760207ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc3601126100ec5760043567ffffffffffffffff8082116100e857366023830112156100e85781600401359081116100e85736602482840101116100e8576100af916100aa9160243692016101cc565b610236565b808252600760205260016040832055604051907fe7f4675038f4f6034dfcbbb24c4dc08e4ebf10eb9d257d3d02c0f38d122ac6e48383a2f35b8280fd5b80fd5b50346100ec5760207ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc3601126100ec576004359067ffffffffffffffff82116100ec57366023830112156100ec5760206101546100aa366004860135602487016101cc565b604051908152f35b90601f7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0910116810190811067ffffffffffffffff82111761019d57604052565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b92919267ffffffffffffffff821161019d576040519161021460207fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0601f840116018461015c565b829481845281830111610231578281602093846000960137010152565b600080fd5b805160208092012090604091825192828401917f60b3cbf8b4a223d68d641b3b6ddf9a298e7f33710cf3d3a9d1146b5a6150fbca8352818501528084526060840167ffffffffffffffff928582108483111761019d5781835285519020907ff698da250000000000000000000000000000000000000000000000000000000081528481600481305afa95861561037657600096610344575b50508151938401947f190000000000000000000000000000000000000000000000000000000000000086527f01000000000000000000000000000000000000000000000000000000000000006021860152602285015260428401526042835260808301918383109083111761019d575251902090565b859081979293973d831161036f575b61035d818661015c565b810103126100ec5750519338806102ce565b503d610353565b83513d6000823e3d90fdfea2646970667358221220b731b799c8ea085435612c5bcd20b46772045e9edf772dc2051b938a986fa3b564736f6c634300080f0033";

type SignMessageLibConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: SignMessageLibConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class SignMessageLib__factory extends ContractFactory {
  constructor(...args: SignMessageLibConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override deploy(
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<SignMessageLib> {
    return super.deploy(overrides || {}) as Promise<SignMessageLib>;
  }
  override getDeployTransaction(
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  override attach(address: string): SignMessageLib {
    return super.attach(address) as SignMessageLib;
  }
  override connect(signer: Signer): SignMessageLib__factory {
    return super.connect(signer) as SignMessageLib__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): SignMessageLibInterface {
    return new utils.Interface(_abi) as SignMessageLibInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): SignMessageLib {
    return new Contract(address, _abi, signerOrProvider) as SignMessageLib;
  }
}