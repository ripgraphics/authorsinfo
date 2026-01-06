'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { 
  BookOpen, 
  Users, 
  TrendingUp, 
  Zap, 
  BarChart3, 
  MessageSquare,
  Shield,
  Sparkles,
  ArrowRight,
  Check,
  Award,
  Globe,
  Flame
} from 'lucide-react'

export default function LandingPage() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-4 lg:px-8 flex justify-between items-center h-16">
          <div className="flex items-center gap-2 text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            <BookOpen className="w-8 h-8 text-blue-600" />
            Authors Info
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-slate-600 hover:text-slate-900 font-medium transition">
              Sign In
            </Link>
            <Button asChild className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg transition-shadow">
              <Link href="/login">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-4 lg:px-8">
        <div className="max-w-6xl mx-auto text-center space-y-8">
          <div className="space-y-4 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full text-blue-700 text-sm font-semibold">
              <Sparkles className="w-4 h-4" />
              Enterprise-Grade Book Platform
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-slate-900 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                The Future of Book Community
              </span>
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Connect with authors, discover books, track your reading journey, and build meaningful relationships in the world's most advanced book community platform.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-xl transition-all h-12 text-base">
              <Link href="/login">Start Your Journey <ArrowRight className="ml-2 w-5 h-5" /></Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 text-base border-slate-300 hover:bg-slate-50">
              <Link href="/demo">Explore Demo</Link>
            </Button>
          </div>

          {/* Hero Stats */}
          <div className="grid grid-cols-3 gap-4 pt-16">
            <div className="space-y-2">
              <div className="text-3xl font-bold text-blue-600">10K+</div>
              <p className="text-slate-600">Active Readers</p>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-blue-600">50K+</div>
              <p className="text-slate-600">Book Collections</p>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-blue-600">99.9%</div>
              <p className="text-slate-600">Uptime SLA</p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section className="py-20 px-4 sm:px-4 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl font-bold text-slate-900">Powerful Features Built for You</h2>
            <p className="text-xl text-slate-600">Everything you need to connect with the book community</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Feature Card 1 */}
            <Card 
              className="p-4 hover:shadow-xl transition-all border-slate-200 cursor-pointer"
              onMouseEnter={() => setHoveredCard('discovery')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className={`w-12 h-12 rounded-lg mb-4 flex items-center justify-center transition-all ${
                hoveredCard === 'discovery' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'
              }`}>
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Intelligent Discovery</h3>
              <p className="text-slate-600 mb-4">AI-powered recommendations tailored to your taste. Discover books you'll love based on your reading history and preferences.</p>
              <div className="flex items-center text-blue-600 font-semibold text-sm">
                Learn more <ArrowRight className="w-4 h-4 ml-2" />
              </div>
            </Card>

            {/* Feature Card 2 */}
            <Card 
              className="p-4 hover:shadow-xl transition-all border-slate-200 cursor-pointer"
              onMouseEnter={() => setHoveredCard('social')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className={`w-12 h-12 rounded-lg mb-4 flex items-center justify-center transition-all ${
                hoveredCard === 'social' ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-600'
              }`}>
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Social Community</h3>
              <p className="text-slate-600 mb-4">Connect with fellow readers and authors. Join book clubs, discussions, and Q&A sessions with experts in real-time.</p>
              <div className="flex items-center text-indigo-600 font-semibold text-sm">
                Learn more <ArrowRight className="w-4 h-4 ml-2" />
              </div>
            </Card>

            {/* Feature Card 3 */}
            <Card 
              className="p-4 hover:shadow-xl transition-all border-slate-200 cursor-pointer"
              onMouseEnter={() => setHoveredCard('progress')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className={`w-12 h-12 rounded-lg mb-4 flex items-center justify-center transition-all ${
                hoveredCard === 'progress' ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-600'
              }`}>
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Reading Progress</h3>
              <p className="text-slate-600 mb-4">Track your reading journey with detailed analytics. Log sessions, monitor stats, and achieve reading challenges.</p>
              <div className="flex items-center text-purple-600 font-semibold text-sm">
                Learn more <ArrowRight className="w-4 h-4 ml-2" />
              </div>
            </Card>

            {/* Feature Card 4 */}
            <Card 
              className="p-4 hover:shadow-xl transition-all border-slate-200 cursor-pointer"
              onMouseEnter={() => setHoveredCard('gamification')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className={`w-12 h-12 rounded-lg mb-4 flex items-center justify-center transition-all ${
                hoveredCard === 'gamification' ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-600'
              }`}>
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Gamification</h3>
              <p className="text-slate-600 mb-4">Earn badges, climb leaderboards, and build reading streaks. Compete with friends and celebrate your achievements.</p>
              <div className="flex items-center text-amber-600 font-semibold text-sm">
                Learn more <ArrowRight className="w-4 h-4 ml-2" />
              </div>
            </Card>

            {/* Feature Card 5 */}
            <Card 
              className="p-4 hover:shadow-xl transition-all border-slate-200 cursor-pointer"
              onMouseEnter={() => setHoveredCard('analytics')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className={`w-12 h-12 rounded-lg mb-4 flex items-center justify-center transition-all ${
                hoveredCard === 'analytics' ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-600'
              }`}>
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Advanced Analytics</h3>
              <p className="text-slate-600 mb-4">Deep insights into reading patterns. Cohort analysis, churn prediction, and user segmentation for better understanding.</p>
              <div className="flex items-center text-emerald-600 font-semibold text-sm">
                Learn more <ArrowRight className="w-4 h-4 ml-2" />
              </div>
            </Card>

            {/* Feature Card 6 */}
            <Card 
              className="p-4 hover:shadow-xl transition-all border-slate-200 cursor-pointer"
              onMouseEnter={() => setHoveredCard('realtime')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className={`w-12 h-12 rounded-lg mb-4 flex items-center justify-center transition-all ${
                hoveredCard === 'realtime' ? 'bg-rose-600 text-white' : 'bg-rose-100 text-rose-600'
              }`}>
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Real-Time Updates</h3>
              <p className="text-slate-600 mb-4">Instant notifications and live features. Stay connected with presence indicators, typing notifications, and activity streams.</p>
              <div className="flex items-center text-rose-600 font-semibold text-sm">
                Learn more <ArrowRight className="w-4 h-4 ml-2" />
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Advanced Features Section */}
      <section className="py-20 px-4 sm:px-4 lg:px-8 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl font-bold text-slate-900">Enterprise-Grade Capabilities</h2>
            <p className="text-xl text-slate-600">Built for scale, security, and performance</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-600 text-white">
                    <Shield className="h-6 w-6" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Security & Privacy</h3>
                  <p className="mt-2 text-slate-600">Enterprise-grade security with end-to-end encryption, role-based access control, and GDPR compliance.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-600 text-white">
                    <Globe className="h-6 w-6" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Global Scale</h3>
                  <p className="mt-2 text-slate-600">Multi-region deployment with 99.9% uptime SLA. Handles millions of concurrent users with ease.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-purple-600 text-white">
                    <Flame className="h-6 w-6" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Lightning Fast</h3>
                  <p className="mt-2 text-slate-600">Optimized database queries delivering sub-200ms response times. 50-100x faster bulk operations.</p>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-amber-600 text-white">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Multi-Channel Notifications</h3>
                  <p className="mt-2 text-slate-600">In-app, email, and push notifications with granular preferences and quiet hours.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-emerald-600 text-white">
                    <BarChart3 className="h-6 w-6" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Admin Dashboard</h3>
                  <p className="mt-2 text-slate-600">Comprehensive analytics, moderation tools, and user management. Full audit trail and reporting.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-rose-600 text-white">
                    <Sparkles className="h-6 w-6" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">AI-Powered</h3>
                  <p className="mt-2 text-slate-600">Machine learning recommendations, smart search, and predictive analytics for user behavior.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 px-4 sm:px-4 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl font-bold text-slate-900">Built for Everyone</h2>
            <p className="text-xl text-slate-600">Perfect for readers, authors, and publishers</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Readers */}
            <div className="border border-slate-200 rounded-xl p-8 hover:border-blue-300 hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <BookOpen className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">For Readers</h3>
              <ul className="space-y-3 text-slate-600">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Discover books tailored to your taste</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Track and analyze your reading habits</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Connect with fellow book enthusiasts</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Join reading challenges and compete</span>
                </li>
              </ul>
            </div>

            {/* Authors */}
            <div className="border border-slate-200 rounded-xl p-8 hover:border-indigo-300 hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-indigo-100 rounded-lg flex items-center justify-center mb-6">
                <Users className="w-7 h-7 text-indigo-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">For Authors</h3>
              <ul className="space-y-3 text-slate-600">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                  <span>Build direct reader connections</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                  <span>Host Q&A sessions and discussions</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                  <span>Access reader insights and analytics</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                  <span>Promote your books effectively</span>
                </li>
              </ul>
            </div>

            {/* Publishers */}
            <div className="border border-slate-200 rounded-xl p-8 hover:border-purple-300 hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
                <BarChart3 className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">For Publishers</h3>
              <ul className="space-y-3 text-slate-600">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <span>Catalog management at scale</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <span>Monitor trends and audience insights</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <span>Optimize book discovery and reach</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <span>Enterprise reporting and compliance</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 sm:px-4 lg:px-8 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl font-bold text-slate-900">Simple, Transparent Pricing</h2>
            <p className="text-xl text-slate-600">Choose the perfect plan for your needs</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Basic Plan */}
            <Card className="p-8 border-slate-200">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Basic</h3>
              <p className="text-slate-600 mb-6">Perfect for book lovers</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-slate-900">Free</span>
              </div>
              <Button variant="outline" className="w-full mb-6">Get Started</Button>
              <ul className="space-y-3 text-slate-600">
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600" />
                  Personal library
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600" />
                  Book discovery
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600" />
                  Community access
                </li>
              </ul>
            </Card>

            {/* Pro Plan */}
            <Card className="p-8 border-2 border-blue-600 shadow-xl transform scale-105">
              <div className="bg-blue-600 text-white px-4 py-1 rounded-full inline-block mb-4 text-sm font-semibold">
                Most Popular
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Pro</h3>
              <p className="text-slate-600 mb-6">For serious readers</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-slate-900">$9.99</span>
                <span className="text-slate-600">/month</span>
              </div>
              <Button className="w-full mb-6 bg-blue-600 hover:bg-blue-700">Start Free Trial</Button>
              <ul className="space-y-3 text-slate-600">
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-blue-600" />
                  Everything in Basic
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-blue-600" />
                  Advanced analytics
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-blue-600" />
                  Custom reading lists
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-blue-600" />
                  Priority support
                </li>
              </ul>
            </Card>

            {/* Enterprise Plan */}
            <Card className="p-8 border-slate-200">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Enterprise</h3>
              <p className="text-slate-600 mb-6">For publishers & organizations</p>
              <div className="mb-6">
                <span className="text-2xl font-bold text-slate-900">Custom</span>
              </div>
              <Button variant="outline" className="w-full mb-6">Contact Sales</Button>
              <ul className="space-y-3 text-slate-600">
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-slate-600" />
                  Everything in Pro
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-slate-600" />
                  Admin dashboard
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-slate-600" />
                  API access
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-slate-600" />
                  Dedicated support
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-4 lg:px-8 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl font-bold text-white">Ready to Transform Your Reading Life?</h2>
          <p className="text-xl text-blue-100">Join thousands of readers and authors already using Authors Info</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-slate-100 h-12 text-base font-semibold">
              <Link href="/login">Start Free Today</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-blue-700 h-12 text-base font-semibold">
              <Link href="/demo">View Demo</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12 px-4 sm:px-4 lg:px-8">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <h4 className="text-white font-bold mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition">Features</a></li>
              <li><a href="#" className="hover:text-white transition">Pricing</a></li>
              <li><a href="#" className="hover:text-white transition">Security</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition">About</a></li>
              <li><a href="#" className="hover:text-white transition">Blog</a></li>
              <li><a href="#" className="hover:text-white transition">Careers</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition">Privacy</a></li>
              <li><a href="#" className="hover:text-white transition">Terms</a></li>
              <li><a href="#" className="hover:text-white transition">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Follow</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition">Twitter</a></li>
              <li><a href="#" className="hover:text-white transition">LinkedIn</a></li>
              <li><a href="#" className="hover:text-white transition">Discord</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 pt-8 flex justify-between items-center text-sm">
          <p>&copy; 2025 Authors Info. All rights reserved.</p>
          <p>Built with ❤️ for book lovers</p>
        </div>
      </footer>
    </div>
  )
}
