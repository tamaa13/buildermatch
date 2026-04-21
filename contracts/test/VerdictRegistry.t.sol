// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {VerdictRegistry} from "../src/VerdictRegistry.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract VerdictRegistryTest is Test {
    VerdictRegistry internal registry;

    address internal owner = address(0xA11CE);
    address internal orchestrator = address(0xB0B);
    address internal rando = address(0xCAFE);

    address internal token0 = address(0x1111);
    address internal token1 = address(0x2222);

    event VerdictRecorded(
        address indexed token,
        uint256 indexed verdictId,
        uint8 score,
        bytes32 reasoningHash,
        string ipfsUri
    );

    event OrchestratorUpdated(address indexed previousOrchestrator, address indexed newOrchestrator);

    function setUp() public {
        vm.prank(owner);
        registry = new VerdictRegistry(owner, orchestrator);
    }

    function test_constructor_setsOwnerAndOrchestrator() public view {
        assertEq(registry.owner(), owner);
        assertEq(registry.orchestrator(), orchestrator);
        assertEq(registry.name(), "memegard Verdict");
        assertEq(registry.symbol(), "VERDICT");
        assertEq(registry.nextTokenId(), 0);
    }

    function test_constructor_revertsOnZeroOrchestrator() public {
        vm.expectRevert(VerdictRegistry.InvalidOrchestrator.selector);
        new VerdictRegistry(owner, address(0));
    }

    function test_recordVerdict_mintsAndStores() public {
        bytes32 hashV = keccak256("reasoning-json");
        string memory uri = "ipfs://QmExample/0";

        vm.expectEmit(true, true, false, true);
        emit VerdictRecorded(token0, 0, 72, hashV, uri);

        vm.prank(orchestrator);
        uint256 id = registry.recordVerdict(token0, 72, hashV, uri);

        assertEq(id, 0);
        assertEq(registry.nextTokenId(), 1);
        assertEq(registry.ownerOf(id), orchestrator);
        assertEq(registry.tokenURI(id), uri);

        VerdictRegistry.Verdict memory v = registry.getVerdict(id);
        assertEq(v.token, token0);
        assertEq(v.score, 72);
        assertEq(v.reasoningHash, hashV);
        assertEq(v.ipfsUri, uri);
        assertEq(v.orchestrator, orchestrator);
        assertEq(v.timestamp, uint64(block.timestamp));

        uint256[] memory ids = registry.getVerdictsByToken(token0);
        assertEq(ids.length, 1);
        assertEq(ids[0], 0);
        assertEq(registry.verdictCountByToken(token0), 1);
    }

    function test_recordVerdict_multipleVerdictsSameToken() public {
        vm.startPrank(orchestrator);
        registry.recordVerdict(token0, 10, bytes32("r0"), "ipfs://a");
        registry.recordVerdict(token0, 20, bytes32("r1"), "ipfs://b");
        registry.recordVerdict(token1, 30, bytes32("r2"), "ipfs://c");
        vm.stopPrank();

        uint256[] memory t0 = registry.getVerdictsByToken(token0);
        uint256[] memory t1 = registry.getVerdictsByToken(token1);
        assertEq(t0.length, 2);
        assertEq(t0[0], 0);
        assertEq(t0[1], 1);
        assertEq(t1.length, 1);
        assertEq(t1[0], 2);
        assertEq(registry.nextTokenId(), 3);
    }

    function test_recordVerdict_revertsWhenNotOrchestrator() public {
        vm.prank(rando);
        vm.expectRevert(VerdictRegistry.NotOrchestrator.selector);
        registry.recordVerdict(token0, 50, bytes32("x"), "ipfs://x");
    }

    function test_recordVerdict_revertsWhenOwnerButNotOrchestrator() public {
        vm.prank(owner);
        vm.expectRevert(VerdictRegistry.NotOrchestrator.selector);
        registry.recordVerdict(token0, 50, bytes32("x"), "ipfs://x");
    }

    function test_recordVerdict_revertsOnInvalidScore() public {
        vm.prank(orchestrator);
        vm.expectRevert(VerdictRegistry.InvalidScore.selector);
        registry.recordVerdict(token0, 101, bytes32("x"), "ipfs://x");
    }

    function test_recordVerdict_revertsOnEmptyUri() public {
        vm.prank(orchestrator);
        vm.expectRevert(VerdictRegistry.EmptyIpfsUri.selector);
        registry.recordVerdict(token0, 50, bytes32("x"), "");
    }

    function test_getVerdict_revertsForUnknownId() public {
        vm.expectRevert(VerdictRegistry.NonexistentVerdict.selector);
        registry.getVerdict(42);
    }

    function test_tokenURI_revertsForUnminted() public {
        vm.expectRevert();
        registry.tokenURI(0);
    }

    function test_setOrchestrator_updatesAndEmits() public {
        address newOrch = address(0xDEAD);

        vm.expectEmit(true, true, false, false);
        emit OrchestratorUpdated(orchestrator, newOrch);

        vm.prank(owner);
        registry.setOrchestrator(newOrch);
        assertEq(registry.orchestrator(), newOrch);

        vm.prank(newOrch);
        uint256 id = registry.recordVerdict(token0, 50, bytes32("ok"), "ipfs://ok");
        assertEq(registry.ownerOf(id), newOrch);
    }

    function test_setOrchestrator_revertsWhenNotOwner() public {
        vm.prank(rando);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, rando));
        registry.setOrchestrator(rando);
    }

    function test_setOrchestrator_revertsOnZero() public {
        vm.prank(owner);
        vm.expectRevert(VerdictRegistry.InvalidOrchestrator.selector);
        registry.setOrchestrator(address(0));
    }

    function testFuzz_recordVerdict_validScore(uint8 score) public {
        vm.assume(score <= 100);
        vm.prank(orchestrator);
        uint256 id = registry.recordVerdict(token0, score, bytes32("fuzz"), "ipfs://fuzz");
        assertEq(registry.getVerdict(id).score, score);
    }
}
