/**
 * Development seed. Mirrors the data the UI prototype shows so the mobile and
 * web clients can be built against realistic records.
 *
 * Safe to re-run: every write is an upsert keyed on a stable natural key.
 */
import {
  AvailabilityStatus,
  BookingStatus,
  DevicePlatform,
  Gender,
  MobilityNeed,
  Prisma,
  PrismaClient,
  ServiceType,
  TripType,
  UserRole,
  VerificationStatus,
} from '@prisma/client';

const prisma = new PrismaClient();

const ADMIN_PHONE = '+6281200000099';

interface MutawifSeed {
  phone: string;
  name: string;
  bio: string;
  city: string;
  languages: string[];
  yearsExperience: number;
  latitude: number;
  longitude: number;
  rates: Array<{ serviceType: ServiceType; hourlyRate: string }>;
}

const MUTAWIF_SEEDS: MutawifSeed[] = [
  {
    phone: '+966500000001',
    name: 'Ustadz Hasan Al-Makki',
    bio: 'Mutawif bersertifikat, delapan tahun mendampingi jamaah Indonesia di Masjidil Haram. Fokus pada jamaah lansia.',
    city: 'Makkah',
    languages: ['id', 'ar'],
    yearsExperience: 8,
    latitude: 21.4225,
    longitude: 39.8262,
    rates: [
      { serviceType: ServiceType.IBADAH_GUIDANCE, hourlyRate: '350000' },
      { serviceType: ServiceType.MOBILITY_ASSISTANCE, hourlyRate: '400000' },
      { serviceType: ServiceType.EMERGENCY, hourlyRate: '500000' },
    ],
  },
  {
    phone: '+966500000002',
    name: 'Ustadz Yusuf Abdillah',
    bio: 'Alumni Universitas Islam Madinah. Berpengalaman menangani jamaah yang terpisah dari rombongan.',
    city: 'Madinah',
    languages: ['id', 'ar', 'en'],
    yearsExperience: 5,
    latitude: 24.4672,
    longitude: 39.6111,
    rates: [
      { serviceType: ServiceType.IBADAH_GUIDANCE, hourlyRate: '300000' },
      { serviceType: ServiceType.EMERGENCY, hourlyRate: '450000' },
    ],
  },
  {
    phone: '+966500000003',
    name: 'Ustadzah Maryam Salsabila',
    bio: 'Pendamping khusus jamaah perempuan dan lansia, terbiasa membantu pengguna kursi roda saat thawaf.',
    city: 'Makkah',
    languages: ['id', 'ar'],
    yearsExperience: 6,
    latitude: 21.4189,
    longitude: 39.8255,
    rates: [
      { serviceType: ServiceType.IBADAH_GUIDANCE, hourlyRate: '325000' },
      { serviceType: ServiceType.MOBILITY_ASSISTANCE, hourlyRate: '375000' },
    ],
  },
];

async function seedAdmin(): Promise<string> {
  const admin = await prisma.user.upsert({
    where: { phone: ADMIN_PHONE },
    create: {
      phone: ADMIN_PHONE,
      name: 'Admin Manaseek',
      role: UserRole.ADMIN,
      phoneVerifiedAt: new Date(),
    },
    update: { role: UserRole.ADMIN },
  });

  console.log(`admin: ${admin.phone}`);
  return admin.id;
}

async function seedMutawif(seed: MutawifSeed, adminId: string): Promise<string> {
  const user = await prisma.user.upsert({
    where: { phone: seed.phone },
    create: {
      phone: seed.phone,
      name: seed.name,
      role: UserRole.MUTAWIF,
      phoneVerifiedAt: new Date(),
    },
    update: { name: seed.name, role: UserRole.MUTAWIF },
  });

  const profile = await prisma.mutawifProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      bio: seed.bio,
      city: seed.city,
      languages: seed.languages,
      yearsExperience: seed.yearsExperience,
      verificationStatus: VerificationStatus.APPROVED,
      verifiedAt: new Date(),
      verifiedById: adminId,
      availabilityStatus: AvailabilityStatus.ONLINE,
      latitude: seed.latitude,
      longitude: seed.longitude,
      locationUpdatedAt: new Date(),
    },
    update: {
      verificationStatus: VerificationStatus.APPROVED,
      availabilityStatus: AvailabilityStatus.ONLINE,
      latitude: seed.latitude,
      longitude: seed.longitude,
      locationUpdatedAt: new Date(),
    },
  });

  for (const rate of seed.rates) {
    await prisma.mutawifServiceRate.upsert({
      where: {
        mutawifId_serviceType: { mutawifId: profile.id, serviceType: rate.serviceType },
      },
      create: {
        mutawifId: profile.id,
        serviceType: rate.serviceType,
        hourlyRate: new Prisma.Decimal(rate.hourlyRate),
      },
      update: { hourlyRate: new Prisma.Decimal(rate.hourlyRate), active: true },
    });
  }

  // Weekday mornings and afternoons, Riyadh time.
  await prisma.availabilitySlot.deleteMany({ where: { mutawifId: profile.id } });
  await prisma.availabilitySlot.createMany({
    data: [0, 1, 2, 3, 4, 5, 6].flatMap((dayOfWeek) => [
      { mutawifId: profile.id, dayOfWeek, startMinute: 8 * 60, endMinute: 11 * 60 },
      { mutawifId: profile.id, dayOfWeek, startMinute: 13 * 60, endMinute: 17 * 60 },
    ]),
  });

  console.log(`mutawif: ${seed.name} (${profile.id})`);
  return profile.id;
}

