import { PrismaClient, DayOfWeek } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// .env.localファイルを読み込む
dotenv.config({ path: '.env.local' });

// Prisma Client with PostgreSQL Driver Adapter
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: ['query', 'info', 'warn', 'error'],
});

async function main() {
  const TENANT_ID = 'demo-booking';

  console.log('🌱 デモデータの投入を開始します...\n');

  // 1. BookingSettings作成
  console.log('📝 店舗設定を作成中...');
  await prisma.bookingSettings.upsert({
    where: { tenantId: TENANT_ID },
    update: {},
    create: {
      tenantId: TENANT_ID,
      storeName: 'Hair Salon DEMO',
      storeEmail: 'info@demo-salon.com',
      storePhone: '03-1234-5678',
      openTime: '09:00',
      closeTime: '20:00',
      slotDuration: 30, // 30分単位
      closedDays: ['Sunday'], // 日曜定休
    },
  });
  console.log('✅ 店舗設定を作成しました\n');

  // 2. BookingMenu作成（15種類）
  console.log('📝 メニューを作成中...');

  const menus = [
    // カット系
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      name: 'カット',
      description: 'シャンプー・ブロー込み',
      price: 5000,
      duration: 60,
      category: 'カット',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      name: 'カット（シニア）',
      description: 'シニアスタイリスト指名',
      price: 6500,
      duration: 60,
      category: 'カット',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440003',
      name: '前髪カット',
      description: '前髪のみのカット',
      price: 1000,
      duration: 15,
      category: 'カット',
    },
    // カラー系
    {
      id: '550e8400-e29b-41d4-a716-446655440004',
      name: 'カラー',
      description: 'フルカラー',
      price: 8000,
      duration: 90,
      category: 'カラー',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440005',
      name: 'リタッチカラー',
      description: '根元のみカラー',
      price: 6000,
      duration: 60,
      category: 'カラー',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440006',
      name: 'ハイライト',
      description: '部分的なハイライト',
      price: 10000,
      duration: 120,
      category: 'カラー',
    },
    // パーマ系
    {
      id: '550e8400-e29b-41d4-a716-446655440007',
      name: 'パーマ',
      description: 'デジタルパーマ',
      price: 12000,
      duration: 120,
      category: 'パーマ',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440008',
      name: 'ストレートパーマ',
      description: '縮毛矯正',
      price: 15000,
      duration: 150,
      category: 'パーマ',
    },
    // セット系
    {
      id: '550e8400-e29b-41d4-a716-446655440009',
      name: 'カット＋カラー',
      description: 'カット・カラー・シャンプー・ブロー込み',
      price: 12000,
      duration: 120,
      category: 'セット',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440010',
      name: 'カット＋パーマ',
      description: 'カット・パーマ・シャンプー・ブロー込み',
      price: 16000,
      duration: 150,
      category: 'セット',
    },
    // トリートメント系
    {
      id: '550e8400-e29b-41d4-a716-446655440011',
      name: 'ヘッドスパ',
      description: '頭皮マッサージで癒しのひとときを',
      price: 3000,
      duration: 30,
      category: 'トリートメント',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440012',
      name: 'トリートメント',
      description: '髪質改善トリートメント',
      price: 5000,
      duration: 45,
      category: 'トリートメント',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440013',
      name: 'プレミアムトリートメント',
      description: '最高級トリートメント',
      price: 8000,
      duration: 60,
      category: 'トリートメント',
    },
    // その他
    {
      id: '550e8400-e29b-41d4-a716-446655440014',
      name: 'セット',
      description: 'ヘアセット・ブロー',
      price: 3000,
      duration: 30,
      category: 'その他',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440015',
      name: 'メイク',
      description: 'フルメイク',
      price: 5000,
      duration: 45,
      category: 'その他',
    },
  ];

  for (const menu of menus) {
    await prisma.bookingMenu.upsert({
      where: { id: menu.id },
      update: {},
      create: {
        ...menu,
        tenantId: TENANT_ID,
        isActive: true,
      },
    });
  }
  console.log(`✅ メニューを${menus.length}件作成しました\n`);

  // 3. BookingStaff作成（5人）
  console.log('📝 スタッフを作成中...');

  const staff = [
    {
      id: '550e8400-e29b-41d4-a716-446655440021',
      name: '田中 美咲',
      email: 'tanaka@demo-salon.com',
      phone: '090-1234-5678',
      role: '店長・シニアスタイリスト',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440022',
      name: '佐藤 健太',
      email: 'sato@demo-salon.com',
      phone: '090-2345-6789',
      role: 'スタイリスト',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440023',
      name: '鈴木 花子',
      email: 'suzuki@demo-salon.com',
      phone: '090-3456-7890',
      role: 'スタイリスト',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440024',
      name: '高橋 翔',
      email: 'takahashi@demo-salon.com',
      phone: '090-4567-8901',
      role: 'アシスタント',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440025',
      name: '伊藤 愛',
      email: 'ito@demo-salon.com',
      phone: '090-5678-9012',
      role: 'アシスタント',
    },
  ];

  for (const s of staff) {
    await prisma.bookingStaff.upsert({
      where: { id: s.id },
      update: {},
      create: {
        ...s,
        tenantId: TENANT_ID,
        isActive: true,
      },
    });
  }
  console.log(`✅ スタッフを${staff.length}件作成しました\n`);

  // 4. スタッフシフト作成
  console.log('📝 スタッフシフトを作成中...');

  // 田中（店長）: 月〜土 9:00-20:00
  const tanaka_shifts = [
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
  ];
  for (const day of tanaka_shifts) {
    await prisma.bookingStaffShift.upsert({
      where: {
        tenantId_staffId_dayOfWeek: {
          tenantId: TENANT_ID,
          staffId: '550e8400-e29b-41d4-a716-446655440021',
          dayOfWeek: day as DayOfWeek,
        },
      },
      update: {},
      create: {
        tenantId: TENANT_ID,
        staffId: '550e8400-e29b-41d4-a716-446655440021',
        dayOfWeek: day as DayOfWeek,
        startTime: '09:00',
        endTime: '20:00',
        isActive: true,
      },
    });
  }

  // 佐藤: 火〜土 10:00-19:00
  const sato_shifts = [
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
  ];
  for (const day of sato_shifts) {
    await prisma.bookingStaffShift.upsert({
      where: {
        tenantId_staffId_dayOfWeek: {
          tenantId: TENANT_ID,
          staffId: '550e8400-e29b-41d4-a716-446655440022',
          dayOfWeek: day as DayOfWeek,
        },
      },
      update: {},
      create: {
        tenantId: TENANT_ID,
        staffId: '550e8400-e29b-41d4-a716-446655440022',
        dayOfWeek: day as DayOfWeek,
        startTime: '10:00',
        endTime: '19:00',
        isActive: true,
      },
    });
  }

  // 鈴木: 月〜金 9:00-18:00
  const suzuki_shifts = [
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
  ];
  for (const day of suzuki_shifts) {
    await prisma.bookingStaffShift.upsert({
      where: {
        tenantId_staffId_dayOfWeek: {
          tenantId: TENANT_ID,
          staffId: '550e8400-e29b-41d4-a716-446655440023',
          dayOfWeek: day as DayOfWeek,
        },
      },
      update: {},
      create: {
        tenantId: TENANT_ID,
        staffId: '550e8400-e29b-41d4-a716-446655440023',
        dayOfWeek: day as DayOfWeek,
        startTime: '09:00',
        endTime: '18:00',
        isActive: true,
      },
    });
  }

  console.log('✅ スタッフシフトを作成しました\n');

  // 5. BookingUser（顧客）作成（10人）
  console.log('📝 顧客を作成中...');

  const users = [
    {
      id: '550e8400-e29b-41d4-a716-446655440031',
      email: 'yamada@example.com',
      name: '山田 太郎',
      phone: '080-1111-2222',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440032',
      email: 'tanaka.customer@example.com',
      name: '田中 次郎',
      phone: '080-2222-3333',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440033',
      email: 'suzuki.yuki@example.com',
      name: '鈴木 由紀',
      phone: '080-3333-4444',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440034',
      email: 'sato.akiko@example.com',
      name: '佐藤 明子',
      phone: '080-4444-5555',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440035',
      email: 'watanabe@example.com',
      name: '渡辺 健',
      phone: '080-5555-6666',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440036',
      email: 'kobayashi@example.com',
      name: '小林 美和',
      phone: '080-6666-7777',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440037',
      email: 'nakamura@example.com',
      name: '中村 誠',
      phone: '080-7777-8888',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440038',
      email: 'ito.mai@example.com',
      name: '伊藤 舞',
      phone: '080-8888-9999',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440039',
      email: 'yoshida@example.com',
      name: '吉田 拓也',
      phone: '080-9999-0000',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440040',
      email: 'kato.rina@example.com',
      name: '加藤 里奈',
      phone: '080-0000-1111',
    },
  ];

  for (const user of users) {
    await prisma.bookingUser.upsert({
      where: { id: user.id },
      update: {},
      create: {
        ...user,
        tenantId: TENANT_ID,
      },
    });
  }
  console.log(`✅ 顧客を${users.length}件作成しました\n`);

  // 6. BookingReservation作成（過去30件 + 未来20件）
  console.log('📝 予約を作成中...');

  const reservations = [];
  const today = new Date();

  // 過去30件の予約（過去30日分）
  for (let i = 30; i > 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // 土日は除外（定休日）
    if (date.getDay() === 0) continue;

    const times = ['10:00', '11:00', '14:00', '15:00', '16:00'];
    const randomTime = times[Math.floor(Math.random() * times.length)];

    const randomUser = users[Math.floor(Math.random() * users.length)];
    const randomStaff = staff.slice(0, 3)[
      Math.floor(Math.random() * 3)
    ]; // 店長・スタイリスト2人から
    const randomMenu = menus.slice(0, 10)[Math.floor(Math.random() * 10)]; // 主要メニューから

    // ランダムなステータス（過去の予約）
    const statuses = ['COMPLETED', 'COMPLETED', 'COMPLETED', 'CANCELLED'] as const; // 75%完了、25%キャンセル
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)] as 'COMPLETED' | 'CANCELLED';

    reservations.push({
      id: `past-${i}`,
      userId: randomUser.id,
      staffId: randomStaff.id,
      menuId: randomMenu.id,
      reservedDate: date,
      reservedTime: randomTime,
      status: randomStatus,
      notes: randomStatus === 'COMPLETED' ? '来店済み' : 'お客様都合',
    });
  }

  // 未来20件の予約（今日から20日後まで）
  for (let i = 0; i < 20; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);

    // 土日は除外
    if (date.getDay() === 0) continue;

    const times = ['10:00', '11:00', '13:00', '14:00', '15:00', '16:00'];
    const randomTime = times[Math.floor(Math.random() * times.length)];

    const randomUser = users[Math.floor(Math.random() * users.length)];
    const randomStaff = staff.slice(0, 3)[
      Math.floor(Math.random() * 3)
    ];
    const randomMenu = menus.slice(0, 10)[Math.floor(Math.random() * 10)];

    // 未来の予約は CONFIRMED または PENDING
    const statuses = ['CONFIRMED', 'CONFIRMED', 'PENDING'] as const;
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)] as 'CONFIRMED' | 'PENDING';

    reservations.push({
      id: `future-${i}`,
      userId: randomUser.id,
      staffId: randomStaff.id,
      menuId: randomMenu.id,
      reservedDate: date,
      reservedTime: randomTime,
      status: randomStatus,
      notes: randomStatus === 'PENDING' ? '確認待ち' : '',
    });
  }

  for (const reservation of reservations) {
    await prisma.bookingReservation.upsert({
      where: { id: reservation.id },
      update: {},
      create: {
        ...reservation,
        tenantId: TENANT_ID,
      },
    });
  }
  console.log(`✅ 予約を${reservations.length}件作成しました\n`);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 すべてのデモデータを作成しました！');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n📊 作成データサマリー:');
  console.log(`  ├─ 店舗設定: 1件`);
  console.log(`  ├─ メニュー: ${menus.length}件`);
  console.log(`  ├─ スタッフ: ${staff.length}件`);
  console.log(`  ├─ スタッフシフト: 複数曜日`);
  console.log(`  ├─ 顧客: ${users.length}件`);
  console.log(`  └─ 予約: ${reservations.length}件`);
  console.log('\n🌐 デモサイトでご確認ください！\n');
}

main()
  .catch((e) => {
    console.error('❌ エラー:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
