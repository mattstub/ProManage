import type { ProposalStatus } from '../types/proposal'

export const PROPOSAL_STATUSES: Record<
  ProposalStatus,
  { label: string; description: string; color: string }
> = {
  DRAFT: { label: 'Draft', description: 'Proposal is being prepared', color: 'gray' },
  SENT: { label: 'Sent', description: 'Proposal delivered to customer', color: 'blue' },
  ACCEPTED: { label: 'Accepted', description: 'Customer accepted the proposal', color: 'green' },
  REJECTED: { label: 'Rejected', description: 'Customer declined the proposal', color: 'red' },
  REVISED: {
    label: 'Revised',
    description: 'A new version of this proposal is being prepared',
    color: 'yellow',
  },
}

export const PROPOSAL_STATUS_LIST = Object.keys(PROPOSAL_STATUSES) as ProposalStatus[]
