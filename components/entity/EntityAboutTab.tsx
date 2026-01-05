'use client'

import { EntityMetadata } from '@/types/entity'
import { Mail, Phone, Globe, MapPin } from 'lucide-react'

interface EntityAboutTabProps {
  entity: EntityMetadata
  canEdit?: boolean
  onEditClick?: () => void
}

export function EntityAboutTab({
  entity,
  canEdit = false,
  onEditClick,
}: EntityAboutTabProps) {
  const content = entity.bio || entity.about || entity.synopsis || entity.description || ''
  const contact = entity.contact

  return (
    <div className="space-y-6">
      {/* About Content */}
      {content && (
        <div>
          <h3 className="text-lg font-semibold mb-3">About</h3>
          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{content}</p>
        </div>
      )}

      {/* Contact Information */}
      {contact && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Contact Information</h3>
          <div className="space-y-2">
            {contact.email && (
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-500" />
                <a
                  href={`mailto:${contact.email}`}
                  className="text-blue-600 hover:underline"
                >
                  {contact.email}
                </a>
              </div>
            )}

            {contact.phone && (
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-500" />
                <a
                  href={`tel:${contact.phone}`}
                  className="text-blue-600 hover:underline"
                >
                  {contact.phone}
                </a>
              </div>
            )}

            {contact.website && (
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-gray-500" />
                <a
                  href={contact.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {contact.website}
                </a>
              </div>
            )}

            {(contact.city || contact.state || contact.country) && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
                <div className="text-gray-700">
                  {[contact.address_line1, contact.address_line2]
                    .filter(Boolean)
                    .join(', ')}
                  {contact.address_line1 || contact.address_line2 ? <br /> : null}
                  {[contact.city, contact.state, contact.postal_code]
                    .filter(Boolean)
                    .join(', ')}
                  {contact.country && (
                    <>
                      <br />
                      {contact.country}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Social Links */}
      {entity.socialLinks && Object.keys(entity.socialLinks).length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Follow</h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(entity.socialLinks).map(([platform, url]) => (
              <a
                key={platform}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium capitalize"
              >
                {platform}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Edit Button */}
      {canEdit && onEditClick && (
        <button
          onClick={onEditClick}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Edit About
        </button>
      )}
    </div>
  )
}
