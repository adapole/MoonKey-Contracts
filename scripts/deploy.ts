import { hexConcat, hexZeroPad, parseEther } from 'ethers/lib/utils';
import { ethers } from 'hardhat';
import { fillAndSign } from '../test/UserOp';
import {
  EntryPoint__factory,
  MoonKeyGnosisSafeAccountFactory__factory,
} from '../typechain';
import { getHttpRpcClient } from './getHttpRpcClient';
const entrypointAddress = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789'; //EntryPoint
const accountAddress = '0x0E1c853Cc60f5f1bB4D6e830C8257b75672919d1'; //MoonKeyGnosisAccountFactory

async function main() {
  if (!process.env.PRIVATE_KEY)
    throw new Error('Missing environment: Private key');
  const provider = new ethers.providers.JsonRpcProvider(
    `https://bsc-testnet.nodereal.io/v1/${process.env.NODEREAL_API}`
  );
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
  const owner = wallet.connect(provider);
  const ownerAddress = await owner.getAddress();

  const entryPoint = new EntryPoint__factory(owner).attach(entrypointAddress);

  const accountFactory = new MoonKeyGnosisSafeAccountFactory__factory(
    owner
  ).attach(accountAddress);
  console.log('safeSingletonAddress', await accountFactory.safeSingleton());

  const initCode = hexConcat([
    accountFactory.address,
    accountFactory.interface.encodeFunctionData('createAccount', [
      ownerAddress,
      123,
    ]),
  ]);
  console.log('initCode', initCode);

  const counterfactualAddress = await accountFactory.callStatic.getAddress(
    ownerAddress,
    123
  );
  console.log('counterfactualAddress', counterfactualAddress);

  // await owner.sendTransaction({
  //   to: counterfactualAddress,
  //   value: parseEther('0.1'),
  // });

  const op = await fillAndSign(
    {
      sender: counterfactualAddress,
      initCode,
      verificationGasLimit: 4000000,
    },
    owner,
    entryPoint
  );
  return;
  const client = await getHttpRpcClient(
    provider,
    process.env.BUNDLER_URL!,
    entrypointAddress
  );
  const uoHash = await client.sendUserOpToBundler(op);
  console.log(`UserOpHash: ${uoHash}`);

  console.log('Waiting for transaction...');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
