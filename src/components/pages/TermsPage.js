import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const TermsPage = () => {
  return (
    <article className="max-w-3xl mx-auto px-6 py-16">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800 no-underline mb-8">
        <ArrowLeft size={14} /> Back to Home
      </Link>

      <h1 className="text-3xl font-extrabold text-navy-800 mb-2">Terms of Service</h1>
      <p className="text-sm text-gray-400 mb-10">Last updated: 19 July 2026</p>

      <div className="prose prose-sm max-w-none text-gray-600 space-y-6">
        <section>
          <h2 className="text-lg font-bold text-navy-800 mt-8 mb-3">1. Acceptance of Terms</h2>
          <p>
            By accessing or using TenantBilling at www.tenantbilling.africa (&quot;the Service&quot;), you agree to be bound by
            these Terms of Service. If you do not agree, do not use the Service. The Service is provided by Fivcom Ltd
            via ChatWorks (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-navy-800 mt-8 mb-3">2. Description of Service</h2>
          <p>
            TenantBilling is a cloud-based tenant management software platform that enables property managers and
            landlords in Africa to:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Register and manage buildings, units, and tenants</li>
            <li>Generate and deliver PDF invoices via WhatsApp and email</li>
            <li>Collect rent via mobile money (M-Pesa, MTN MoMo, and others)</li>
            <li>Track water meter readings and calculate usage charges</li>
            <li>Send payment reminders and receipts</li>
            <li>Provide tenant self-service statement access</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-navy-800 mt-8 mb-3">3. Account Registration</h2>
          <p>
            To use the Service, you must register for an account by submitting an application. You agree to provide
            accurate, current, and complete information. You are responsible for maintaining the security of your
            account credentials and for all activities under your account.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-navy-800 mt-8 mb-3">4. Subscription and Pricing</h2>
          <p>
            The Service is billed per tenant per month. Current pricing is displayed on our website and may be
            updated with 30 days notice. Fees are non-refundable except where required by law. We offer both
            monthly and annual billing cycles.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-navy-800 mt-8 mb-3">5. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Use the Service for any unlawful purpose</li>
            <li>Attempt to gain unauthorised access to other accounts or systems</li>
            <li>Upload malicious code or interfere with the Service</li>
            <li>Resell or redistribute the Service without authorisation</li>
            <li>Use the Service to send spam or unsolicited communications</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-navy-800 mt-8 mb-3">6. Data Ownership</h2>
          <p>
            You retain ownership of all data you input into the Service (tenant records, building data, invoices).
            We do not claim ownership over your data. We process your data solely to provide the Service as described
            in our <Link to="/privacy" className="text-purple-600 hover:underline">Privacy Policy</Link>.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-navy-800 mt-8 mb-3">7. Payment Processing</h2>
          <p>
            Rent collection is facilitated through third-party payment processors (PawaPay/ChatWorks). We are not
            responsible for payment processor downtime, failed transactions, or delays beyond our control. Transaction
            fees may apply as determined by the payment provider.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-navy-800 mt-8 mb-3">8. Service Availability</h2>
          <p>
            We strive for 99.9% uptime but do not guarantee uninterrupted service. Scheduled maintenance will be
            communicated in advance where possible. We are not liable for losses arising from service interruptions.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-navy-800 mt-8 mb-3">9. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, TenantBilling and its operators shall not be liable for indirect,
            incidental, special, or consequential damages arising from use of the Service. Our total liability shall
            not exceed the fees paid by you in the 12 months preceding the claim.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-navy-800 mt-8 mb-3">10. Termination</h2>
          <p>
            Either party may terminate the agreement at any time. Upon termination, your access to the Service will
            cease. We will retain your data for 30 days after termination to allow data export, after which it will
            be permanently deleted unless legal retention requirements apply.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-navy-800 mt-8 mb-3">11. Changes to Terms</h2>
          <p>
            We may modify these Terms at any time. Material changes will be communicated via email or in-app notification
            at least 14 days before taking effect. Continued use after changes constitutes acceptance.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-navy-800 mt-8 mb-3">12. Governing Law</h2>
          <p>
            These Terms are governed by the laws of the Republic of Kenya. Disputes shall be resolved through
            arbitration in Nairobi, Kenya, under the Nairobi Centre for International Arbitration rules.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-navy-800 mt-8 mb-3">13. Contact</h2>
          <p>
            For questions about these Terms, contact:<br />
            <strong>TenantBilling (Fivcom Ltd via ChatWorks)</strong><br />
            Email: <a href="mailto:support@tenantbilling.africa" className="text-purple-600 hover:underline">support@tenantbilling.africa</a><br />
            Website: <a href="https://www.tenantbilling.africa" className="text-purple-600 hover:underline">www.tenantbilling.africa</a>
          </p>
        </section>
      </div>
    </article>
  );
};

export default TermsPage;
