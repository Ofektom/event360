import Link from 'next/link'

interface FooterProps {
  variant?: 'dashboard' | 'public'
}

export function Footer({ variant = 'dashboard' }: FooterProps) {
  if (variant === 'public') {
    return (
      <footer className="bg-gray-900 text-white py-12 mt-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Event360</h3>
              <p className="text-gray-400">
                Your complete event management platform for celebrations and special moments.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="#programme" className="hover:text-white transition-colors">
                    Programme
                  </Link>
                </li>
                <li>
                  <Link href="#gallery" className="hover:text-white transition-colors">
                    Gallery
                  </Link>
                </li>
                <li>
                  <Link href="#vendors" className="hover:text-white transition-colors">
                    Vendors
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <p className="text-gray-400">
                Questions about this event?<br />
                Contact the event organizer.
              </p>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Event360. All rights reserved.</p>
          </div>
        </div>
      </footer>
    )
  }

  // Dashboard footer
  return (
    <footer className="bg-gray-50 border-t border-gray-200 py-8 w-full">
      <div className="w-full px-[10px]">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-600 text-sm">
            &copy; {new Date().getFullYear()} Event360. All rights reserved.
          </p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <Link href="/about" className="text-sm text-gray-600 hover:text-purple-600">
              About
            </Link>
            <Link href="/contact" className="text-sm text-gray-600 hover:text-purple-600">
              Contact
            </Link>
            <Link href="/privacy" className="text-sm text-gray-600 hover:text-purple-600">
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