async function seedJamaah(): Promise<string> {
  const user = await prisma.user.upsert({
    where: { phone: '+6281234567890' },
    create: {
      phone: '+6281234567890',
      name: 'Ahmad Fauzi',
      phoneVerifiedAt: new Date(),
      jamaahProfile: {
        create: {
          gender: Gender.MALE,
          city: 'Surabaya',
          province: 'Jawa Timur',
          mobilityNeed: MobilityNeed.ELDERLY_ASSISTANCE,
          emergencyContactName: 'Siti Aminah',
          emergencyContactPhone: '+6281298765432',
        },
      },
    },
    update: { name: 'Ahmad Fauzi' },
  });

  const departureDate = new Date();
  departureDate.setMonth(departureDate.getMonth() + 2);

  const existingTrip = await prisma.trip.findFirst({ where: { userId: user.id } });
  if (!existingTrip) {
    await prisma.trip.create({
      data: {
        userId: user.id,
        type: TripType.UMRAH,
        packageName: 'Umrah Reguler 12 Hari',
        agencyName: 'Travel Barokah',
        departureDate,
      },
    });
  }

  await prisma.deviceToken.upsert({
    where: { token: 'seed-device-token-ahmad-fauzi-0001' },
    create: {
      userId: user.id,
      token: 'seed-device-token-ahmad-fauzi-0001',
      platform: DevicePlatform.ANDROID,
    },
    update: { userId: user.id },
  });

  console.log(`jamaah: ${user.phone}`);
  return user.id;
}

async function seedBooking(jamaahId: string, mutawifId: string): Promise<void> {
  const existing = await prisma.booking.findUnique({ where: { code: 'MSK-SEED01' } });
  if (existing) return;

  const scheduledStartAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const hourlyRate = new Prisma.Decimal('350000');
  const durationHours = 3;

  await prisma.booking.create({
    data: {
      code: 'MSK-SEED01',
      jamaahId,
      mutawifId,
      serviceType: ServiceType.IBADAH_GUIDANCE,
      scheduledStartAt,
      durationHours,
      hourlyRate,
      totalAmount: hourlyRate.mul(durationHours),
      meetingPointLabel: 'Gate King Abdul Aziz, Masjidil Haram',
      meetingLatitude: 21.4225,
      meetingLongitude: 39.8262,
      notes: 'Jamaah lansia, menggunakan kursi roda.',
      status: BookingStatus.ACCEPTED,
      acceptedAt: new Date(),
      events: {
        create: [
          { toStatus: BookingStatus.REQUESTED, actorId: jamaahId, actorRole: UserRole.JAMAAH },
          {
            fromStatus: BookingStatus.REQUESTED,
            toStatus: BookingStatus.ACCEPTED,
            actorRole: UserRole.MUTAWIF,
          },
        ],
      },
    },
  });

  console.log('booking: MSK-SEED01');
}

async function main(): Promise<void> {
  const adminId = await seedAdmin();

  const mutawifIds: string[] = [];
  for (const seed of MUTAWIF_SEEDS) {
    mutawifIds.push(await seedMutawif(seed, adminId));
  }

  const jamaahId = await seedJamaah();
  await seedBooking(jamaahId, mutawifIds[0]);

  console.log('\nSeed complete. Log in with OTP_DEV_BYPASS_CODE using any seeded phone number.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
