import React from 'react'
import { useLocation } from 'react-router-dom'
import Header from './header'
import Footer from './footer'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  
  // Don't show header/footer on auth pages
  const isAuthPage = ['/login', '/signup'].includes(location.pathname)
  
  return (
    <div className="min-h-screen flex flex-col">
      {!isAuthPage && <Header />}
      
      <main className="flex-1">
        {children}
      </main>
      
      {!isAuthPage && <Footer />}
    </div>
  )
}