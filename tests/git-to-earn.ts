import { Program } from "@project-serum/anchor";
import * as anchor from "@project-serum/anchor";
import { GitToEarn } from "../target/types/git_to_earn";
import idl from "../target/idl/git_to_earn.json";

describe("git-to-earn", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const programId = "8KFc1kae5g8LqAwmZHskgaSYjaHXpt9PCRwKNtuajgAa"

  const program = new anchor.Program(idl, programId);
  // const program = anchor.workspace.GitToEarn as Program<GitToEarn>;

  const airdrop = async (to: anchor.web3.PublicKey) => {
    await program.provider.connection.requestAirdrop(to, anchor.web3.LAMPORTS_PER_SOL);
    await new Promise(r => setTimeout(r, 1000));
  };

  it("Good workflow", async () => {
    const [state, _stateBump] = anchor.web3.PublicKey.findProgramAddressSync([Buffer.from("state")], program.programId);
    const signingOracle = anchor.web3.Keypair.generate();

    console.log(signingOracle.publicKey.toBase58());
    console.log(signingOracle.secretKey);

    await program.methods.initialize(signingOracle.publicKey).accounts(
      {
        state: state,
        signer: program.provider.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      }
    ).rpc();

    //   const orgId = Buffer.from("org");
    //   const [orgProxy, _orgProxyBump] = anchor.web3.PublicKey.findProgramAddressSync([Buffer.from("proxy"), orgId], program.programId);
    //   const [orgWallet, _orgWalletBump] = anchor.web3.PublicKey.findProgramAddressSync([Buffer.from("wallet"), orgId], program.programId);
    //
    //   const devId = Buffer.from("prodev");
    //   const [devProxy, _devProxyBump] = anchor.web3.PublicKey.findProgramAddressSync([Buffer.from("proxy"), devId], program.programId);
    //   const [devWallet, _devWalletBump] = anchor.web3.PublicKey.findProgramAddressSync([Buffer.from("wallet"), devId], program.programId);
    //
    //   await program.methods.initializeUserOwner(orgId.toString(), true).accounts({
    //     walletProxy: orgProxy,
    //     state,
    //     signingOracle: signingOracle.publicKey,
    //     signer: program.provider.publicKey,
    //     systemProgram: anchor.web3.SystemProgram.programId,
    //   }).signers([signingOracle]).rpc(); // Here: provider wallet becomes virtual owner of orgProxy/orgWallet 
    //
    //   await airdrop(orgWallet);
    //
    //   await program.methods.transfer(orgId.toString(), devId.toString(), new anchor.BN(0.5 * anchor.web3.LAMPORTS_PER_SOL)).accounts(
    //     {
    //       senderWallet: orgWallet,
    //       receiverWallet: devWallet,
    //       state,
    //       signingOracle: signingOracle.publicKey,
    //       signer: program.provider.publicKey,
    //       systemProgram: anchor.web3.SystemProgram.programId,
    //     }
    //   ).signers([signingOracle]).rpc(); // transferring to dev who hasn't initialised yet
    //
    //   await program.methods.initializeUserOwner(devId.toString(), false).accounts({
    //     walletProxy: devProxy,
    //     state,
    //     signingOracle: signingOracle.publicKey,
    //     signer: program.provider.publicKey,
    //     systemProgram: anchor.web3.SystemProgram.programId,
    //   }).signers([signingOracle]).rpc(); // Here: provider wallet becomes virtual owner of devProxy/devWallet
    //
    //   await program.methods.withdraw(devId.toString(), new anchor.BN(0.1 * anchor.web3.LAMPORTS_PER_SOL)).accounts(
    //     {
    //       userProxy: devProxy,
    //       userWallet: devWallet,
    //
    //       authority: program.provider.publicKey,
    //       systemProgram: anchor.web3.SystemProgram.programId,
    //     }
    //   ).rpc();
    //
    //   console.log((await program.account.state.fetch(state)).orgList);
  });
});
