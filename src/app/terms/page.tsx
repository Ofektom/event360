export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
        <p className="text-sm text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>
        
        <div className="prose max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="mb-4">
              By accessing and using Event360 ("the Service"), you accept and agree to be bound by the terms and provision of this agreement.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Use License</h2>
            <p className="mb-4">
              Permission is granted to temporarily use Event360 for personal, non-commercial event management purposes. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose or for any public display</li>
              <li>Attempt to reverse engineer any software contained in Event360</li>
              <li>Remove any copyright or other proprietary notations from the materials</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
            <p className="mb-4">
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Provide accurate and complete information when creating an account</li>
              <li>Keep your account information updated</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
              <li>Not share your account credentials with others</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. User Content</h2>
            <p className="mb-4">
              You retain ownership of all content you create, upload, or share on Event360. By using the Service, you grant us a license to:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Store, display, and process your content to provide the Service</li>
              <li>Share your content with guests you invite to your events</li>
              <li>Use your content to improve our services</li>
            </ul>
            <p className="mb-4">
              You are responsible for ensuring you have the right to share any content you upload, including photos, videos, and personal information of guests.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Third-Party Services</h2>
            <p className="mb-4">
              Event360 integrates with third-party services (e.g., Facebook, WhatsApp, Instagram) to provide certain features. Your use of these services is subject to their respective terms of service and privacy policies.
            </p>
            <p className="mb-4">
              When you connect your Facebook account:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>You authorize us to access your Facebook friends list for the purpose of event invitations</li>
              <li>We only access friends who have also authorized our app</li>
              <li>Friend data is used solely for displaying your friends list and sending invitations</li>
              <li>You can disconnect your Facebook account at any time</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Prohibited Uses</h2>
            <p className="mb-4">You agree not to use Event360 to:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Violate any laws or regulations</li>
              <li>Infringe on the rights of others</li>
              <li>Transmit harmful, offensive, or inappropriate content</li>
              <li>Spam or send unsolicited communications</li>
              <li>Interfere with or disrupt the Service</li>
              <li>Attempt to gain unauthorized access to the Service</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Service Availability</h2>
            <p className="mb-4">
              We strive to provide reliable service but do not guarantee that the Service will be available at all times. We may temporarily suspend the Service for maintenance, updates, or other reasons.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Limitation of Liability</h2>
            <p className="mb-4">
              Event360 is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the Service, including but not limited to data loss, service interruptions, or third-party actions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Termination</h2>
            <p className="mb-4">
              We reserve the right to terminate or suspend your account at any time for violation of these Terms. You may delete your account at any time through your account settings.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Changes to Terms</h2>
            <p className="mb-4">
              We reserve the right to modify these Terms at any time. We will notify you of significant changes by posting the updated Terms on this page and updating the "Last updated" date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Contact Information</h2>
            <p className="mb-4">
              If you have questions about these Terms, please contact us at:
            </p>
            <p className="mb-4">
              Email: okpoho_t@yahoo.com
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

