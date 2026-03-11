'use client'

import { useRef, useState } from 'react'
import { PaperClipIcon } from '@heroicons/react/24/outline'

import { Button } from '@promanage/ui-components'

import { ALLOWED_ATTACHMENT_MIME_TYPES, MAX_ATTACHMENT_SIZE_BYTES } from '@promanage/core'

import { useConfirmAttachment, useGetUploadUrl } from '@/hooks/use-channels'

interface AttachmentUploaderProps {
  channelId: string
  messageId: string
}

/**
 * 3-step attachment flow:
 * 1. Get presigned PUT URL from API
 * 2. Upload file directly to MinIO using the presigned URL
 * 3. Confirm the attachment via API so it's linked to the message
 */
export function AttachmentUploader({ channelId, messageId }: AttachmentUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  const getUploadUrl = useGetUploadUrl(channelId)
  const confirmAttachment = useConfirmAttachment(channelId)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)

    if (!ALLOWED_ATTACHMENT_MIME_TYPES.includes(file.type as typeof ALLOWED_ATTACHMENT_MIME_TYPES[number])) {
      setError('File type not allowed.')
      return
    }
    if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
      setError('File exceeds the 50 MB limit.')
      return
    }

    setStatus('uploading')

    try {
      // Step 1: get presigned PUT URL
      const { uploadUrl, storageKey } = await getUploadUrl.mutateAsync({
        filename: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
      })

      // Step 2: upload directly to MinIO
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      })
      if (!uploadRes.ok) throw new Error('Upload to storage failed')

      // Step 3: confirm with API
      await confirmAttachment.mutateAsync({
        messageId,
        data: {
          filename: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
          storageKey,
        },
      })

      setStatus('done')
      setTimeout(() => setStatus('idle'), 2000)
    } catch {
      setStatus('error')
      setError('Upload failed. Please try again.')
    }

    // Reset file input so the same file can be re-uploaded if needed
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_ATTACHMENT_MIME_TYPES.join(',')}
        className="hidden"
        onChange={handleFileChange}
        id={`attachment-${messageId}`}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={status === 'uploading'}
        onClick={() => inputRef.current?.click()}
        title="Attach file"
      >
        <PaperClipIcon className="h-4 w-4" />
      </Button>
      {status === 'uploading' && (
        <span className="text-xs text-gray-500">Uploading…</span>
      )}
      {status === 'done' && (
        <span className="text-xs text-green-600">Uploaded!</span>
      )}
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
}
