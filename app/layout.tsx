import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Projectile Simulator',
  description: 'Interactive 3D projectile motion simulator',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
