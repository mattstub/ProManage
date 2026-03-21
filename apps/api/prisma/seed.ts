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

  const project2 = await prisma.project.upsert({
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
      squareFootage: 12000,
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

  // 7. Create demo contacts
  console.log('Creating demo contacts...')

  const contact1 = await prisma.contact.upsert({
    where: { id: 'seed-contact-1' },
    update: {},
    create: {
      id: 'seed-contact-1',
      firstName: 'Robert',
      lastName: 'Chen',
      company: 'Chen Electrical Services',
      type: 'SUBCONTRACTOR',
      email: 'robert@chenelectrical.com',
      phone: '(555) 200-0001',
      mobile: '(555) 200-0011',
      title: 'Owner',
      organizationId: org.id,
      createdById: adminUser.id,
    },
  })

  const contact2 = await prisma.contact.upsert({
    where: { id: 'seed-contact-2' },
    update: {},
    create: {
      id: 'seed-contact-2',
      firstName: 'Maria',
      lastName: 'Gonzalez',
      company: 'City Building Department',
      type: 'INSPECTOR',
      email: 'mgonzalez@citybuilding.gov',
      phone: '(555) 200-0002',
      title: 'Senior Inspector',
      organizationId: org.id,
      createdById: adminUser.id,
    },
  })

  await prisma.contact.upsert({
    where: { id: 'seed-contact-3' },
    update: {},
    create: {
      id: 'seed-contact-3',
      firstName: 'James',
      lastName: 'Harmon',
      company: 'Harmon & Associates Architecture',
      type: 'ARCHITECT',
      email: 'jharmon@harmonarch.com',
      phone: '(555) 200-0003',
      title: 'Principal Architect',
      organizationId: org.id,
      createdById: adminUser.id,
    },
  })

  // Associate contacts with the first project (Phase 4.1 — role field)
  await prisma.contactProject.upsert({
    where: { contactId_projectId: { contactId: contact1.id, projectId: project1.id } },
    update: {},
    create: { contactId: contact1.id, projectId: project1.id, role: 'Electrical Subcontractor' },
  })

  await prisma.contactProject.upsert({
    where: { contactId_projectId: { contactId: contact2.id, projectId: project1.id } },
    update: {},
    create: { contactId: contact2.id, projectId: project1.id, role: 'Building Inspector' },
  })

  // Phase 4.1 — ProjectSettings (auto-created with defaults per project)
  console.log('Creating demo project settings and scopes...')

  await prisma.projectSettings.upsert({
    where: { projectId: project1.id },
    update: {},
    create: { projectId: project1.id, enableSafetyModule: true, notifyOnIncident: true },
  })

  await prisma.projectSettings.upsert({
    where: { projectId: project2.id },
    update: {},
    create: { projectId: project2.id },
  })

  // ProjectScopes for project1
  await prisma.projectScope.upsert({
    where: { id: 'seed-scope-1' },
    update: {},
    create: {
      id: 'seed-scope-1',
      name: 'Phase 1 — Demolition & Rough-In',
      description: 'Interior demolition, framing, MEP rough-in.',
      status: 'Completed',
      sequence: 0,
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-05-31'),
      projectId: project1.id,
      organizationId: org.id,
    },
  })

  await prisma.projectScope.upsert({
    where: { id: 'seed-scope-2' },
    update: {},
    create: {
      id: 'seed-scope-2',
      name: 'Phase 2 — Finishes & Fit-Out',
      description: 'Drywall, flooring, millwork, MEP trim-out.',
      status: 'Active',
      sequence: 1,
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-09-30'),
      projectId: project1.id,
      organizationId: org.id,
    },
  })

  // Seed licenses
  console.log('Creating demo licenses...')
  const today = new Date()
  const in25Days = new Date(today); in25Days.setDate(today.getDate() + 25)
  const in90Days = new Date(today); in90Days.setDate(today.getDate() + 90)
  const lastYear = new Date(today); lastYear.setFullYear(today.getFullYear() - 1)

  const license1 = await prisma.license.upsert({
    where: { id: 'seed-license-1' },
    update: {},
    create: {
      id: 'seed-license-1',
      name: 'General Contractor License',
      licenseNumber: 'GC-2024-001234',
      authority: 'State Contractor Board',
      licenseType: 'General Contractor',
      holderType: 'ORGANIZATION',
      status: 'ACTIVE',
      startDate: lastYear,
      expirationDate: in25Days,
      renewalDate: in25Days,
      notes: 'Renewal application submitted',
      organizationId: org.id,
      createdById: adminUser.id,
    },
  })

  await prisma.license.upsert({
    where: { id: 'seed-license-2' },
    update: {},
    create: {
      id: 'seed-license-2',
      name: 'Master Electrician License',
      licenseNumber: 'ME-2023-005678',
      authority: 'State Electrical Board',
      licenseType: 'Master Electrician',
      holderType: 'USER',
      status: 'ACTIVE',
      startDate: lastYear,
      expirationDate: in90Days,
      renewalDate: in90Days,
      organizationId: org.id,
      userId: adminUser.id,
      createdById: adminUser.id,
    },
  })

  // Reminder on the soon-to-expire org license: 30-day (already past) + 7-day daily
  await prisma.licenseReminder.upsert({
    where: { id: 'seed-reminder-1' },
    update: {},
    create: {
      id: 'seed-reminder-1',
      licenseId: license1.id,
      daysBeforeExpiration: 30,
      notifyUserId: adminUser.id,
      isActive: true,
    },
  })

  await prisma.licenseReminder.upsert({
    where: { id: 'seed-reminder-2' },
    update: {},
    create: {
      id: 'seed-reminder-2',
      licenseId: license1.id,
      daysBeforeExpiration: 7,
      notifyUserId: adminUser.id,
      notifySupervisorId: adminUser.id,
      isActive: true,
    },
  })

  // Seed safety data
  console.log('Creating demo safety data...')

  await prisma.safetyDocument.upsert({
    where: { id: 'seed-safety-doc-1' },
    update: {},
    create: {
      id: 'seed-safety-doc-1',
      title: 'Fall Protection Policy',
      description: 'Company-wide fall protection requirements for work above 6 feet.',
      category: 'POLICY',
      fileName: 'fall-protection-policy.pdf',
      fileKey: `safety/documents/${org.id}/fall-protection-policy.pdf`,
      fileSize: 204800,
      mimeType: 'application/pdf',
      organizationId: org.id,
      uploadedById: adminUser.id,
    },
  })

  await prisma.safetyDocument.upsert({
    where: { id: 'seed-safety-doc-2' },
    update: {},
    create: {
      id: 'seed-safety-doc-2',
      title: 'Emergency Evacuation Plan',
      description: 'Site emergency response and evacuation procedures.',
      category: 'EMERGENCY_PLAN',
      fileName: 'emergency-evacuation-plan.pdf',
      fileKey: `safety/documents/${org.id}/emergency-evacuation-plan.pdf`,
      fileSize: 153600,
      mimeType: 'application/pdf',
      organizationId: org.id,
      uploadedById: adminUser.id,
    },
  })

  await prisma.sdsEntry.upsert({
    where: { id: 'seed-sds-1' },
    update: {},
    create: {
      id: 'seed-sds-1',
      productName: 'PVC Primer',
      manufacturer: 'Oatey Co.',
      chemicalName: 'Tetrahydrofuran (THF)',
      notes: 'Used for PVC pipe connections. Store away from heat sources.',
      organizationId: org.id,
      createdById: adminUser.id,
    },
  })

  const lastWeek = new Date(today); lastWeek.setDate(today.getDate() - 7)
  const nextWeek = new Date(today); nextWeek.setDate(today.getDate() + 7)

  const talk1 = await prisma.toolboxTalk.upsert({
    where: { id: 'seed-talk-1' },
    update: {},
    create: {
      id: 'seed-talk-1',
      title: 'Ladder Safety',
      content: 'Review proper ladder setup, 3-point contact rule, and weight ratings. Inspect all ladders before use.',
      scheduledDate: lastWeek,
      conductedDate: lastWeek,
      status: 'COMPLETED',
      organizationId: org.id,
      projectId: project1.id,
      conductedById: adminUser.id,
      createdById: adminUser.id,
    },
  })

  await prisma.toolboxTalk.upsert({
    where: { id: 'seed-talk-2' },
    update: {},
    create: {
      id: 'seed-talk-2',
      title: 'Heat Illness Prevention',
      content: 'Hydration requirements, shade rest periods, and signs of heat exhaustion vs. heat stroke.',
      scheduledDate: nextWeek,
      status: 'SCHEDULED',
      organizationId: org.id,
      createdById: pmUser.id,
    },
  })

  await prisma.toolboxTalkAttendee.upsert({
    where: { id: 'seed-attendee-1' },
    update: {},
    create: {
      id: 'seed-attendee-1',
      talkId: talk1.id,
      userId: adminUser.id,
      name: 'Admin User',
      signedAt: lastWeek,
    },
  })

  await prisma.toolboxTalkAttendee.upsert({
    where: { id: 'seed-attendee-2' },
    update: {},
    create: {
      id: 'seed-attendee-2',
      talkId: talk1.id,
      userId: fieldUser.id,
      name: 'Field User',
      signedAt: lastWeek,
    },
  })

  await prisma.safetyForm.upsert({
    where: { id: 'seed-form-1' },
    update: {},
    create: {
      id: 'seed-form-1',
      title: 'Daily Job Site Inspection',
      description: 'Pre-work site inspection checklist to be completed each morning.',
      category: 'INSPECTION',
      content: '1. Housekeeping and general site conditions\n2. Barricades and warning signs in place\n3. Tools and equipment condition\n4. PPE availability\n5. Emergency contacts posted',
      isActive: true,
      organizationId: org.id,
      createdById: adminUser.id,
    },
  })

  await prisma.safetyForm.upsert({
    where: { id: 'seed-form-2' },
    update: {},
    create: {
      id: 'seed-form-2',
      title: 'Job Safety Analysis (JSA)',
      description: 'Step-by-step hazard identification for non-routine tasks.',
      category: 'JSA',
      content: '1. Describe the task\n2. Break task into steps\n3. Identify hazards per step\n4. List control measures\n5. Review with crew before starting',
      isActive: true,
      organizationId: org.id,
      createdById: adminUser.id,
    },
  })

  await prisma.incidentReport.upsert({
    where: { id: 'seed-incident-1' },
    update: {},
    create: {
      id: 'seed-incident-1',
      title: 'Near-Miss: Unsecured Tool at Height',
      incidentType: 'NEAR_MISS',
      incidentDate: lastWeek,
      location: 'Level 3 — east stairwell',
      description: 'A hammer was left unsecured on scaffolding and fell to the deck below. No injuries. Area was unoccupied at time of incident.',
      correctiveAction: 'Toolbox talk on tool tethering delivered. Tether kits distributed to all crews.',
      status: 'CLOSED',
      organizationId: org.id,
      projectId: project1.id,
      reportedById: fieldUser.id,
    },
  })

  // ─── Drawing Disciplines ────────────────────────────────────────────────────

  const disciplineData = [
    { name: 'Architectural', abbreviation: 'A', sortOrder: 0 },
    { name: 'Structural', abbreviation: 'S', sortOrder: 1 },
    { name: 'Mechanical', abbreviation: 'M', sortOrder: 2 },
    { name: 'Electrical', abbreviation: 'E', sortOrder: 3 },
    { name: 'Plumbing', abbreviation: 'P', sortOrder: 4 },
    { name: 'Civil', abbreviation: 'C', sortOrder: 5 },
  ]

  for (const d of disciplineData) {
    await prisma.drawingDiscipline.upsert({
      where: { name_organizationId: { name: d.name, organizationId: org.id } },
      update: {},
      create: { ...d, organizationId: org.id },
    })
  }

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
