import fp from 'fastify-plugin'
import * as Minio from 'minio'

import { MINIO_BUCKET_NAME } from '@promanage/core'

import type { FastifyPluginAsync } from 'fastify'

const minioPlugin: FastifyPluginAsync = async (fastify) => {
  const isDevelopment = process.env['NODE_ENV'] === 'development'

  const endPointEnv = process.env['MINIO_ENDPOINT']
  const endPoint =
    endPointEnv ?? (isDevelopment ? 'localhost' : undefined)
  if (!endPoint) {
    throw new Error('MINIO_ENDPOINT must be set in non-development environments')
  }

  const portEnv = process.env['MINIO_PORT']
  const port =
    portEnv !== undefined
      ? Number.parseInt(portEnv, 10)
      : isDevelopment
        ? 9000
        : NaN
  if (!Number.isFinite(port)) {
    throw new Error('MINIO_PORT must be set to a valid number in non-development environments')
  }

  const useSSL = process.env['MINIO_USE_SSL'] === 'true'

  const accessKeyEnv = process.env['MINIO_ACCESS_KEY']
  const secretKeyEnv = process.env['MINIO_SECRET_KEY']

  const accessKey =
    accessKeyEnv ?? (isDevelopment ? 'minioadmin' : undefined)
  const secretKey =
    secretKeyEnv ?? (isDevelopment ? 'minioadmin' : undefined)

  if (!accessKey || !secretKey) {
    throw new Error(
      'MINIO_ACCESS_KEY and MINIO_SECRET_KEY must be set in non-development environments',
    )
  }

  const client = new Minio.Client({
    endPoint,
    port,
    useSSL,
    accessKey,
    secretKey,
  })

  const bucketExists = await client.bucketExists(MINIO_BUCKET_NAME)
  if (!bucketExists) {
    await client.makeBucket(MINIO_BUCKET_NAME)
    fastify.log.info(`MinIO bucket '${MINIO_BUCKET_NAME}' created`)
  }

  fastify.decorate('minio', client)
  fastify.log.info('MinIO plugin registered')
}

export default fp(minioPlugin, { name: 'minio' })
