export const CHANNEL_MANAGE_ROLES = ['Admin', 'ProjectManager', 'OfficeAdmin'] as const

export const ALLOWED_ATTACHMENT_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/quicktime',
] as const

export const MAX_ATTACHMENT_SIZE_BYTES = 52428800 // 50 MB

export const MINIO_BUCKET_NAME = 'promanage-attachments'
