import { Card } from "@/components/atoms/Card";
import Image from "next/image";

interface MediaCardProps {
  src: string;
  alt: string;
  title?: string;
  description?: string;
  onClick?: () => void;
  aspectRatio?: "square" | "landscape" | "portrait";
  loading?: "lazy" | "eager";
}

export function MediaCard({
  src,
  alt,
  title,
  description,
  onClick,
  aspectRatio = "square",
  loading = "lazy",
}: MediaCardProps) {
  const aspectRatios = {
    square: "aspect-square",
    landscape: "aspect-video",
    portrait: "aspect-[3/4]",
  };

  // Determine sizes based on aspect ratio for better optimization.
  const sizes =
    aspectRatio === "square"
      ? "(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
      : aspectRatio === "landscape"
      ? "(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
      : "(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw";

  return (
    <Card
      variant="elevated"
      padding="none"
      className="overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
      onClick={onClick}
    >
      <div
        className={`relative w-full ${aspectRatios[aspectRatio]} bg-gray-100`}
      >
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes={sizes}
          loading={loading}
          quality={85}
        />
      </div>
      {(title || description) && (
        <div className="p-4">
          {title && (
            <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
          )}
          {description && (
            <p className="text-sm text-gray-600">{description}</p>
          )}
        </div>
      )}
    </Card>
  );
}
