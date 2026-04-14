import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI Efficiency Dashboard',
  description: 'AI-Native development efficiency metrics',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  )
}
