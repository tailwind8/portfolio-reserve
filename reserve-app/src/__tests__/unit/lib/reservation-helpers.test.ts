/**
 * reservation-helpers.ts のユニットテスト
 *
 * 予約処理ヘルパー関数のテスト
 */

// Prismaをモック
jest.mock('@/lib/prisma', () => ({
  prisma: {
    bookingStaff: {
      findMany: jest.fn(),
    },
    bookingReservation: {
      findMany: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import {
  findAvailableStaff,
  checkUserReservationConflicts,
  checkStaffReservationConflicts,
  checkGeneralReservationConflicts,
} from '@/lib/reservation-helpers';

describe('reservation-helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_TENANT_ID = 'demo-booking';
  });

  describe('findAvailableStaff', () => {
    it('should return NO_ACTIVE_STAFF when no staff exists', async () => {
      (prisma.bookingStaff.findMany as jest.Mock).mockResolvedValue([]);

      const result = await findAvailableStaff('2025-01-20', '14:00', 60);

      expect(result).toEqual({ found: false, reason: 'NO_ACTIVE_STAFF' });
    });

    it('should return staff ID when staff is available', async () => {
      (prisma.bookingStaff.findMany as jest.Mock).mockResolvedValue([
        { id: 'staff-1' },
        { id: 'staff-2' },
      ]);
      (prisma.bookingReservation.findMany as jest.Mock).mockResolvedValue([]);

      const result = await findAvailableStaff('2025-01-20', '14:00', 60);

      expect(result).toEqual({ found: true, staffId: 'staff-1' });
    });

    it('should skip staff with conflicting reservation', async () => {
      (prisma.bookingStaff.findMany as jest.Mock).mockResolvedValue([
        { id: 'staff-1' },
        { id: 'staff-2' },
      ]);
      // staff-1 has a reservation at 14:00-15:00
      (prisma.bookingReservation.findMany as jest.Mock).mockResolvedValue([
        {
          staffId: 'staff-1',
          reservedTime: '14:00',
          menu: { duration: 60 },
        },
      ]);

      const result = await findAvailableStaff('2025-01-20', '14:00', 60);

      expect(result).toEqual({ found: true, staffId: 'staff-2' });
    });

    it('should return NO_AVAILABLE_STAFF when all staff are busy', async () => {
      (prisma.bookingStaff.findMany as jest.Mock).mockResolvedValue([
        { id: 'staff-1' },
      ]);
      (prisma.bookingReservation.findMany as jest.Mock).mockResolvedValue([
        {
          staffId: 'staff-1',
          reservedTime: '14:00',
          menu: { duration: 60 },
        },
      ]);

      const result = await findAvailableStaff('2025-01-20', '14:00', 60);

      expect(result).toEqual({ found: false, reason: 'NO_AVAILABLE_STAFF' });
    });

    it('should find available staff when times do not overlap', async () => {
      (prisma.bookingStaff.findMany as jest.Mock).mockResolvedValue([
        { id: 'staff-1' },
      ]);
      // Staff has reservation from 10:00-11:00
      (prisma.bookingReservation.findMany as jest.Mock).mockResolvedValue([
        {
          staffId: 'staff-1',
          reservedTime: '10:00',
          menu: { duration: 60 },
        },
      ]);

      // Request for 14:00-15:00 (no overlap)
      const result = await findAvailableStaff('2025-01-20', '14:00', 60);

      expect(result).toEqual({ found: true, staffId: 'staff-1' });
    });

    it('should detect overlapping times correctly', async () => {
      (prisma.bookingStaff.findMany as jest.Mock).mockResolvedValue([
        { id: 'staff-1' },
      ]);
      // Staff has reservation from 14:00-15:00
      (prisma.bookingReservation.findMany as jest.Mock).mockResolvedValue([
        {
          staffId: 'staff-1',
          reservedTime: '14:00',
          menu: { duration: 60 },
        },
      ]);

      // Request for 14:30-15:30 (overlaps)
      const result = await findAvailableStaff('2025-01-20', '14:30', 60);

      expect(result).toEqual({ found: false, reason: 'NO_AVAILABLE_STAFF' });
    });

    it('should call findMany with correct parameters', async () => {
      (prisma.bookingStaff.findMany as jest.Mock).mockResolvedValue([]);

      await findAvailableStaff('2025-01-20', '14:00', 60);

      expect(prisma.bookingStaff.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: 'demo-booking',
          isActive: true,
        },
        select: {
          id: true,
        },
      });
    });
  });

  describe('checkUserReservationConflicts', () => {
    const mockTx = {
      bookingReservation: {
        findMany: jest.fn(),
      },
    };

    it('should not throw when no conflicts exist', async () => {
      mockTx.bookingReservation.findMany.mockResolvedValue([]);

      await expect(
        checkUserReservationConflicts(
          mockTx as unknown as Parameters<typeof checkUserReservationConflicts>[0],
          'user-1',
          '2025-01-20',
          '14:00',
          60
        )
      ).resolves.not.toThrow();
    });

    it('should throw when user has overlapping reservation', async () => {
      mockTx.bookingReservation.findMany.mockResolvedValue([
        {
          reservedTime: '14:00',
          menu: { duration: 60 },
        },
      ]);

      await expect(
        checkUserReservationConflicts(
          mockTx as unknown as Parameters<typeof checkUserReservationConflicts>[0],
          'user-1',
          '2025-01-20',
          '14:00',
          60
        )
      ).rejects.toThrow('既にこの時間帯に予約があります');
    });

    it('should not throw when times do not overlap', async () => {
      mockTx.bookingReservation.findMany.mockResolvedValue([
        {
          reservedTime: '10:00',
          menu: { duration: 60 },
        },
      ]);

      await expect(
        checkUserReservationConflicts(
          mockTx as unknown as Parameters<typeof checkUserReservationConflicts>[0],
          'user-1',
          '2025-01-20',
          '14:00',
          60
        )
      ).resolves.not.toThrow();
    });

    it('should throw when new reservation starts during existing', async () => {
      mockTx.bookingReservation.findMany.mockResolvedValue([
        {
          reservedTime: '14:00',
          menu: { duration: 60 },
        },
      ]);

      // New reservation starts at 14:30 during existing 14:00-15:00
      await expect(
        checkUserReservationConflicts(
          mockTx as unknown as Parameters<typeof checkUserReservationConflicts>[0],
          'user-1',
          '2025-01-20',
          '14:30',
          60
        )
      ).rejects.toThrow('既にこの時間帯に予約があります');
    });

    it('should call findMany with correct parameters', async () => {
      mockTx.bookingReservation.findMany.mockResolvedValue([]);

      await checkUserReservationConflicts(
        mockTx as unknown as Parameters<typeof checkUserReservationConflicts>[0],
        'user-1',
        '2025-01-20',
        '14:00',
        60
      );

      expect(mockTx.bookingReservation.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: 'demo-booking',
          userId: 'user-1',
          reservedDate: new Date('2025-01-20'),
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
        include: {
          menu: { select: { duration: true } },
        },
      });
    });
  });

  describe('checkStaffReservationConflicts', () => {
    const mockTx = {
      bookingReservation: {
        findMany: jest.fn(),
      },
    };

    it('should not throw when no conflicts exist', async () => {
      mockTx.bookingReservation.findMany.mockResolvedValue([]);

      await expect(
        checkStaffReservationConflicts(
          mockTx as unknown as Parameters<typeof checkUserReservationConflicts>[0],
          'staff-1',
          '2025-01-20',
          '14:00',
          60
        )
      ).resolves.not.toThrow();
    });

    it('should throw when staff has overlapping reservation', async () => {
      mockTx.bookingReservation.findMany.mockResolvedValue([
        {
          reservedTime: '14:00',
          menu: { duration: 60 },
        },
      ]);

      await expect(
        checkStaffReservationConflicts(
          mockTx as unknown as Parameters<typeof checkUserReservationConflicts>[0],
          'staff-1',
          '2025-01-20',
          '14:00',
          60
        )
      ).rejects.toThrow('選択されたスタッフは指定時間帯に対応できません');
    });

    it('should not throw when times do not overlap', async () => {
      mockTx.bookingReservation.findMany.mockResolvedValue([
        {
          reservedTime: '10:00',
          menu: { duration: 60 },
        },
      ]);

      await expect(
        checkStaffReservationConflicts(
          mockTx as unknown as Parameters<typeof checkUserReservationConflicts>[0],
          'staff-1',
          '2025-01-20',
          '14:00',
          60
        )
      ).resolves.not.toThrow();
    });

    it('should call findMany with correct parameters', async () => {
      mockTx.bookingReservation.findMany.mockResolvedValue([]);

      await checkStaffReservationConflicts(
        mockTx as unknown as Parameters<typeof checkUserReservationConflicts>[0],
        'staff-1',
        '2025-01-20',
        '14:00',
        60
      );

      expect(mockTx.bookingReservation.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: 'demo-booking',
          staffId: 'staff-1',
          reservedDate: new Date('2025-01-20'),
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
        include: {
          menu: { select: { duration: true } },
        },
      });
    });
  });

  describe('checkGeneralReservationConflicts', () => {
    const mockTx = {
      bookingReservation: {
        findMany: jest.fn(),
      },
    };

    it('should not throw when no conflicts exist', async () => {
      mockTx.bookingReservation.findMany.mockResolvedValue([]);

      await expect(
        checkGeneralReservationConflicts(mockTx as unknown as Parameters<typeof checkUserReservationConflicts>[0], '2025-01-20', '14:00', 60)
      ).resolves.not.toThrow();
    });

    it('should throw when time slot is already booked', async () => {
      mockTx.bookingReservation.findMany.mockResolvedValue([
        {
          reservedTime: '14:00',
          menu: { duration: 60 },
        },
      ]);

      await expect(
        checkGeneralReservationConflicts(mockTx as unknown as Parameters<typeof checkUserReservationConflicts>[0], '2025-01-20', '14:00', 60)
      ).rejects.toThrow('この時間は既に予約済みです');
    });

    it('should not throw when times do not overlap', async () => {
      mockTx.bookingReservation.findMany.mockResolvedValue([
        {
          reservedTime: '10:00',
          menu: { duration: 60 },
        },
      ]);

      await expect(
        checkGeneralReservationConflicts(mockTx as unknown as Parameters<typeof checkUserReservationConflicts>[0], '2025-01-20', '14:00', 60)
      ).resolves.not.toThrow();
    });

    it('should call findMany with staffId: null', async () => {
      mockTx.bookingReservation.findMany.mockResolvedValue([]);

      await checkGeneralReservationConflicts(mockTx as unknown as Parameters<typeof checkUserReservationConflicts>[0], '2025-01-20', '14:00', 60);

      expect(mockTx.bookingReservation.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: 'demo-booking',
          staffId: null,
          reservedDate: new Date('2025-01-20'),
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
        include: {
          menu: { select: { duration: true } },
        },
      });
    });
  });

  describe('time overlap edge cases', () => {
    const mockTx = {
      bookingReservation: {
        findMany: jest.fn(),
      },
    };

    beforeEach(() => {
      mockTx.bookingReservation.findMany.mockReset();
    });

    it('should handle adjacent reservations (no overlap)', async () => {
      // Existing: 14:00-15:00
      mockTx.bookingReservation.findMany.mockResolvedValue([
        {
          reservedTime: '14:00',
          menu: { duration: 60 },
        },
      ]);

      // New: 15:00-16:00 (adjacent, no overlap)
      await expect(
        checkUserReservationConflicts(
          mockTx as unknown as Parameters<typeof checkUserReservationConflicts>[0],
          'user-1',
          '2025-01-20',
          '15:00',
          60
        )
      ).resolves.not.toThrow();
    });

    it('should handle early morning reservations', async () => {
      mockTx.bookingReservation.findMany.mockResolvedValue([]);

      await expect(
        checkUserReservationConflicts(
          mockTx as unknown as Parameters<typeof checkUserReservationConflicts>[0],
          'user-1',
          '2025-01-20',
          '09:00',
          30
        )
      ).resolves.not.toThrow();
    });

    it('should handle late evening reservations', async () => {
      mockTx.bookingReservation.findMany.mockResolvedValue([]);

      await expect(
        checkUserReservationConflicts(
          mockTx as unknown as Parameters<typeof checkUserReservationConflicts>[0],
          'user-1',
          '2025-01-20',
          '21:00',
          60
        )
      ).resolves.not.toThrow();
    });

    it('should detect overlap when new reservation encompasses existing', async () => {
      // Existing: 14:00-14:30
      mockTx.bookingReservation.findMany.mockResolvedValue([
        {
          reservedTime: '14:00',
          menu: { duration: 30 },
        },
      ]);

      // New: 13:30-15:00 (encompasses existing)
      await expect(
        checkUserReservationConflicts(
          mockTx as unknown as Parameters<typeof checkUserReservationConflicts>[0],
          'user-1',
          '2025-01-20',
          '13:30',
          90
        )
      ).rejects.toThrow('既にこの時間帯に予約があります');
    });
  });
});
