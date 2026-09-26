/* Fees & Cancellation — Bilal's finalized copy. */
Pages.feeSchedule = {
  render(){
    return `${UI.appbar('Fees & Cancellation','What you pay and our cancellation policy','welcome')}
    <div class="page narrow legal">
<p><strong>Version 1.0 · Effective November 1, 2026</strong></p>
<p>This document is part of the PawHomie Terms of Service. All amounts are in Canadian dollars. Fees are shown to you before you complete a transaction.</p>
<h2>1. Pet Parent Service Fee</h2>
<ul>
<li><strong>7% of the Booking subtotal, minimum $3.50, maximum $25 per Booking.</strong></li>
<li>It is included in the total price shown before you pay.</li>
<li>HST (13%) is added to our fee where it applies and is shown at checkout.</li>
</ul>
<h2>2. Homie Service Fee</h2>
<ul>
<li><strong>15% of the Booking subtotal.</strong></li>
<li><strong>12%</strong> on Bookings with the same Pet Parent after your fourth completed Booking together.</li>
<li>We show your earnings before you accept: &quot;You earn $X, PawHomie fee $Y (Z%).&quot;</li>
<li>HST is added to our fee where it applies.</li>
</ul>
<h2>3. Homie Profile Review Fee</h2>
<ul>
<li>A one-time <strong>$29</strong> fee is charged when you submit your Homie application.</li>
<li><strong>Refunded</strong> to your original payment method within 10 business days after you complete your first Booking.</li>
<li><strong>Refunded</strong> if we decline your application, unless we decline it because you gave false or misleading information.</li>
<li><strong>Not refunded</strong> if you withdraw your application or are removed for false information before completing a Booking.</li>
</ul>
<h2>4. What Is Included</h2>
<p>Card processing costs are included in our fees. We don't charge separate processing fees. There are no fees on tips.</p>
<h2>5. Payments and Payouts</h2>
<ul>
<li>The Pet Parent is charged when the Homie confirms the Booking.</li>
<li>We initiate payout about 48 hours after the Stay ends, subject to the holds described in the Terms. Bank and Stripe processing time may add time.</li>
<li>Refunds go back to the original payment method, usually within 5 to 10 business days.</li>
</ul>
<h2>6. Other Charges</h2>
<ul>
<li><strong>Late pickup:</strong> additional care time at the Booking's daily rate, pro-rated for part-days.</li>
<li><strong>Emergency veterinary and reimbursable costs:</strong> charged to the Pet Parent under the Terms, with a receipt.</li>
<li><strong>Chargebacks:</strong> recoverable from the responsible user under the Terms.</li>
</ul>
<h2>7. Promotions</h2>
<p>Promotions and credits have their own terms, shown when offered, and have no cash value.</p>
<h2>8. Changes to Fees</h2>
<p>We may change fees for future Bookings with at least 30 days' notice. The fees shown when a Booking is confirmed apply to that Booking.</p>
<h2>9. Cancellation Policies</h2>
<p>Each Homie chooses one of these policies for each listing. It is shown before you book and confirmed in your Booking. Times count back from the start time of the Stay, Eastern Time. The refund applies to the <strong>Booking subtotal</strong> (the amount payable to the Homie).</p>
<table>
<thead>
<tr>
<th>Policy</th>
<th>Full refund</th>
<th>50% refund</th>
<th>No refund</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Flexible</strong></td>
<td>48 hours or more before start</td>
<td>24 to 48 hours before</td>
<td>Less than 24 hours before</td>
</tr>
<tr>
<td><strong>Moderate</strong></td>
<td>7 days or more before start</td>
<td>48 hours to 7 days before</td>
<td>Less than 48 hours before</td>
</tr>
<tr>
<td><strong>Strict</strong></td>
<td>14 days or more before start</td>
<td>7 to 14 days before</td>
<td>Less than 7 days before</td>
</tr>
</tbody>
</table>
<p><strong>After the Stay has started:</strong> If you end a Stay early with at least 24 hours' notice through the Platform, unused nights are refunded at 50%. Without that notice, unused nights are not refunded.</p>
<p><strong>Pet Parent service fee:</strong> Refundable only if (a) the Homie cancels, (b) you cancel within 24 hours of booking and the Stay starts at least 7 days later, or (c) we cancel or refund under extraordinary circumstances.</p>
<h2>10. Homie Cancellations</h2>
<p>If a Homie cancels, the Pet Parent receives a full refund, including our service fee. We will use reasonable efforts to help find a replacement, but cannot promise availability, price, or fit. The Pet Parent confirms any replacement Booking. Repeated late cancellations without good reason may lead to account action under the Homie Agreement.</p>
<h2>11. Extraordinary Circumstances</h2>
<p>We may refund on terms different from the selected policy where the cancellation results from events such as the death or serious illness of a pet or of a close family member, a serious emergency affecting the Homie or their home, severe weather, a public-health order, or another event beyond reasonable control. We may ask for reasonable proof.</p>
<h2>12. How to Cancel and Disputes</h2>
<p>Cancel through the Platform. The time you cancel there is the time that counts. If you think a refund is wrong, email <a href="mailto:support@pawhomie.com">support@pawhomie.com</a> within 30 days and we will review it. Nothing here limits your rights under Ontario consumer protection law.</p>
    <div class="legal-disclaimer" style="margin-top:24px">Questions? Email support@pawhomie.com</div>
    <div style="height:30px"></div>
    </div>`;
  }
};
