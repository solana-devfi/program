use anchor_lang::{prelude::*, system_program};

declare_id!("8KFc1kae5g8LqAwmZHskgaSYjaHXpt9PCRwKNtuajgAa");

#[program]
pub mod git_to_earn {

    use super::*;

    pub fn initialize(ctx: Context<Initialize>, signing_oracle: Pubkey) -> Result<()> {
        ctx.accounts.state.signing_oracle = signing_oracle;
        Ok(())
    }

    pub fn initialize_user_owner(
        ctx: Context<InitializeUserOwner>,
        user_id: String,
        is_org: bool,
    ) -> Result<()> {
        require_keys_eq!(ctx.accounts.wallet_proxy.authority, Pubkey::default());
        ctx.accounts.wallet_proxy.authority = ctx.accounts.signer.key();

        if is_org {
            ctx.accounts.state.org_list.push(user_id);
        }

        Ok(())
    }

    pub fn transfer(
        ctx: Context<Transfer>,
        sender_id: String,
        _receiver_id: String,
        amount: u64,
    ) -> Result<()> {
        let bump = vec![*ctx.bumps.get("sender_wallet").unwrap()];
        let seeds = &[b"wallet".as_ref(), sender_id.as_bytes(), bump.as_slice()];
        let seeds = &[&seeds[..]];

        let cpi_context = CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.sender_wallet.to_account_info(),
                to: ctx.accounts.receiver_wallet.to_account_info(),
            },
            seeds,
        );

        system_program::transfer(cpi_context, amount)?;

        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>, user_id: String, amount: u64) -> Result<()> {
        let bump = vec![*ctx.bumps.get("user_wallet").unwrap()];
        let seeds = &[b"wallet".as_ref(), user_id.as_bytes(), bump.as_slice()];
        let seeds = &[&seeds[..]];

        let cpi_context = CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.user_wallet.to_account_info(),
                to: ctx.accounts.authority.to_account_info(),
            },
            seeds,
        );
        system_program::transfer(cpi_context, amount)?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = signer,
        space = 8 + State::MAXIMUM_SIZE,
        seeds = [b"state"],
        bump
    )]
    pub state: Box<Account<'info, State>>,

    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(user_id: String)]
pub struct InitializeUserOwner<'info> {
    #[account(
        init_if_needed,
        payer = signer,
        space = 8 + WalletProxy::MAXIMUM_SIZE,
        seeds = [b"proxy".as_ref(), user_id.as_bytes()],
        bump
    )]
    pub wallet_proxy: Box<Account<'info, WalletProxy>>,

    #[account(mut, seeds = [b"state"], bump, has_one = signing_oracle)]
    pub state: Box<Account<'info, State>>,

    #[account(mut)]
    pub signing_oracle: Signer<'info>,

    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(sender_id: String, _receiver_id: String)]
pub struct Transfer<'info> {
    /// CHECK:
    #[account(
        mut,
        seeds = [b"wallet".as_ref(), sender_id.as_bytes()],
        bump,
    )]
    pub sender_wallet: AccountInfo<'info>,

    /// CHECK:
    #[account(
        mut,
        seeds = [b"wallet".as_ref(), _receiver_id.as_bytes()],
        bump
    )]
    pub receiver_wallet: AccountInfo<'info>,

    #[account(seeds = [b"state"], bump, has_one = signing_oracle)]
    pub state: Box<Account<'info, State>>,

    #[account(mut)]
    pub signing_oracle: Signer<'info>,

    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(user_id: String)]
pub struct Withdraw<'info> {
    #[account(
        seeds = [b"proxy".as_ref(), user_id.as_bytes()],
        bump,
        has_one = authority,
    )]
    pub user_proxy: Box<Account<'info, WalletProxy>>,

    /// CHECK:
    #[account(
        mut,
        seeds = [b"wallet".as_ref(), user_id.as_bytes()],
        bump,
    )]
    pub user_wallet: AccountInfo<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct State {
    pub signing_oracle: Pubkey,
    pub org_list: Vec<String>,
}

impl State {
    pub const MAXIMUM_SIZE: usize = 32 + // signing_oracle Pubkey 
        4 + // size of org_list vector 
        (4 + 24) * 150; // support a maximum of 150 org strings of length 24
}

#[account]
pub struct WalletProxy {
    pub authority: Pubkey,
}

impl WalletProxy {
    pub const MAXIMUM_SIZE: usize = 32;
}
