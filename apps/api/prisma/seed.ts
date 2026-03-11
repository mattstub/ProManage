import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import {
  ROLE_NAMES,
  USER_ROLES,
  DEFAULT_ROLE_PERMISSIONS,
  RESOURCES,
  ACTIONS,
} from '@promanage/core'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // 1. Create all permissions
  console.log('Creating permissions...')
  const permissions: Record<string, string> = {}

  for (const resource of RESOURCES) {
    for (const action of ACTIONS) {
      const perm = await prisma.permission.upsert({
        where: { resource_action: { resource, action } },
        update: {},
        create: { resource, action },
      })
      permissions[`${resource}:${action}`] = perm.id
    }
  }

  // 2. Create demo organization
  console.log('Creating demo organization...')
  const org = await prisma.organization.upsert({
    where: { slug: 'demo-construction' },
    update: {},
    create: {
      name: 'Demo Construction Co.',
      slug: 'demo-construction',
      address: '123 Builder Lane, Construction City, TX 75001',
      phone: '(555) 123-4567',
      email: 'info@democonstruction.com',
    },
  })

  // 3. Create system roles with permissions
  console.log('Creating roles and assigning permissions...')
  const roleRecords: Record<string, string> = {}

  for (const roleName of ROLE_NAMES) {
    const roleInfo = USER_ROLES[roleName]
    const role = await prisma.role.upsert({
      where: { name_organizationId: { name: roleName, organizationId: org.id } },
      update: {},
      create: {
        name: roleName,
        description: roleInfo.description,
        isSystem: true,
        organizationId: org.id,
      },
    })
    roleRecords[roleName] = role.id

    // Assign permissions to role
    const rolePerms = DEFAULT_ROLE_PERMISSIONS[roleName] || []
    for (const perm of rolePerms) {
      const permId = permissions[`${perm.resource}:${perm.action}`]
      if (permId) {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: role.id, permissionId: permId } },
          update: {},
          create: { roleId: role.id, permissionId: permId },
        })
      }
    }
  }

  // 4. Create demo users
  console.log('Creating demo users...')
  const passwordHash = await bcrypt.hash('password123', 10)

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      email: 'admin@demo.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      phone: '(555) 100-0001',
      organizationId: org.id,
    },
  })

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: roleRecords['Admin'] } },
    update: {},
    create: { userId: adminUser.id, roleId: roleRecords['Admin'] },
  })

  const pmUser = await prisma.user.upsert({
    where: { email: 'pm@demo.com' },
    update: {},
    create: {
      email: 'pm@demo.com',
      passwordHash,
      firstName: 'Pat',
      lastName: 'Manager',
      phone: '(555) 100-0002',
      organizationId: org.id,
    },
  })

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: pmUser.id, roleId: roleRecords['ProjectManager'] } },
    update: {},
    create: { userId: pmUser.id, roleId: roleRecords['ProjectManager'] },
  })

  const fieldUser = await prisma.user.upsert({
    where: { email: 'field@demo.com' },
    update: {},
    create: {
      email: 'field@demo.com',
      passwordHash,
      firstName: 'Frank',
      lastName: 'Field',
      phone: '(555) 100-0003',
      organizationId: org.id,
    },
  })

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: fieldUser.id, roleId: roleRecords['FieldUser'] } },
    update: {},
    create: { userId: fieldUser.id, roleId: roleRecords['FieldUser'] },
  })

  // 5. Create demo projects
  console.log('Creating demo projects...')
  const project1 = await prisma.project.upsert({
    where: {
      number_organizationId: { number: 'PRJ-2026-001', organizationId: org.id },
    },
    update: {},
    create: {
      name: 'Downtown Office Renovation',
      number: 'PRJ-2026-001',
      type: 'Commercial',
      status: 'Active',
      description: 'Complete interior renovation of a 3-story office building in downtown.',
      address: '456 Commerce St, Construction City, TX 75001',
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-09-30'),
      organizationId: org.id,
    },
  })

  await prisma.project.upsert({
    where: {
      number_organizationId: { number: 'PRJ-2026-002', organizationId: org.id },
    },
    update: {},
    create: {
      name: 'Municipal Fire Station #7',
      number: 'PRJ-2026-002',
      type: 'Municipal',
      status: 'Bidding',
      description: 'New construction of a 12,000 sq ft fire station with 3 bays.',
      address: '789 Emergency Way, Suburb Town, TX 75050',
      organizationId: org.id,
    },
  })

  // 6. Create demo channels
  console.log('Creating demo channels...')

  const channelPermissionDefaults = [
    { roleName: 'Admin', canRead: true, canWrite: true, canManage: true },
    { roleName: 'ProjectManager', canRead: true, canWrite: true, canManage: false },
    { roleName: 'Superintendent', canRead: true, canWrite: true, canManage: false },
    { roleName: 'Foreman', canRead: true, canWrite: true, canManage: false },
    { roleName: 'FieldUser', canRead: true, canWrite: false, canManage: false },
    { roleName: 'OfficeAdmin', canRead: true, canWrite: true, canManage: false },
  ]

  const generalChannel = await prisma.channel.upsert({
    where: { organizationId_slug: { organizationId: org.id, slug: 'general' } },
    update: {},
    create: {
      name: 'General',
      slug: 'general',
      description: 'Company-wide announcements and general discussion.',
      isPrivate: false,
      organizationId: org.id,
    },
  })

  for (const perm of channelPermissionDefaults) {
    await prisma.channelPermission.upsert({
      where: { channelId_roleName: { channelId: generalChannel.id, roleName: perm.roleName } },
      update: {},
      create: { channelId: generalChannel.id, ...perm },
    })
  }

  await prisma.channelMember.createMany({
    data: [
      { channelId: generalChannel.id, userId: adminUser.id },
      { channelId: generalChannel.id, userId: pmUser.id },
      { channelId: generalChannel.id, userId: fieldUser.id },
    ],
    skipDuplicates: true,
  })

  const projectChannel = await prisma.channel.upsert({
    where: { organizationId_slug: { organizationId: org.id, slug: 'project-alpha' } },
    update: {},
    create: {
      name: 'Project Alpha',
      slug: 'project-alpha',
      description: 'Discussion for Downtown Office Renovation.',
      isPrivate: false,
      organizationId: org.id,
      projectId: project1.id,
    },
  })

  for (const perm of channelPermissionDefaults) {
    await prisma.channelPermission.upsert({
      where: { channelId_roleName: { channelId: projectChannel.id, roleName: perm.roleName } },
      update: {},
      create: { channelId: projectChannel.id, ...perm },
    })
  }

  await prisma.channelMember.createMany({
    data: [
      { channelId: projectChannel.id, userId: adminUser.id },
      { channelId: projectChannel.id, userId: pmUser.id },
      { channelId: projectChannel.id, userId: fieldUser.id },
    ],
    skipDuplicates: true,
  })

  console.log('Seed completed successfully!')
  console.log('  Demo users (password: password123):')
  console.log('    admin@demo.com    - Admin')
  console.log('    pm@demo.com       - Project Manager')
  console.log('    field@demo.com    - Field User')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
