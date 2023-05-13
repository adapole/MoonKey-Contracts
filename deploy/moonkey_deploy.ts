import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers } from 'ethers';

const deployMoonKey: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const entrypoint = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789';
  const proxyFactory = '0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2';
  const { deployments, ethers } = hre;
  const { deploy } = deployments;
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();

  console.log('deployerAddress: ', deployerAddress);

  await deploy('MoonKeyPluginSafe', {
    from: deployerAddress,
    args: [entrypoint],
    log: true,
    deterministicDeployment: true,
  });

  const singletone = await ethers.getContract('MoonKeyPluginSafe');

  console.log('singletoneAddress: ', singletone.address);

  await deploy('MoonKeyGnosisSafeAccountFactory', {
    from: deployerAddress,
    args: [proxyFactory, singletone.address],
    log: true,
    deterministicDeployment: true,
  });

  await deploy('MoonKeySessionKeyPlugin', {
    from: deployerAddress,
    log: true,
    deterministicDeployment: true,
  });

  await deploy('FunctionSignaturePolicyFactory', {
    from: deployerAddress,
    log: true,
    deterministicDeployment: true,
  });
};

export default deployMoonKey;
deployMoonKey.tags = ['MoonKey'];
