# FriendsOnChain ERC1155 Contract

This is the contact repository for Bunches' Friends on Chain project. It's an ERC1155 contract with some specificities like max 7 users, etc.

## Getting Started

`yarn install`

To build:

`yarn build`

To run tests:

`yarn test`

## Workflow:

### 1. Go get a eth node provider:

- https://quicknode.com
- https://alchemy.com
- https://infura.com

### 2. Deploy the Contract

Add a .env file to the top level dir:

```env
PRIVATE_KEY= ... company private key
GOERLI_URL= ... goerli provider url here
MAINNET_URL= ... mainnet provider url here
```

Then, deploy the contract to testnet using

`npx hardhat run scripts/deploy.js --network goerli`

and you'll see the contract address.

Once you're done with testing, deploy it to mainnet using:

`npx hardhat run scripts/deploy.js --network goerli`

> Note: Don't ever share the private key that's used to deploy this.

### 3. Get the Contract ABI

In order to connect to the deployed contract you'll need the generated ABI.

Run `yarn build` and then copy the file from `artifacts/contracts/FriendsOnChain.sol/FriendsOnChain.json` to your project.

### 4. Token Metadata + Server Endpoint

By default, we have the contract setup to return the uri for the token in the format `"https://bunches.app/metadata/{id}"`. You're going to want to setup a server endpoint that returns a JSON response that looks like:

`GET /metadata/:id`

Response:

```json
{
  "name": "Friends on Chain",
  "image": "data:application/json;base64,... YOUR PNG BASE 64 HERE"
}
```

> Note: this URL can be changed by editing the `contstructor` function in FriendsOnChain.sol

### 5. Connect to the Contract

Now that you have the address and ABI, use whichever backend eth library you'd like to initialize a contract object using address + abi.

Then call the contract's `createGroup` function with an array of wallet addresses and the URL of the uploaded image:

```ts
contract.createGroup(["0x1234...",...])
```

Unfortunately state change functions won't return a value, so it's a bit tricky to get the newly created. You'll have to listen for the `GroupCreated` event which has the following function signature:

```solidity
event GroupCreated(uint256 tokenId, address[] indexed _to, string _media);
```

You can check for an addresses membership with:

```ts
contract.isMember("0x1234...", "1") // true | false
```

## Contract API:

### createGroup(to: string[], base64media: string):

After the contract is deployed, to create a group a minter will mint() with seven (7) addreses:

```ts
tokenId = contract.createGroup([
  "0x1...",
  "0x2...",
  "0x3...",
  "0x4...",
  "0x5...",
  "0x6...",
  "0x7..."
])
```

This will mint a new token with the 7 addresses with TokenID 1.

> Note: TokenID will automatically be incremented for subsequent creates.

### isMember(address: string, tokenId: string): boolean

To check if an address is a member of the group:

```ts
contract.isMember("0x1...", "1") => true | false
```

### countGroups(): boolean

To see how many groups there are:

```ts
contract.countGroups() => 123
```

## Caveats ...

Currently, transfers are not prohibited so a member of the group may transfer their membership to another address. This would allow someone else to gain access to the group.

This can be disabled but will require overriding `safeTransferFrom` and `safeBatchTransferFrom`.
