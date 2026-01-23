/**
 * Enterprise Link Validator
 * Validates URLs for security, phishing, and malicious content
 * Phase 1: Enterprise Link Post Component
 */

import urlParse from 'url-parse'
import type { LinkValidationResult } from '@/types/link-preview'

// Known malicious TLDs and suspicious patterns
const SUSPICIOUS_TLDS = [
  'tk',
  'ml',
  'ga',
  'cf',
  'gq',
  'xyz',
  'top',
  'click',
  'download',
  'stream',
  'online',
]

const PHISHING_KEYWORDS = [
  'verify',
  'confirm',
  'update',
  'secure',
  'account',
  'suspended',
  'locked',
  'urgent',
  'action required',
  'click here',
]

const SUSPICIOUS_DOMAINS = [
  'bit.ly',
  'tinyurl.com',
  't.co',
  'goo.gl',
  'ow.ly',
  'is.gd',
  'short.link',
]

/**
 * Validate URL format and structure
 */
export function validateUrlFormat(url: string): { valid: boolean; error?: string } {
  try {
    const parsed = urlParse(url)
    
    // Check protocol
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'Invalid protocol. Only HTTP and HTTPS are allowed.' }
    }

    // Check hostname
    if (!parsed.hostname || parsed.hostname.length === 0) {
      return { valid: false, error: 'Invalid hostname' }
    }

    // Check for IP addresses (potentially suspicious)
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/
    if (ipRegex.test(parsed.hostname)) {
      return { valid: false, error: 'IP addresses are not allowed. Use domain names.' }
    }

    // Check for localhost/internal IPs
    if (
      parsed.hostname === 'localhost' ||
      parsed.hostname.startsWith('127.') ||
      parsed.hostname.startsWith('192.168.') ||
      parsed.hostname.startsWith('10.') ||
      parsed.hostname.startsWith('172.')
    ) {
      return { valid: false, error: 'Local/internal addresses are not allowed' }
    }

    return { valid: true }
  } catch (error) {
    return { valid: false, error: 'Invalid URL format' }
  }
}

/**
 * Check SSL certificate validity (basic check)
 */
async function checkSslCertificate(url: string): Promise<boolean> {
  try {
    const parsed = urlParse(url)
    if (parsed.protocol !== 'https:') {
      return false
    }

    // Basic SSL check - in production, use a proper SSL validation library
    const response = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000),
    })
    
    return response.ok
  } catch {
    return false
  }
}

/**
 * Check domain reputation (basic heuristic)
 */
function checkDomainReputation(domain: string): 'good' | 'neutral' | 'suspicious' | 'malicious' {
  const lowerDomain = domain.toLowerCase()
  
  // Check for suspicious TLDs
  const tld = lowerDomain.split('.').pop()
  if (tld && SUSPICIOUS_TLDS.includes(tld)) {
    return 'suspicious'
  }

  // Check for known suspicious domains
  if (SUSPICIOUS_DOMAINS.some((d) => lowerDomain.includes(d))) {
    return 'suspicious'
  }

  // Check for suspicious patterns in domain
  if (
    lowerDomain.includes('free') ||
    lowerDomain.includes('win') ||
    lowerDomain.includes('prize') ||
    lowerDomain.includes('click')
  ) {
    return 'suspicious'
  }

  // Well-known domains are generally good
  const wellKnownDomains = [
    'google.com',
    'youtube.com',
    'facebook.com',
    'twitter.com',
    'instagram.com',
    'linkedin.com',
    'github.com',
    'amazon.com',
    'wikipedia.org',
    'reddit.com',
  ]

  if (wellKnownDomains.some((d) => lowerDomain.includes(d))) {
    return 'good'
  }

  return 'neutral'
}

/**
 * Check for phishing indicators
 */
function checkPhishingIndicators(url: string, title?: string, description?: string): boolean {
  const lowerUrl = url.toLowerCase()
  const lowerTitle = (title || '').toLowerCase()
  const lowerDesc = (description || '').toLowerCase()
  const combined = `${lowerUrl} ${lowerTitle} ${lowerDesc}`

  // Check for phishing keywords
  const hasPhishingKeywords = PHISHING_KEYWORDS.some((keyword) =>
    combined.includes(keyword)
  )

  // Check for suspicious URL patterns
  const hasSuspiciousPattern =
    lowerUrl.includes('verify-') ||
    lowerUrl.includes('confirm-') ||
    lowerUrl.includes('update-') ||
    lowerUrl.includes('secure-') ||
    !!lowerUrl.match(/\d{4,}/) // Long number sequences

  return hasPhishingKeywords || hasSuspiciousPattern
}

/**
 * Calculate security score (0-100)
 */
function calculateSecurityScore(
  sslValid: boolean,
  domainReputation: 'good' | 'neutral' | 'suspicious' | 'malicious',
  hasPhishingIndicators: boolean,
  urlFormatValid: boolean
): number {
  let score = 100

  // SSL validation (30 points)
  if (!sslValid) {
    score -= 30
  }

  // Domain reputation (40 points)
  switch (domainReputation) {
    case 'malicious':
      score -= 40
      break
    case 'suspicious':
      score -= 20
      break
    case 'neutral':
      score -= 5
      break
    case 'good':
      // No deduction
      break
  }

  // Phishing indicators (20 points)
  if (hasPhishingIndicators) {
    score -= 20
  }

  // URL format (10 points)
  if (!urlFormatValid) {
    score -= 10
  }

  return Math.max(0, Math.min(100, score))
}

/**
 * Validate link for security and safety
 */
export async function validateLink(
  url: string,
  title?: string,
  description?: string
): Promise<LinkValidationResult> {
  const warnings: string[] = []
  const errors: string[] = []

  // Validate URL format
  const formatCheck = validateUrlFormat(url)
  if (!formatCheck.valid) {
    errors.push(formatCheck.error || 'Invalid URL format')
    return {
      is_valid: false,
      security_score: 0,
      warnings: [],
      errors,
    }
  }

  // Check SSL certificate
  const sslValid = await checkSslCertificate(url)
  if (!sslValid) {
    warnings.push('SSL certificate validation failed or not using HTTPS')
  }

  // Check domain reputation
  const parsed = urlParse(url)
  const domain = parsed.hostname.replace(/^www\./, '')
  const domainReputation = checkDomainReputation(domain)
  
  if (domainReputation === 'suspicious') {
    warnings.push('Domain has suspicious characteristics')
  } else if (domainReputation === 'malicious') {
    errors.push('Domain is flagged as potentially malicious')
  }

  // Check for phishing indicators
  const hasPhishingIndicators = checkPhishingIndicators(url, title, description)
  if (hasPhishingIndicators) {
    warnings.push('URL contains potential phishing indicators')
  }

  // Calculate security score
  const securityScore = calculateSecurityScore(
    sslValid,
    domainReputation,
    hasPhishingIndicators,
    formatCheck.valid
  )

  // Determine if link is valid
  const is_valid = errors.length === 0 && securityScore >= 50

  return {
    is_valid,
    security_score: securityScore,
    warnings,
    errors,
    domain_reputation: domainReputation,
    ssl_valid: sslValid,
    phishing_risk: hasPhishingIndicators,
  }
}
