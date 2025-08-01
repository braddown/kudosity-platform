import type React from "react"

type HeaderProps = {}

const Header: React.FC<HeaderProps> = () => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex items-center justify-between h-16">
        {/* Add your header content here */}
        <div>
          {/* Logo or Brand */}
          Logo
        </div>
        <nav>
          {/* Navigation Links */}
          <a href="#">Home</a>
          <a href="#">About</a>
          <a href="#">Services</a>
          <a href="#">Contact</a>
        </nav>
      </div>
    </header>
  )
}

export default Header
