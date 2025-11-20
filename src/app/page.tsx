import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function Home() {
  const user = await getCurrentUser();

  // Redirect authenticated users to dashboard
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <header className="mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Event360</h1>
          <p className="text-xl text-gray-600">
            Your complete event management platform for celebrations, weddings,
            and special moments
          </p>
        </header>

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Sign Up Card */}
          <Link
            href="/auth/signup"
            className="block p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow border-2 border-transparent hover:border-purple-300"
          >
            <div className="text-4xl mb-4">🎉</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Get Started
            </h2>
            <p className="text-gray-600">
              Create an account and start planning your celebration with
              multiple ceremonies, guest management, and more
            </p>
          </Link>

          {/* Sign In Card */}
          <Link
            href="/auth/signin"
            className="block p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow border-2 border-transparent hover:border-pink-300"
          >
            <div className="text-4xl mb-4">📅</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Sign In
            </h2>
            <p className="text-gray-600">
              Already have an account? Sign in to manage your events,
              ceremonies, and guest lists
            </p>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="p-6 bg-white rounded-xl shadow-md">
            <div className="text-3xl mb-3">💒</div>
            <h3 className="font-semibold text-gray-900 mb-2">
              Multiple Ceremonies
            </h3>
            <p className="text-sm text-gray-600">
              Organize traditional and modern ceremonies in one event
            </p>
          </div>
          <div className="p-6 bg-white rounded-xl shadow-md">
            <div className="text-3xl mb-3">📸</div>
            <h3 className="font-semibold text-gray-900 mb-2">Photo Gallery</h3>
            <p className="text-sm text-gray-600">
              Share photos from WhatsApp, Instagram, and other platforms
            </p>
          </div>
          <div className="p-6 bg-white rounded-xl shadow-md">
            <div className="text-3xl mb-3">📱</div>
            <h3 className="font-semibold text-gray-900 mb-2">
              Social Integration
            </h3>
            <p className="text-sm text-gray-600">
              Send invites via WhatsApp, Messenger, Instagram, and more
            </p>
          </div>
          <div className="p-6 bg-white rounded-xl shadow-md">
            <div className="text-3xl mb-3">🎥</div>
            <h3 className="font-semibold text-gray-900 mb-2">Live Streaming</h3>
            <p className="text-sm text-gray-600">
              Stream your ceremonies live for remote guests
            </p>
          </div>
          <div className="p-6 bg-white rounded-xl shadow-md">
            <div className="text-3xl mb-3">💬</div>
            <h3 className="font-semibold text-gray-900 mb-2">Interactions</h3>
            <p className="text-sm text-gray-600">
              Comments, reactions, and guestbook entries
            </p>
          </div>
          <div className="p-6 bg-white rounded-xl shadow-md">
            <div className="text-3xl mb-3">📋</div>
            <h3 className="font-semibold text-gray-900 mb-2">Event Schedule</h3>
            <p className="text-sm text-gray-600">
              Create detailed schedules for each ceremony
            </p>
          </div>
        </div>

        {/* Quick Start */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-4">Ready to get started?</h2>
          <p className="mb-6 text-purple-100">
            Sign up for free and start planning your celebration today
          </p>
          <Link
            href="/auth/signup"
            className="inline-block bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-colors"
          >
            Sign Up Free
          </Link>
        </div>
      </div>
    </div>
  );
}
