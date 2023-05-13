import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { Create2Factory } from '../src/Create2Factory';
import { ethers } from 'hardhat';

const deployEntryPoint: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const from = await ethers.provider.getSigner().getAddress();
  // await new Create2Factory(ethers.provider).deployFactory();

  console.log('from : ', from);

  // const ret = await hre.deployments.deploy('EntryPoint', {
  //   from,
  //   args: [],
  //   gasLimit: 6e6,
  //   deterministicDeployment: true,
  // });
  const entryPoint = await hre.deployments.get('EntryPoint');

  console.log('==entrypoint addr=', entryPoint.address);
};

export default deployEntryPoint;
