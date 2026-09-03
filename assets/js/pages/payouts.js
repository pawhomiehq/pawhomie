/* Payouts — real Stripe Connect onboarding + earnings. */
Pages.payouts = {
  render(){
    return `${UI.appbar('Get paid','Your earnings & payouts','sitterDashboard')}
    <div class="page narrow" id="poView">
      <div class="muted" style="text-align:center;padding:24px">Loading…</div>
    </div>`;
  },
  async mount(){
    var host = document.getElementById('poView');
    var stats = await db.getSitterStats();
    var status = await db.checkPayoutStatus();
    var enabled = !!(status && status.payoutsEnabled);
    var hasAccount = !!(status && status.hasAccount);

    var banner;
    if (enabled){
      banner = `<div class="card anim d1" style="padding:16px;margin-top:14px;display:flex;gap:12px;align-items:flex-start;background:#EAF6EF">
        <span style="color:#1E8E5A;flex:none">${UI.icon('check',22)}</span>
        <div style="flex:1"><b>Payouts active</b>
          <div class="muted" style="font-size:12.5px;margin-top:2px;line-height:1.5">Your bank is connected. After each completed stay, your earnings (minus the 10% service fee) are sent to you automatically.</div>
        </div></div>`;
    } else {
      banner = `<div class="card anim d1" style="padding:16px;margin-top:14px">
        <div style="display:flex;gap:12px;align-items:flex-start">
          <span style="color:var(--gold-dk);flex:none">${UI.icon('wallet',22)}</span>
          <div style="flex:1"><b>${hasAccount ? 'Finish setting up payouts' : 'Set up payouts to get paid'}</b>
            <div class="muted" style="font-size:12.5px;margin-top:2px;line-height:1.5">Connect your bank securely through Stripe. It takes 2 minutes and you'll need a piece of ID and your bank details. You can accept bookings before this, but you'll need it to receive money.</div>
          </div>
        </div>
        <button class="btn gold" id="connectBtn" style="margin-top:14px">${hasAccount ? 'Continue payout setup' : 'Set up payouts'}</button>
        <div id="connectErr" class="authError" style="display:none;margin-top:10px"></div>
      </div>`;
    }

    host.innerHTML = `
      <div class="card anim" style="padding:20px;text-align:center">
        <div class="label" style="margin:0">Total earned (completed stays)</div>
        <div class="big-rate" style="font-size:32px;margin-top:4px">$${stats.earnings||0}</div>
        <div class="muted" style="font-size:12.5px">Your 10% service fee is already deducted</div>
      </div>
      ${banner}
      <p class="muted" style="font-size:12px;text-align:center;margin-top:16px">Payments are handled securely by Stripe. PawHomie never sees your bank details.</p>`;

    var btn = document.getElementById('connectBtn');
    if (btn) btn.addEventListener('click', async function(){
      var err = document.getElementById('connectErr');
      err.style.display = 'none';
      btn.disabled = true; btn.textContent = 'Opening secure setup…';
      try {
        var r = await db.startPayoutOnboarding();
        if (r && r.url){ window.location.href = r.url; }   // go to Stripe's hosted onboarding
        else throw new Error('Could not open payout setup.');
      } catch(e){
        btn.disabled = false; btn.textContent = 'Set up payouts';
        err.textContent = e.message || 'Something went wrong. Please try again.';
        err.style.display = 'block';
      }
    });
  }
};
