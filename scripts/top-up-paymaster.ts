import hre, { ethers } from 'hardhat';

const PAYMASTER_DEPOSIT = ethers.utils.parseEther('0.1');
const PAYMASTER_ADDRESS = '0x2A8Fd15a36826809fD1b5d95DBaeb3a10B30E1fd';

const main = async function (): Promise<void> {
  const signer = hre.ethers.provider.getSigner();
  const paymasterContract = (
    await hre.ethers.getContractAt('VerifyingPaymaster', PAYMASTER_ADDRESS)
  ).connect(signer);
  const tx = await paymasterContract.deposit({ value: PAYMASTER_DEPOSIT });
  await tx.wait();
  console.log('Paymaster deposited');
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
