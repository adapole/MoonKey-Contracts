# :moon: MoonKey Contracts

This repo started as a fork of [the ZeroDev repo based on official AA repo](https://github.com/eth-infinitism/account-abstraction).

# Setup

Clone this repo into your local environment:

```bash
git clone git@github.com:moonkey-global/moonkey-contracts.git
cd moonkey-contracts
```

Install dependencies:

```bash
yarn install
```

# Commands

Once you have an environment setup, these commands can be used for running the example scripts.

### Get account address

Smart contract account addresses can be deterministically generated.

The account will be deployed by this command transaction.

```bash
yarn hardhat run ./scripts/run/deploy.ts
```

### Transfer ETH

Before executing a transfer, make sure to deposit some ETH to the address.

```bash
yarn run ts-node --files ./scripts/run/transfer.ts <to-address> <value-wei>
```

### Transfer ERC-20 token

Make sure the address generated has enough specified tokens to execute the transfer.

If not using a paymaster, make sure to also have enough ETH to pay gas fees.

```bash
yarn run ts-node --files ./scripts/run/transfer_erc20.ts <token-contract> <to-address> <value>
```

# Custom deployment

If You want to use your own account factory follow this steps.

First, edit [hardhat.config.ts](./hardhat.config.ts) and uncomment `namedAccounts` and `etherscan`

```bash
yarn hardhat --network <target-network> deploy
```

Then to verify the contracts for `EtherScan`

```bash
yarn hardhat --network <target-network> etherscan-verify
```

Alternative verification of source file,

```bash
yarn hardhat --network <target-network> sourcify
```
