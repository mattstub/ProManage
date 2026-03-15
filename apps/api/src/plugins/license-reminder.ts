import fp from 'fastify-plugin'

import { LICENSE_REMINDER_DAILY_THRESHOLD } from '@promanage/core'

import { emitToUser } from '../lib/sse'

import type { FastifyInstance } from 'fastify'

const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000 // 24 hours

async function checkLicenseReminders(fastify: FastifyInstance) {
  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)

  try {
    const reminders = await fastify.prisma.licenseReminder.findMany({
      where: { isActive: true },
      include: {
        license: true,
        notifyUser: { select: { id: true, firstName: true, lastName: true } },
        notifySupervisor: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    for (const reminder of reminders) {
      const { license } = reminder
      if (!license.expirationDate) continue
      if (license.status === 'EXPIRED' || license.status === 'REVOKED') continue

      const msUntilExpiry = license.expirationDate.getTime() - now.getTime()
      const daysUntilExpiry = Math.ceil(msUntilExpiry / (1000 * 60 * 60 * 24))

      if (daysUntilExpiry < 0) continue // already expired
      if (daysUntilExpiry > reminder.daysBeforeExpiration) continue // not yet in window

      const isInDailyWindow = daysUntilExpiry <= LICENSE_REMINDER_DAILY_THRESHOLD

      if (isInDailyWindow) {
        // Daily: skip if already notified today
        if (reminder.lastNotifiedAt && reminder.lastNotifiedAt >= todayStart) continue
      } else {
        // Once per cycle: skip if notified after license was last updated
        if (reminder.lastNotifiedAt && reminder.lastNotifiedAt > license.updatedAt) continue
      }

      const message = daysUntilExpiry === 0
        ? `License "${license.name}" expires today.`
        : `License "${license.name}" expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}.`

      const usersToNotify = [
        reminder.notifyUser,
        ...(reminder.notifySupervisor ? [reminder.notifySupervisor] : []),
      ]

      await Promise.all(
        usersToNotify.map(async (notifyTarget) => {
          const notification = await fastify.prisma.notification.create({
            data: {
              userId: notifyTarget.id,
              organizationId: license.organizationId,
              title: 'License Expiring',
              message,
              type: 'LICENSE_EXPIRING',
              entityId: license.id,
              entityType: 'license',
            },
          })
          emitToUser(fastify, notifyTarget.id, 'notification', {
            id: notification.id,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            entityId: notification.entityId ?? undefined,
            entityType: notification.entityType ?? undefined,
            read: false,
            createdAt: notification.createdAt.toISOString(),
          })
        })
      )

      await fastify.prisma.licenseReminder.update({
        where: { id: reminder.id },
        data: { lastNotifiedAt: now },
      })
    }
  } catch (err) {
    fastify.log.error({ err }, 'license-reminder: check failed')
  }
}

export default fp(async (fastify: FastifyInstance) => {
  // Run once shortly after startup (10s delay to let DB connections settle)
  const startupTimer = setTimeout(() => checkLicenseReminders(fastify), 10_000)

  // Then run every 24 hours
  const interval = setInterval(() => checkLicenseReminders(fastify), CHECK_INTERVAL_MS)

  fastify.addHook('onClose', () => {
    clearTimeout(startupTimer)
    clearInterval(interval)
  })

  fastify.log.info('license-reminder plugin registered (daily check)')
}, { name: 'license-reminder', dependencies: ['prisma'] })
