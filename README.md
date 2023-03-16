# DevFi Solana Program

This repository contains the solana program required to run devfi.

`Proxy` is a PDA that stores the virtual owner/authority of a wallet. A proxy should point to the real wallet of the developer or the multi-sig of an organisation. A proxy is required to withdraw funds from a Wallet.

`Wallet` is a PDA that is used to send and receive SOL to a user's github account. This PDA also has the github user as a part of its seed.

An account called the `SigningOracle` is used to validate the authentication of a GitHub user. It is akin to saying, if the signing oracle signs a transaction, then the user `id` is authenticated on GitHub.

## Getting started

This project uses anchor and hence the anchor executable is a prerequisite for using this repository.

To build the program, run
```sh
anchor build
```


To run the tests for the program, run
```sh
anchor test
```