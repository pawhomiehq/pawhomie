/* Payouts — honest state. Shows real earnings; Stripe payout setup is Phase 2. */
Pages.payouts = {
  render(){
    return `${UI.appbar('Get paid','Your earnings','sitterDashboard')}
    <div class="page narrow" id="poView">
      <div class="muted" style="text-align:center;padding:24px">Loading…</div>
    </div>`;
  },
  async mount(){
    var host = document.getElementById('poView');
    var stats = await db.getSitterStats();
    host.innerHTML = `
      <div class="card anim" style="padding:20px;text-align:center">
        <div class="label" style="margin:0">Total earned (completed stays)</div>
        <div class="big-rate" style="font-size:32px;margin-top:4px">$${stats.earnings||0}</div>
        <div class="muted" style="font-size:12.5px">Your 10% service fee is already deducted</div>
      </div>

      <div class="card anim d1" style="padding:16px;margin-top:14px;display:flex;gap:12px;align-items:flex-start">
        <span style="color:var(--gold-dk);flex:none">${UI.icon('wallet',22)}</span>
        <div style="flex:1">
          <b>Bank payouts coming soon</b>
          <div class="muted" style="font-size:12.5px;margin-top:2px;line-height:1.5">We're setting up secure payouts with Stripe. Once it's live, you'll connect your bank here and get paid automatically after each completed stay.</div>
        </div>
      </div>

      <p class="muted" style="font-size:12px;text-align:center;margin-top:16px">Questions about a payment? Message the PawHomie team.</p>`;
  }
};
