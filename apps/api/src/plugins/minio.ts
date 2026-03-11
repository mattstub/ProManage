import fp from 'fastify-plugin'
import * as Minio from 'minio'

import type { FastifyPluginAsync } from 'fastify'
import { MINIO_BUCKET_NAME } from '@promanage/core'

const minioPlugin: FastifyPluginAsync = async (fastify) => {
  const client = new Minio.Client({
    endPoint: process.env['MINIO_ENDPOINT'] ?? 'localhost',
    port: parseInt(process.env['MINIO_PORT'] ?? '9000', 10),
    useSSL: process.env['MINIO_USE_SSL'] === 'true',
    accessKey: process.env['MINIO_ACCESS_KEY'] ?? 'minioadmin',
    secretKey: process.env['MINIO_SECRET_KEY'] ?? 'minioadmin',
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
