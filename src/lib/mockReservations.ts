export type ReservationStatus = 'NEW' | 'CONTACTED' | 'NEGOTIATION' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED'

export interface Reservation {
  id: string
  productId: string
  clientName: string
  clientPhone: string
  status: ReservationStatus
  reservedAt: string
  expiresAt: string
}

export const MOCK_RESERVATIONS: Reservation[] = [
  {
    id: 'r1',
    productId: '2',
    clientName: 'Julie Marchand',
    clientPhone: '+33 6 12 34 56 78',
    status: 'NEW',
    reservedAt: '2026-07-05',
    expiresAt: '2026-07-08',
  },
  {
    id: 'r2',
    productId: '9',
    clientName: 'Karim Belhadj',
    clientPhone: '+33 6 98 76 54 32',
    status: 'CONTACTED',
    reservedAt: '2026-07-04',
    expiresAt: '2026-07-07',
  },
  {
    id: 'r3',
    productId: '5',
    clientName: 'Sophie Renard',
    clientPhone: '+33 7 11 22 33 44',
    status: 'CONFIRMED',
    reservedAt: '2026-06-30',
    expiresAt: '2026-07-03',
  },
  {
    id: 'r4',
    productId: '7',
    clientName: 'Thomas Petit',
    clientPhone: '+33 6 55 44 33 22',
    status: 'EXPIRED',
    reservedAt: '2026-06-28',
    expiresAt: '2026-07-01',
  },
]
