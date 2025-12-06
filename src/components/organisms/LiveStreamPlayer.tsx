'use client'

import { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/atoms/Card'
import { Button } from '@/components/atoms/Button'
import Link from 'next/link'

interface LiveStreamPlayerProps {
  streamUrl: string
  ceremonyName?: string
  eventTitle?: string
  eventId?: string
  eventSlug?: string | null
  autoPlay?: boolean
  showControls?: boolean
}

export function LiveStreamPlayer({
  streamUrl,
  ceremonyName,
  eventTitle,
  eventId,
  eventSlug,
  autoPlay = true,
  showControls = true,
}: LiveStreamPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current && autoPlay) {
      videoRef.current.play().catch((err) => {
        console.error('Autoplay failed:', err)
        setError('Autoplay was blocked. Please click play to start the stream.')
      })
    }
  }, [autoPlay, streamUrl])

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play()
      setIsPlaying(true)
      setError(null)
    }
  }

  const handlePause = () => {
    if (videoRef.current) {
      videoRef.current.pause()
      setIsPlaying(false)
    }
  }

  const handleError = () => {
    setError('Failed to load stream. The stream may be offline or the URL is invalid.')
    setIsPlaying(false)
  }

  // Detect stream type
  const isHLS = streamUrl.includes('.m3u8') || streamUrl.includes('hls')
  const isRTMP = streamUrl.startsWith('rtmp://')
  const isYouTube = streamUrl.includes('youtube.com') || streamUrl.includes('youtu.be')
  const isVimeo = streamUrl.includes('vimeo.com')
  const isFacebook = streamUrl.includes('facebook.com')
  const isTwitch = streamUrl.includes('twitch.tv')

  // For RTMP, we'll need to use a different approach (usually requires Flash or a service like Video.js with RTMP plugin)
  // For now, we'll show a message for RTMP
  if (isRTMP) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            RTMP streams require special setup. Please use a streaming service like YouTube Live, Facebook Live, or Vimeo.
          </p>
          <p className="text-sm text-gray-500">
            Stream URL: {streamUrl}
          </p>
        </div>
      </Card>
    )
  }

  // For YouTube, embed the YouTube player
  if (isYouTube) {
    const getYouTubeId = (url: string) => {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
      const match = url.match(regExp)
      return match && match[2].length === 11 ? match[2] : null
    }

    const videoId = getYouTubeId(streamUrl)
    if (videoId) {
      return (
        <Card className="p-0 overflow-hidden">
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?autoplay=${autoPlay ? 1 : 0}`}
              className="absolute top-0 left-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          {(ceremonyName || eventTitle) && (
            <div className="p-4 border-t border-gray-200">
              {ceremonyName && (
                <h3 className="font-semibold text-gray-900">{ceremonyName}</h3>
              )}
              {eventTitle && (
                <Link
                  href={eventSlug ? `/e/${eventSlug}` : eventId ? `/events/${eventId}` : '#'}
                  className="text-sm text-purple-600 hover:text-purple-700"
                >
                  {eventTitle}
                </Link>
              )}
            </div>
          )}
        </Card>
      )
    }
  }

  // For HLS streams, use native support or hls.js if available
  if (isHLS) {
    useEffect(() => {
      if (typeof window !== 'undefined' && videoRef.current) {
        let hlsInstance: any = null

        // Check for native HLS support first (Safari, iOS)
        if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
          videoRef.current.src = streamUrl
          return () => {
            if (videoRef.current) {
              videoRef.current.src = ''
            }
          }
        }

        // For non-Safari browsers, try to use native video tag with HLS
        // Most modern browsers can handle HLS via native video tag
        // If hls.js is needed later, it can be added as an optional dependency
        if (videoRef.current) {
          videoRef.current.src = streamUrl
        }

        // Cleanup function
        return () => {
          if (hlsInstance) {
            hlsInstance.destroy()
            hlsInstance = null
          }
          if (videoRef.current) {
            videoRef.current.src = ''
          }
        }
      }
    }, [streamUrl, autoPlay])
  }

  return (
    <Card className="p-0 overflow-hidden">
      <div className="relative w-full bg-black">
        {/* Live indicator */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-red-600 text-white px-3 py-1.5 rounded-full">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
          <span className="text-sm font-semibold">LIVE</span>
        </div>

        {/* Video player */}
        <video
          ref={videoRef}
          src={!isHLS ? streamUrl : undefined}
          controls={showControls}
          className="w-full h-auto"
          style={{ maxHeight: '80vh' }}
          onPlay={handlePlay}
          onPause={handlePause}
          onError={handleError}
          playsInline
        >
          Your browser does not support the video tag.
        </video>

        {/* Error message */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 text-white p-4">
            <div className="text-center">
              <p className="mb-4">{error}</p>
              <Button onClick={handlePlay} variant="primary">
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* Play button overlay (if not playing) */}
        {!isPlaying && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <button
              onClick={handlePlay}
              className="w-20 h-20 rounded-full bg-white bg-opacity-90 flex items-center justify-center hover:bg-opacity-100 transition-opacity"
            >
              <svg className="w-10 h-10 text-gray-900 ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Stream info */}
      {(ceremonyName || eventTitle) && (
        <div className="p-4 border-t border-gray-200">
          {ceremonyName && (
            <h3 className="font-semibold text-gray-900 mb-1">{ceremonyName}</h3>
          )}
          {eventTitle && (
            <Link
              href={eventSlug ? `/e/${eventSlug}` : eventId ? `/events/${eventId}` : '#'}
              className="text-sm text-purple-600 hover:text-purple-700"
            >
              {eventTitle}
            </Link>
          )}
        </div>
      )}
    </Card>
  )
}

