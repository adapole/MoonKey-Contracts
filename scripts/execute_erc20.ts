import { ethers } from 'hardhat';
import { fillAndSign } from '../test/UserOp';
import {
  EntryPoint__factory,
  MoonKeyGnosisSafeAccountFactory__factory,
  MoonKeyPluginSafe__factory,
} from '../typechain';
import * as dotenv from 'dotenv';
import { getHttpRpcClient } from './getHttpRpcClient';
import { getUserOpReceipt } from './getUserOpReceipt';
dotenv.config();

const entrypointAddress = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789'; //EntryPoint
const accountAddress = '0x0E1c853Cc60f5f1bB4D6e830C8257b75672919d1'; //MoonKeyGnosisAccountFactory
const safeSingletonAddress = '0x5711Fd2d656942895763ac2FC5824607Ef6b5C92'; //MoonKeyPluginSafe

async function main() {
  if (!process.env.PRIVATE_KEY)
    throw new Error('Missing environment: Private key');
  const provider = new ethers.providers.JsonRpcProvider(
    `https://bsc-testnet.nodereal.io/v1/${process.env.NODEREAL_API}`
  );
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
  const owner = wallet.connect(provider);
  const ownerAddress = await owner.getAddress();

  const erc20ABI = [
    'function transfer(address to, uint amount) returns (bool)',
  ];

  const toContract = '0xE097d6B3100777DC31B34dC2c58fB524C2e76921'; //ERC20 token address
  const erc20 = new ethers.utils.Interface(erc20ABI);
  const callData = erc20.encodeFunctionData('transfer', [
    '0x109Bf5E11140772a1427162bb51e23c244d13b88',
    1,
  ]);

  const safeSingleton = new MoonKeyPluginSafe__factory(owner).attach(
    safeSingletonAddress
  );
  const safe_execTxCallData = safeSingleton.interface.encodeFunctionData(
    'executeAndRevert',
    [toContract, 0, callData, 0]
  );

  const accountFactory = new MoonKeyGnosisSafeAccountFactory__factory(
    owner
  ).attach(accountAddress);

  const counterfactualAddress = await accountFactory.callStatic.getAddress(
    ownerAddress,
    123
  );

  const entryPoint = new EntryPoint__factory(owner).attach(entrypointAddress);
  const op = await fillAndSign(
    {
      sender: counterfactualAddress, //The account
      callData: safe_execTxCallData,
    },
    owner,
    entryPoint
  );
  console.log('UserOp', op);

  const client = await getHttpRpcClient(
    provider,
    process.env.BUNDLER_URL!,
    entrypointAddress
  );
  const uoHash = await client.sendUserOpToBundler(op);
  console.log(`UserOpHash: ${uoHash}`);

  console.log('Waiting for transaction...');
  const txHash = await getUserOpReceipt(
    provider,
    entrypointAddress,
    provider.getSigner(),
    uoHash
  );
  console.log(`Transaction hash: ${txHash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
