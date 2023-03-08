import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { GitToEarn } from "../target/types/git_to_earn";

describe("git-to-earn", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.GitToEarn as Program<GitToEarn>;

  const airdrop = async (to: anchor.web3.PublicKey) => {
    await program.provider.connection.requestAirdrop(to, anchor.web3.LAMPORTS_PER_SOL);
    await new Promise(r => setTimeout(r, 1000));
  };

  it("Good workflow", async () => {
    const [state, _stateBump] = anchor.web3.PublicKey.findProgramAddressSync([Buffer.from("state")], program.programId);
    const signingOracle = anchor.web3.Keypair.generate();

    await program.methods.initialize(signingOracle.publicKey).accounts(
      {
        state: state,
        signer: program.provider.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      }
    ).rpc();

    const user1Id = Buffer.from("GitHubUser1");
    const [user1Proxy, _user1ProxyBump] = anchor.web3.PublicKey.findProgramAddressSync([Buffer.from("proxy"), user1Id], program.programId);
    const [user1Wallet, _user1WalletBump] = anchor.web3.PublicKey.findProgramAddressSync([Buffer.from("wallet"), user1Id], program.programId);

    const user2Id = Buffer.from("GitHubUser2");
    const [user2Proxy, _user2ProxyBump] = anchor.web3.PublicKey.findProgramAddressSync([Buffer.from("proxy"), user2Id], program.programId);
    const [user2Wallet, _user2WalletBump] = anchor.web3.PublicKey.findProgramAddressSync([Buffer.from("wallet"), user2Id], program.programId);

    await program.methods.initializeUserOwner(user1Id).accounts({
      walletProxy: user1Proxy,
      state,
      signingOracle: signingOracle.publicKey,
      signer: program.provider.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    }).signers([signingOracle]).rpc(); // Here: provider wallet becomes virtual owner of user1Proxy/user1Wallet

    await airdrop(user1Wallet);

    await program.methods.transfer(user1Id, user2Id, new anchor.BN(0.5 * anchor.web3.LAMPORTS_PER_SOL)).accounts(
      {
        senderWallet: user1Wallet,
        receiverWallet: user2Wallet,
        state,
        signingOracle: signingOracle.publicKey,
        signer: program.provider.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      }
    ).signers([signingOracle]).rpc(); // transferring to user2 who hasn't initialised yet

    await program.methods.initializeUserOwner(user2Id).accounts({
      walletProxy: user2Proxy,
      state,
      signingOracle: signingOracle.publicKey,
      signer: program.provider.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    }).signers([signingOracle]).rpc(); // Here: provider wallet becomes virtual owner of user2Proxy/user2Wallet

    await program.methods.withdraw(user2Id, new anchor.BN(0.1 * anchor.web3.LAMPORTS_PER_SOL)).accounts(
      {
        userProxy: user2Proxy,
        userWallet: user2Wallet,

        authority: program.provider.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      }
    ).rpc();
  });
});
