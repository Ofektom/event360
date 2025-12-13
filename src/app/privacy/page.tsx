export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        <p className="text-sm text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>
        
        <div className="prose max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="mb-4">
              gbadoo ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and share information when you use our event management platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
            <h3 className="text-xl font-semibold mb-2">2.1 Information You Provide</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>Account information (name, email, phone number)</li>
              <li>Event details and content you create</li>
              <li>Guest information you add to your events</li>
              <li>Photos and media you upload</li>
            </ul>
            
            <h3 className="text-xl font-semibold mb-2">2.2 Information from Third-Party Services</h3>
            <p className="mb-4">
              When you connect your Facebook account, we may access:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Your name and profile picture</li>
              <li>Your friends list (only to display friends you can invite to events)</li>
            </ul>
            <p className="mb-4">
              We only access friends who have also authorized our app. This information is used solely to allow you to invite friends to your events and is not stored permanently or shared with third parties.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 mb-4">
              <li>To provide and improve our services</li>
              <li>To send event invitations on your behalf</li>
              <li>To display your friends list for event invitations</li>
              <li>To communicate with you about your account and events</li>
              <li>To ensure platform security and prevent fraud</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Data Sharing</h2>
            <p className="mb-4">
              We do not sell, trade, or rent your personal information to third parties. We may share information only:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>With your explicit consent</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights and safety</li>
              <li>With service providers who assist in operating our platform (under strict confidentiality agreements)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Facebook Friends Data</h2>
            <p className="mb-4">
              When you connect your Facebook account and use the "Import Facebook Friends" feature:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>We only access friends who have also authorized our app</li>
              <li>Friend data is used solely to display your friends list for event invitations</li>
              <li>We do not store friend data permanently</li>
              <li>We do not share friend data with third parties</li>
              <li>Friend data is not used for advertising or marketing purposes</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Data Security</h2>
            <p className="mb-4">
              We implement appropriate technical and organizational measures to protect your personal information. However, no method of transmission over the internet is 100% secure.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Your Rights</h2>
            <p className="mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Delete your account and data</li>
              <li>Disconnect third-party accounts (e.g., Facebook)</li>
              <li>Opt-out of certain data processing</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Contact Us</h2>
            <p className="mb-4">
              If you have questions about this Privacy Policy, please contact us at:
            </p>
            <p className="mb-4">
              Email: okpoho_t@yahoo.com
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Changes to This Policy</h2>
            <p className="mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

