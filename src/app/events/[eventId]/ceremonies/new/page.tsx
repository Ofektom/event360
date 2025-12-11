"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/templates/DashboardLayout";
import { Card } from "@/components/atoms/Card";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { BackButton } from "@/components/shared/BackButton";

export default function NewCeremonyPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const eventId = params.eventId as string;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
    location: "",
    venue: "",
    dressCode: "",
    notes: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/auth/signin?callbackUrl=/events/${eventId}/ceremonies/new`);
    }
  }, [status, router, eventId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!session?.user) {
      setError("You must be signed in to create a ceremony");
      setLoading(false);
      return;
    }

    try {
      // Combine date and startTime for the date field
      const ceremonyDate = formData.date
        ? new Date(`${formData.date}T${formData.startTime || "00:00"}`)
        : new Date();

      const response = await fetch(`/api/events/${eventId}/ceremonies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          date: ceremonyDate.toISOString(),
          startTime: formData.startTime
            ? new Date(`${formData.date}T${formData.startTime}`).toISOString()
            : null,
          endTime: formData.endTime
            ? new Date(`${formData.date}T${formData.endTime}`).toISOString()
            : null,
          location: formData.location,
          venue: formData.venue,
          dressCode: formData.dressCode,
          notes: formData.notes,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create ceremony");
      }

      const ceremony = await response.json();
      router.push(`/events/${eventId}`);
    } catch (error) {
      console.error("Error creating ceremony:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to create ceremony. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (status === "loading") {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  if (status === "unauthenticated") {
    return null; // Will redirect
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        <div className="mb-4">
          <BackButton href={`/events/${eventId}`} label="Back to Event" />
        </div>
        <Card className="p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Add Ceremony
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Ceremony Name */}
            <Input
              label="Ceremony Name"
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Traditional Marriage, White Wedding"
            />

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe this ceremony..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent"
              />
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Input
                label="Date"
                type="date"
                name="date"
                required
                value={formData.date}
                onChange={handleChange}
              />
              <Input
                label="Start Time"
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
              />
              <Input
                label="End Time"
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
              />
            </div>

            {/* Location and Venue */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Input
                label="Location"
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., Lagos, Nigeria"
              />
              <Input
                label="Venue"
                type="text"
                name="venue"
                value={formData.venue}
                onChange={handleChange}
                placeholder="e.g., Grand Ballroom"
              />
            </div>

            {/* Dress Code */}
            <Input
              label="Dress Code"
              type="text"
              name="dressCode"
              value={formData.dressCode}
              onChange={handleChange}
              placeholder="e.g., Traditional Attire, Formal"
            />

            {/* Notes */}
            <div>
              <label
                htmlFor="notes"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Additional Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                value={formData.notes}
                onChange={handleChange}
                placeholder="Any special instructions or notes..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
                isLoading={loading}
                disabled={loading}
              >
                Create Ceremony
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
