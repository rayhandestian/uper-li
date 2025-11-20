import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import DashboardNav from '@/components/DashboardNav'
import Footer from '@/components/Footer'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  // If 2FA is required but not verified, redirect to login
  if (session.user.requires2FA) {
    redirect('/login?message=2FA verification required')
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <DashboardNav session={session} />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex-grow w-full">
        {children}
      </main>
      <Footer />
    </div>
  )
}