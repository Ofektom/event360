"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Card } from "@/components/atoms/Card";

interface LoginFormProps {
  callbackUrl?: string;
  eventId?: string;
}

export function LoginForm({
  callbackUrl,
  eventId: propEventId,
}: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Get eventId from props or searchParams
  const eventId = propEventId || searchParams.get("eventId") || null;
  const finalCallbackUrl =
    callbackUrl || searchParams.get("callbackUrl") || "/timeline";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        identifier,
        password,
        redirect: false,
      });

      if (result?.error) {
        // Log the full result for debugging
        console.error("[LOGIN] SignIn result:", {
          error: result.error,
          status: result.status,
          ok: result.ok,
          url: result.url,
        });

        // Provide user-friendly error messages
        if (result.error === "Configuration") {
          setError(
            "Server configuration error. Please contact support or try again later."
          );
        } else {
          setError(result.error);
        }
      } else if (result?.ok) {
        // If eventId is provided, join the event
        if (eventId) {
          try {
            const joinResponse = await fetch(`/api/events/${eventId}/join`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
            });

            if (joinResponse.ok) {
              // Successfully joined event, redirect to event page
              router.push(finalCallbackUrl);
              router.refresh();
              return;
            }
          } catch (joinError) {
            console.error("Error joining event:", joinError);
            // Continue to redirect even if join fails
          }
        }

        // Redirect to callback URL or timeline
        router.push(finalCallbackUrl);
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: "google" | "facebook") => {
    setError("");
    setIsLoading(true);
    try {
      // Include eventId in callback URL for OAuth
      const oauthCallbackUrl = eventId
        ? `${finalCallbackUrl}?eventId=${eventId}`
        : finalCallbackUrl;

      // For mobile, ensure we use window.location for proper redirect
      // This helps with mobile browser OAuth redirect handling
      const result = await signIn(provider, {
        callbackUrl: oauthCallbackUrl,
        redirect: true, // Ensure redirect happens
      });

      // If signIn doesn't redirect (shouldn't happen with redirect: true), handle it
      if (result && !result.ok) {
        setError("Failed to sign in with " + provider);
        setIsLoading(false);
      }
    } catch (err) {
      console.error("OAuth sign in error:", err);
      setError("Failed to sign in with " + provider);
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-900">
          Sign In
        </h2>

        {/* OAuth Buttons */}
        <div className="space-y-3 mb-6">
          <Button
            type="button"
            variant="outline"
            className="w-full flex items-center justify-center gap-3"
            onClick={() => handleOAuthSignIn("google")}
            disabled={isLoading}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full flex items-center justify-center gap-3"
            onClick={() => handleOAuthSignIn("facebook")}
            disabled={isLoading}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Continue with Facebook
          </Button>
        </div>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">
              Or continue with email or phone
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email or Phone Number"
            type="text"
            placeholder="Email or Phone/WhatsApp Number"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            disabled={isLoading}
            autoComplete="username"
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            autoComplete="current-password"
          />

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            isLoading={isLoading}
          >
            Sign In
          </Button>
        </form>
      </div>
    </Card>
  );
}
