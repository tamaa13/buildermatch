// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {VerdictRegistry} from "../src/VerdictRegistry.sol";

/// @notice Deploy VerdictRegistry to the configured chain.
/// @dev Env vars:
///      - PRIVATE_KEY           deployer key (hex, 0x-prefixed ok)
///      - ORCHESTRATOR_ADDRESS  (optional) initial orchestrator; defaults to deployer
///      - OWNER_ADDRESS         (optional) contract owner; defaults to deployer
contract Deploy is Script {
    function run() external returns (VerdictRegistry registry) {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);

        address owner = vm.envOr("OWNER_ADDRESS", deployer);
        address orchestrator = vm.envOr("ORCHESTRATOR_ADDRESS", deployer);

        console2.log("Deployer:     ", deployer);
        console2.log("Owner:        ", owner);
        console2.log("Orchestrator: ", orchestrator);
        console2.log("ChainId:      ", block.chainid);

        vm.startBroadcast(pk);
        registry = new VerdictRegistry(owner, orchestrator);
        vm.stopBroadcast();

        console2.log("VerdictRegistry:", address(registry));
    }
}
