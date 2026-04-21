// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title VerdictRegistry
/// @notice ERC-721 certificate minted for every multi-agent DD verdict on a Four.meme token.
///         Each token records a risk score, a hash of the reasoning, and an IPFS URI with the
///         full agent-debate transcript. The NFT itself is held by the submitter (orchestrator)
///         so the entire debate trail is permanently auditable on-chain.
contract VerdictRegistry is ERC721, Ownable {
    struct Verdict {
        address token;
        uint8 score;
        bytes32 reasoningHash;
        string ipfsUri;
        uint64 timestamp;
        address orchestrator;
    }

    mapping(uint256 => Verdict) public verdicts;
    mapping(address => uint256[]) public verdictsByToken;
    uint256 public nextTokenId;

    address public orchestrator;

    event VerdictRecorded(
        address indexed token,
        uint256 indexed verdictId,
        uint8 score,
        bytes32 reasoningHash,
        string ipfsUri
    );

    event OrchestratorUpdated(address indexed previousOrchestrator, address indexed newOrchestrator);

    error NotOrchestrator();
    error InvalidOrchestrator();
    error InvalidScore();
    error EmptyIpfsUri();
    error NonexistentVerdict();

    modifier onlyOrchestrator() {
        if (msg.sender != orchestrator) revert NotOrchestrator();
        _;
    }

    constructor(address initialOwner, address initialOrchestrator)
        ERC721("memegard Verdict", "VERDICT")
        Ownable(initialOwner)
    {
        if (initialOrchestrator == address(0)) revert InvalidOrchestrator();
        orchestrator = initialOrchestrator;
        emit OrchestratorUpdated(address(0), initialOrchestrator);
    }

    /// @notice Record a verdict and mint its certificate NFT to the orchestrator.
    function recordVerdict(
        address token,
        uint8 score,
        bytes32 reasoningHash,
        string calldata ipfsUri
    ) external onlyOrchestrator returns (uint256 verdictId) {
        if (score > 100) revert InvalidScore();
        if (bytes(ipfsUri).length == 0) revert EmptyIpfsUri();

        verdictId = nextTokenId++;

        verdicts[verdictId] = Verdict({
            token: token,
            score: score,
            reasoningHash: reasoningHash,
            ipfsUri: ipfsUri,
            timestamp: uint64(block.timestamp),
            orchestrator: msg.sender
        });
        verdictsByToken[token].push(verdictId);

        _safeMint(msg.sender, verdictId);

        emit VerdictRecorded(token, verdictId, score, reasoningHash, ipfsUri);
    }

    /// @notice Update the address authorized to record verdicts.
    function setOrchestrator(address _orchestrator) external onlyOwner {
        if (_orchestrator == address(0)) revert InvalidOrchestrator();
        address previous = orchestrator;
        orchestrator = _orchestrator;
        emit OrchestratorUpdated(previous, _orchestrator);
    }

    function getVerdict(uint256 verdictId) external view returns (Verdict memory) {
        if (verdictId >= nextTokenId) revert NonexistentVerdict();
        return verdicts[verdictId];
    }

    function getVerdictsByToken(address token) external view returns (uint256[] memory) {
        return verdictsByToken[token];
    }

    function verdictCountByToken(address token) external view returns (uint256) {
        return verdictsByToken[token].length;
    }

    /// @notice Metadata URI for a verdict certificate.
    /// @dev Returns the IPFS URI supplied at mint time; the referenced JSON follows the
    ///      OpenSea metadata standard (name, description, image, attributes).
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return verdicts[tokenId].ipfsUri;
    }
}
