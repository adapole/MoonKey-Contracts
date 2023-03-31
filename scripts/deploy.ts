import { hexConcat, hexZeroPad, parseEther } from 'ethers/lib/utils';
import { ethers } from 'hardhat';
import { fillAndSign } from '../test/UserOp';
import {
  EntryPoint__factory,
  MoonKeyGnosisSafeAccountFactory__factory,
} from '../typechain';
import { getHttpRpcClient } from './getHttpRpcClient';
const entrypointAddress = '0x0576a174D229E3cFA37253523E645A78A0C91B57'; //EntryPoint
const accountAddress = '0x92B0C7DA4719E9f784a663dC0DB1931221143739'; //MoonKeyGonosisAccountFactory

async function main() {
  if (!process.env.PRIVATE_KEY)
    throw new Error('Missing environment: Private key');
  const provider = new ethers.providers.JsonRpcProvider(
    `https://polygon-mumbai.g.alchemy.com/v2/${process.env.ALCHEMY_ID}`
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

  await owner.sendTransaction({
    to: counterfactualAddress,
    value: parseEther('0.1'),
  });

  const op = await fillAndSign(
    {
      sender: counterfactualAddress,
      initCode,
      verificationGasLimit: 400000,
    },
    owner,
    entryPoint
  );
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
