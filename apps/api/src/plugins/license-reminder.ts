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
    // Push filters into the DB query: only active reminders on licenses that have a
    // future expiration date and are not already expired/revoked.
    const reminders = await fastify.prisma.licenseReminder.findMany({
      where: {
        isActive: true,
        license: {
          expirationDate: { not: null, gt: now },
          status: { notIn: ['EXPIRED', 'REVOKED'] },
        },
      },
      include: {
        license: true,
        notifyUser: { select: { id: true, firstName: true, lastName: true } },
        notifySupervisor: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    for (const reminder of reminders) {
      const { license } = reminder
      // expirationDate is guaranteed non-null by the query filter above, but guard defensively
      if (!license.expirationDate) continue
      const msUntilExpiry = license.expirationDate.getTime() - now.getTime()
      const daysUntilExpiry = Math.ceil(msUntilExpiry / (1000 * 60 * 60 * 24))

      if (daysUntilExpiry > reminder.daysBeforeExpiration) continue // not yet in window

      const isInDailyWindow = daysUntilExpiry <= LICENSE_REMINDER_DAILY_THRESHOLD

      if (isInDailyWindow) {
        // Daily: skip if already notified today
        if (reminder.lastNotifiedAt && reminder.lastNotifiedAt >= todayStart) continue
      } else {
        // Once per expiration cycle: updateLicense nulls lastNotifiedAt when expirationDate
        // changes, so a non-null value means we've already fired for this cycle.
        if (reminder.lastNotifiedAt !== null) continue
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
