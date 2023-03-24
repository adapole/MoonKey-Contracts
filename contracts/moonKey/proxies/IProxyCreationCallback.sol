// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;
import "./MoonKeyProxy.sol";

interface IProxyCreationCallback {
    function proxyCreated(MoonKeyProxy proxy, address _singleton, bytes calldata initializer, uint256 saltNonce) external;
}