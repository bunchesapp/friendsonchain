// SPDX-License-Identifier: MIT
pragma solidity >=0.8.9;

// ██      ███████ ████████ ███████     ██████  ███████     ███████ ██████  ██ ███████ ███    ██ ██████  ███████
// ██      ██         ██    ██          ██   ██ ██          ██      ██   ██ ██ ██      ████   ██ ██   ██ ██
// ██      █████      ██    ███████     ██████  █████       █████   ██████  ██ █████   ██ ██  ██ ██   ██ ███████
// ██      ██         ██         ██     ██   ██ ██          ██      ██   ██ ██ ██      ██  ██ ██ ██   ██      ██
// ███████ ███████    ██    ███████     ██████  ███████     ██      ██   ██ ██ ███████ ██   ████ ██████  ███████

// Import OpenZeppelin Contracts
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/// @title Friends on ChainV2
/// @author Ian Hunter (@ianh), Derek Brown (@derekbrown), Jacob Van Schenck (@jacobvs_eth)
/// @notice V1: Base Contract
/// @notice V2: Adds ability to add friends to a group post-mint.
contract FriendsOnChainV2 is
  Initializable,
  ERC1155Upgradeable,
  OwnableUpgradeable
{
  using Counters for Counters.Counter;
  using Strings for uint256;

  // Defaults to 0. 0 is unlimited supply.
  uint256 private maxSupply;

  // Indicates the number of people in a FOC, including the minter. Defaults to 7. 0 is unlimited.
  uint256 private maxOwners;

  // Defaults to free mint. Denominated in wei.
  uint256 private pricePerToken;

  // Use OpenZeppelin Counters for incrementing - do NOT access counter's underlying value.
  Counters.Counter private nextTokenId;

  mapping(uint256 => address[]) private ownersOfToken;

  event GroupCreated(uint256 tokenId, address[] indexed _to);
  event FriendAddedToGroup(uint256 tokenId, address indexed _to);

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  function initialize() public initializer {
    __ERC1155_init("https://bunches.xyz/foc/metadata/{id}");
    __Ownable_init();
    maxSupply = 0;
    maxOwners = 7;
    pricePerToken = 0;
    nextTokenId.increment(); // nextTokenId is initialized to 1, since starting at 0 leads to higher gas cost for the first minter
  }

  /// @notice Mint a token for up to maxOwners addresses.
  /// @dev Payable. Emits GroupCreated event. Checks maxOwners and maxSupply.
  /// @dev Loops through addresses to assign ownership.
  /// @param _to array of recipient addresses of the token
  function createGroup(address[] memory _to) external payable {
    uint256 currentTokenId = nextTokenId.current();

    require(
      maxOwners == 0 || _to.length <= maxOwners,
      "Maximum number of owners exceeded"
    );
    require(msg.value == pricePerToken, "Incorrect payment");
    require(
      maxSupply == 0 || currentTokenId <= maxSupply,
      "Maximum number of tokens reached"
    );

    for (uint256 i = 0; i < _to.length; i++) {
      _mint(_to[i], currentTokenId, 1, "");
    }

    ownersOfToken[currentTokenId] = _to;

    emit GroupCreated(currentTokenId, _to);

    nextTokenId.increment();
  }

  /// @notice Adds new address to an exisiting Group
  /// @dev Payable. Emits FriendAddedToGroup event. Checks maxOwners vs currentOwners. Checks _newFriend isn't already a member
  /// @param _newFriend address to add to an existing Group
  /// @param _tokenId FOC token ID that the new address will be added to
  function addFriendToGroup(address _newFriend, uint256 _tokenId)
    public
    payable
    onlyMemberOrOwner(_tokenId)
  {
    require(
      balanceOf(_newFriend, _tokenId) == 0,
      "Only 1 of each token is allowed per address"
    );
    require(msg.value == pricePerToken, "Incorrect payment");
    address[] memory currentOwners = ownersOfToken[_tokenId];
    require(
      currentOwners.length < maxOwners,
      "Maximun number of owners exceeded"
    );

    _mint(_newFriend, _tokenId, 1, "");

    uint256 length = currentOwners.length + 1;
    address[] memory _newOwnersOfToken = new address[](length);
    for (uint256 i = 0; i < length - 1; i++) {
      _newOwnersOfToken[i] = currentOwners[i];
    }
    _newOwnersOfToken[length - 1] = _newFriend;
    ownersOfToken[_tokenId] = _newOwnersOfToken;

    emit FriendAddedToGroup(_tokenId, _newFriend);
  }

  /// @notice Returns whether the given address is a member of a given tokenId.
  /// @param _addr address for potential member
  /// @param _tokenId queried FOC token ID
  /// @return True or false, indicating address' membership.
  function isMember(address _addr, uint256 _tokenId)
    public
    view
    returns (bool)
  {
    return balanceOf(_addr, _tokenId) > 0;
  }

  /// @notice Returns the mint price per FOC
  /// @dev No conversions, so denominated in wei.
  /// @return Price per FOC, denominated in wei.
  function price() public view returns (uint256) {
    return pricePerToken;
  }

  /// @notice Returns the total count of minted FOCs.
  /// @return Number of minted FOCs as an integer.
  function countGroups() public view returns (uint256) {
    return nextTokenId.current() - 1;
  }

  /// @notice Returns the owners of a specific token
  /// @param _tokenId the FOC token ID
  /// @return Owners of a token as an array of addresses
  function ownersOf(uint256 _tokenId) public view returns (address[] memory) {
    return ownersOfToken[_tokenId];
  }

  /// @notice Change the mint price of FOCs.
  /// @dev Only the owner can change. No conversions, so denominated in wei.
  /// @param _newPrice the new mint price per FOC
  function setPrice(uint256 _newPrice) public onlyOwner {
    pricePerToken = _newPrice;
  }

  /// @notice Change the max supply of tokens.
  /// @dev Only the owner can change.
  /// @param _newSupply the new maximum number of FOCs
  function setMaxSupply(uint256 _newSupply) public onlyOwner {
    maxSupply = _newSupply;
  }

  /// @notice Change the max owners per token.
  /// @dev Only the owner can change.
  /// @param _newMaxOwners the new maximum number of owners per FOC
  function setMaxOwners(uint256 _newMaxOwners) public onlyOwner {
    maxOwners = _newMaxOwners;
  }

  /// @notice Provides a URL that serves contract-level metadata to marketplaces.
  /// @dev Serves a JSON object per OpenSea standards.
  function contractURI() public pure returns (string memory) {
    return "https://bunches.xyz/foc/contract/metadata";
  }

  /// @notice Requires caller to own this token or be the owner
  modifier onlyMemberOrOwner(uint256 _tokenId) {
    require(
      isMember(msg.sender, _tokenId) || msg.sender == owner(),
      "Must be Owner or Group Member"
    );
    _;
  }
}
