import { ethers } from 'hardhat';
import { fillAndSign } from '../test/UserOp';
import {
  EntryPoint__factory,
  MoonKeyGnosisSafeAccountFactory__factory,
  MoonKeyPluginSafe__factory,
} from '../typechain';
import * as dotenv from 'dotenv';
import { getHttpRpcClient } from './getHttpRpcClient';
dotenv.config();

const entrypointAddress = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789'; //EntryPoint
const accountAddress = '0x0E1c853Cc60f5f1bB4D6e830C8257b75672919d1'; //MoonKeyGnosisAccountFactory
const safeSingletonAddress = '0x5711Fd2d656942895763ac2FC5824607Ef6b5C92'; //MoonKeyPluginSafe

async function main() {
  if (!process.env.PRIVATE_KEY)
    throw new Error('Missing environment: Private key');
  const provider = new ethers.providers.JsonRpcProvider(
    `https://polygon-mumbai.g.alchemy.com/v2/${process.env.ALCHEMY_ID}`
  );
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
  const owner = wallet.connect(provider);
  const ownerAddress = await owner.getAddress();

  const safeSingleton = new MoonKeyPluginSafe__factory(owner).attach(
    safeSingletonAddress
  );
  const safe_execTxCallData = safeSingleton.interface.encodeFunctionData(
    'executeAndRevert',
    ['0x109Bf5E11140772a1427162bb51e23c244d13b88', 1, '0x', 0]
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
  //   const txHash = await accountAPI.getUserOpReceipt(uoHash);
  //   console.log(`Transaction hash: ${txHash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
