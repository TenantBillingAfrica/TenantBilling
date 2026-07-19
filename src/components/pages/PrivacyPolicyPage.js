import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const PrivacyPolicyPage = () => {
  return (
    <article className="max-w-3xl mx-auto px-6 py-16">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800 no-underline mb-8">
        <ArrowLeft size={14} /> Back to Home
      </Link>

      <h1 className="text-3xl font-extrabold text-navy-800 mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-400 mb-10">Last updated: 19 July 2026</p>

      <div className="prose prose-sm max-w-none text-gray-600 space-y-6">
        <section>
          <h2 className="text-lg font-bold text-navy-800 mt-8 mb-3">1. Introduction</h2>
          <p>
            TenantBilling (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is a tenant management software platform operated by Fivcom Ltd
            via ChatWorks. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when
            you use our web application and services at www.tenantbilling.africa.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-navy-800 mt-8 mb-3">2. Information We Collect</h2>
          <h3 className="text-base font-semibold text-navy-700 mt-4 mb-2">Personal Data</h3>
          <p>We collect information you provide directly, including:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Name, email address, and phone number (for account registration)</li>
            <li>Tenant details: names, phone numbers, email addresses, unit assignments</li>
            <li>Building and property information</li>
            <li>Payment transaction records (amounts, dates, mobile money references)</li>
            <li>Water meter readings</li>
          </ul>

          <h3 className="text-base font-semibold text-navy-700 mt-4 mb-2">Automatically Collected Data</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>Device type, browser, and operating system</li>
            <li>IP address and approximate location</li>
            <li>Usage patterns and feature interactions</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-navy-800 mt-8 mb-3">3. How We Use Your Information</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>To provide and maintain the TenantBilling service</li>
            <li>To generate and deliver invoices via email and WhatsApp</li>
            <li>To process rent payments through mobile money providers</li>
            <li>To send billing reminders and payment receipts</li>
            <li>To enable tenant self-service statement access</li>
            <li>To improve our software and user experience</li>
            <li>To comply with legal obligations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-navy-800 mt-8 mb-3">4. Data Sharing</h2>
          <p>We share data only with:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Payment processors</strong> (M-Pesa/PawaPay) - to facilitate rent collection</li>
            <li><strong>Messaging providers</strong> (ChatWorks/WhatsApp) - to deliver invoices and notifications</li>
            <li><strong>Cloud infrastructure</strong> (AWS) - to host and operate the platform securely</li>
            <li><strong>Email delivery</strong> (AWS SES) - to send PDF invoices and receipts</li>
          </ul>
          <p className="mt-3">We do not sell personal data to third parties.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-navy-800 mt-8 mb-3">5. Data Security</h2>
          <p>
            We implement industry-standard security measures including encrypted data transmission (TLS/SSL),
            secure authentication (AWS Cognito with SRP), webhook signature verification, and access controls
            with role-based permissions. Data is stored in encrypted AWS DynamoDB databases in the EU (Stockholm) region.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-navy-800 mt-8 mb-3">6. Data Retention</h2>
          <p>
            We retain account data for the duration of your subscription. Invoice and payment records are retained
            for 7 years to comply with financial record-keeping requirements. You may request deletion of your
            account and personal data at any time by contacting us.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-navy-800 mt-8 mb-3">7. Your Rights</h2>
          <p>Depending on your jurisdiction, you may have the right to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Access, correct, or delete your personal data</li>
            <li>Object to or restrict processing</li>
            <li>Data portability</li>
            <li>Withdraw consent at any time</li>
          </ul>
          <p className="mt-3">
            To exercise these rights, contact us at <a href="mailto:privacy@tenantbilling.africa" className="text-purple-600 hover:underline">privacy@tenantbilling.africa</a>.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-navy-800 mt-8 mb-3">8. Cookies</h2>
          <p>
            We use essential cookies for authentication and session management. We do not use
            advertising or tracking cookies. No third-party analytics cookies are set.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-navy-800 mt-8 mb-3">9. International Transfers</h2>
          <p>
            Your data is processed and stored in the EU (AWS Stockholm region). If you access
            the service from Africa or elsewhere, your data is transferred with appropriate safeguards.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-navy-800 mt-8 mb-3">10. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy periodically. Changes will be posted on this page with an
            updated revision date. Continued use of the service constitutes acceptance of changes.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-navy-800 mt-8 mb-3">11. Contact Us</h2>
          <p>
            For privacy inquiries, contact:<br />
            <strong>TenantBilling (Fivcom Ltd via ChatWorks)</strong><br />
            Email: <a href="mailto:privacy@tenantbilling.africa" className="text-purple-600 hover:underline">privacy@tenantbilling.africa</a><br />
            Website: <a href="https://www.tenantbilling.africa" className="text-purple-600 hover:underline">www.tenantbilling.africa</a>
          </p>
        </section>
      </div>
    </article>
  );
};

export default PrivacyPolicyPage;
