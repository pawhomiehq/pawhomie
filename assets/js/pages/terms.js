/* Terms of Service — DRAFT. Bilal's lawyer must review before launch. */

Pages.terms = {
  render(){
    return `${UI.appbar('Terms of Service','The rules of using PawHomie','welcome')}
    <div class="page narrow legal">
      <p class="legal-updated">Last updated: 2026 · <b>Draft — pending legal review</b></p>

      <p>Welcome to PawHomie. By using our platform you agree to these Terms. Please read them carefully.</p>

      <h2>1. What PawHomie is</h2>
      <p>PawHomie is a marketplace that connects pet owners with independent pet sitters ("Paw Homies"). We are a platform — we are not a party to the care arrangement itself, and Paw Homies are independent, not employees of PawHomie.</p>

      <h2>2. Eligibility</h2>
      <p>You must be at least 18 and able to form a binding contract. You agree to provide accurate information and keep it up to date.</p>

      <h2>3. Accounts</h2>
      <p>You are responsible for your account and for keeping your password secure. Tell us immediately of any unauthorized use.</p>

      <h2>4. Bookings &amp; payments</h2>
      <ul>
        <li>Owners request bookings; Paw Homies accept or decline.</li>
        <li>When a booking is confirmed, the owner's payment is held and captured after the stay is complete.</li>
        <li>PawHomie charges a service fee (currently 10%), retained from each booking.</li>
        <li>Paw Homies receive their earnings via our payment processor after completion.</li>
        <li>Prices are shown before you confirm. Applicable taxes (e.g. HST) are added.</li>
      </ul>

      <h2>5. Cancellations</h2>
      <p>Bookings may be cancelled per the cancellation terms shown at booking. Unpaid pending bookings may be automatically cancelled after 48 hours. Held funds are released when a booking is cancelled or declined.</p>

      <h2>6. Verification &amp; conduct</h2>
      <p>Paw Homies complete identity verification and a safety quiz, and are approved before appearing publicly. You agree to treat others respectfully, provide honest reviews, and not misuse the platform. We may suspend or remove accounts that break these Terms or endanger pets or people.</p>

      <h2>7. Your responsibilities</h2>
      <p>Owners are responsible for accurate information about their pets, including health and behaviour. Paw Homies are responsible for providing safe, attentive care. You arrange care directly with each other; PawHomie facilitates but does not supervise the care.</p>

      <h2>8. Reviews &amp; content</h2>
      <p>You keep ownership of content you post but grant PawHomie a licence to display it on the platform. Reviews must be genuine. We may remove content that is false, abusive, or breaks these Terms.</p>

      <h2>9. Disclaimers &amp; liability</h2>
      <p>PawHomie is provided "as is." To the extent permitted by law, we are not liable for the acts of owners or sitters, or for indirect or consequential damages. Nothing in these Terms limits rights that cannot be limited under applicable law.</p>

      <h2>10. Payments processor</h2>
      <p>Payments and payouts are handled by Stripe and are subject to Stripe's terms. PawHomie does not store full card numbers.</p>

      <h2>11. Changes</h2>
      <p>We may update these Terms. Continued use after changes means you accept the updated Terms.</p>

      <h2>12. Governing law</h2>
      <p>These Terms are governed by the laws of the Province of Ontario and applicable laws of Canada.</p>

      <h2>13. Contact</h2>
      <p>Questions? Email <a href="mailto:support@pawhomie.com">support@pawhomie.com</a>.</p>

      <div class="legal-disclaimer">This is a working draft provided for convenience and must be reviewed and approved by a qualified lawyer before launch. It is not legal advice.</div>
      <div style="height:30px"></div>
    </div>`;
  }
};
