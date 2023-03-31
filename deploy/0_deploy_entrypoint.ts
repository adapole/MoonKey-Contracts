import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { Create2Factory } from '../src/Create2Factory'
import { ethers } from 'hardhat'

const deployEntryPoint: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const from = await ethers.provider.getSigner().getAddress()
  await new Create2Factory(ethers.provider).deployFactory()

  console.log('from : ', from)

  const ret = await hre.deployments.deploy(
    'EntryPoint', {
      from,
      args: [],
      gasLimit: 6e6,
      deterministicDeployment: true
    })
  console.log('==entrypoint addr=', ret.address)
}

export default deployEntryPoint
  /*
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { Create2Factory } from '../src/Create2Factory';
import { ethers } from 'hardhat';
import { JsonRpcSigner } from '@ethersproject/providers';
import { url } from 'inspector';
//const entrypointAddress = '0x0576a174D229E3cFA37253523E645A78A0C91B57';

async function main() {
  const provider = new ethers.providers.JsonRpcProvider(
    `https://goerli.infura.io/v3/${process.env.INFURA_ID}`
  );
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (!privateKey || privateKey.length <= 0)
    throw new Error('Missing environment: Mnemonic seed');

  const wallet = new ethers.Wallet(privateKey);
  const signer = wallet.connect(provider);
  console.log(await signer.getBalance());

  const from = wallet.address; //await ethers.provider.getSigner().getAddress()

  // console.log(signer as unknown as JsonRpcSigner);
  await new Create2Factory(
    provider,
    signer as unknown as JsonRpcSigner
  ).deployFactory();

  const simpleAccount = new SimpleAccount__factory(signer);
  const simpleAccountContract = await simpleAccount.deploy(entrypointAddress);
  const rcpt = await simpleAccountContract.deployTransaction.wait();

  const signers = await ethers.getSigners();
  const simpleAccountFactory = await ethers.getContractFactory('SimpleAccount');
  const simpleAccountContract = await simpleAccountFactory
    .connect(signers[0])
    .deploy(entrypointAddress);
  const rcpt = await simpleAccountContract.deployTransaction.wait();

  console.log(`Contract deployed @ ${simpleAccountContract.address}`);
  console.log('rcpt= ', rcpt);

  const from = await ethers.provider.getSigner().getAddress();
  await new Create2Factory(ethers.provider).deployFactory();

  console.log('from : ', from);
  const ret = await hre.deployments.deploy('EntryPoint', {
    from,
    args: [],
    gasLimit: 6e6,
    deterministicDeployment: true,
  });
  console.log('==entrypoint addr=', ret.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
  */
