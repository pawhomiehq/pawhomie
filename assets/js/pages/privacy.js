/* Privacy Policy — DRAFT. Bilal's lawyer must review before launch.
   Written for a Canadian (PIPEDA) pet-sitting marketplace. */

Pages.privacy = {
  render(){
    return `${UI.appbar('Privacy Policy','How we handle your data','welcome')}
    <div class="page narrow legal">
      <p class="legal-updated">Last updated: 2026 · <b>Draft — pending legal review</b></p>

      <p>PawHomie ("we", "us", "our") connects pet owners with pet sitters ("Paw Homies") in the Greater Toronto Area. This policy explains what personal information we collect, why, and your rights under Canada's <b>Personal Information Protection and Electronic Documents Act (PIPEDA)</b>.</p>

      <h2>1. Information we collect</h2>
      <p>We collect information you give us and information created as you use PawHomie:</p>
      <ul>
        <li><b>Account details</b> — name, email, area/city, password (stored encrypted).</li>
        <li><b>Profile details</b> — profile photo, pets, services, rates, availability.</li>
        <li><b>Verification details</b> — for Paw Homies, government ID and related documents; for owners, ID and pet vaccination documents.</li>
        <li><b>Booking &amp; message data</b> — bookings, reviews, and messages between owners and sitters.</li>
        <li><b>Payment data</b> — handled by our payment processor (Stripe). We do not store your full card number.</li>
        <li><b>Technical data</b> — basic device/usage information needed to run and secure the service.</li>
      </ul>

      <h2>2. Why we use it</h2>
      <ul>
        <li>To create and manage your account and bookings.</li>
        <li>To verify identities and keep the community safe.</li>
        <li>To process payments and payouts.</li>
        <li>To enable messaging, reviews, and support.</li>
        <li>To send service emails (confirmations, booking updates).</li>
        <li>To meet legal and security obligations.</li>
      </ul>

      <h2>3. Consent</h2>
      <p>By creating an account and using PawHomie, you consent to the collection and use of your information as described here. You can withdraw consent at any time by closing your account (subject to legal record-keeping requirements).</p>

      <h2>4. Sharing</h2>
      <p>We share information only as needed to run the service: between matched owners and sitters (e.g. name, profile, messages relevant to a booking), and with service providers such as Stripe (payments), Supabase (secure data hosting), and Resend (email delivery). We do <b>not</b> sell your personal information.</p>

      <h2>5. Storage &amp; security</h2>
      <p>Your data is stored on secure infrastructure with access controls and encryption in transit. Verification documents are kept in private storage accessible only to authorized review. No system is perfectly secure, but we take reasonable steps to protect your information.</p>

      <h2>6. Your rights (PIPEDA)</h2>
      <p>You may request access to the personal information we hold about you, ask us to correct it, or request deletion of your account and associated data. To make a request, email <a href="mailto:privacy@pawhomie.com">privacy@pawhomie.com</a>. We aim to respond within 30 days.</p>

      <h2>7. Data retention</h2>
      <p>We keep your information while your account is active and as needed for legal, tax, and safety purposes. When no longer needed, it is deleted or anonymized.</p>

      <h2>8. Children</h2>
      <p>PawHomie is not intended for anyone under 18. We do not knowingly collect information from minors.</p>

      <h2>9. Changes</h2>
      <p>We may update this policy. Material changes will be posted here with a new "last updated" date.</p>

      <h2>10. Contact</h2>
      <p>Questions about privacy? Email <a href="mailto:privacy@pawhomie.com">privacy@pawhomie.com</a>.</p>

      <div class="legal-disclaimer">This is a working draft provided for convenience and must be reviewed and approved by a qualified lawyer before launch. It is not legal advice.</div>
      <div style="height:30px"></div>
    </div>`;
  }
};
