import { Github, Instagram, Linkedin } from 'lucide-react'
import EmailSignupForm from './EmailSignupForm'

export default function Footer() {
  return (
    <footer className="border-t border-border/50 bg-background py-16">
      <div className="container mx-auto px-6">
        {/* Main grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Company Info */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-xl font-bold text-foreground mb-4">Keynotes</h3>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Your space to think and create. Simple, secure, and beautifully designed journaling for everyone.
            </p>
            
            {/* Email Signup Form */}
            <div className="mt-6">
              <h4 className="text-sm font-medium text-foreground mb-3">Stay Updated</h4>
              <EmailSignupForm />
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-lg font-semibold text-foreground mb-4">Product</h4>
            <ul className="space-y-3">
              <li>
                <a 
                  href="#features" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Features
                </a>
              </li>
              <li>
                <a 
                  href="#journal" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Journal
                </a>
              </li>
              <li>
                <a 
                  href="#notes" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Notes
                </a>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-lg font-semibold text-foreground mb-4">Legal</h4>
            <ul className="space-y-3">
              <li>
                <a 
                  href="/privacy" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a 
                  href="/terms" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h4 className="text-lg font-semibold text-foreground mb-4">Social</h4>
            <ul className="space-y-3">
              <li>
                <a 
                  href="https://github.com" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a 
                  href="https://instagram.com" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Instagram
                </a>
              </li>
              <li>
                <a 
                  href="https://linkedin.com" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  LinkedIn
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Horizontal divider */}
        <hr className="border-border/50 mb-8" />

        {/* Bottom section */}
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Copyright */}
          <p className="text-muted-foreground text-sm">
            © 2025 Keynotes. All rights reserved.
          </p>

          {/* Social Icons */}
          <div className="flex items-center space-x-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-accent rounded-lg"
              aria-label="GitHub"
            >
              <Github className="w-5 h-5" />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-accent rounded-lg"
              aria-label="LinkedIn"
            >
              <Linkedin className="w-5 h-5" />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-accent rounded-lg"
              aria-label="Instagram"
            >
              <Instagram className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}