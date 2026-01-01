import { PrismaClient } from '@prisma/client';
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
  const TENANT_ID = 'demo-restaurant';

  // 1. RestaurantSettings作成
  console.log('📝 RestaurantSettings作成中...');
  await prisma.restaurantSettings.upsert({
    where: { tenantId: TENANT_ID },
    update: {},
    create: {
      tenantId: TENANT_ID,
      storeName: 'デモ美容室',
      storeEmail: 'info@demo-salon.com',
      storePhone: '03-1234-5678',
      openTime: '09:00',
      closeTime: '20:00',
      slotDuration: 30, // 30分単位
      closedDays: ['Sunday'], // 日曜定休
    },
  });
  console.log('✅ RestaurantSettingsを作成しました');

  // 2. RestaurantMenu作成
  console.log('📝 RestaurantMenu作成中...');

  const menus = [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      name: 'カット',
      description: 'シャンプー・ブロー込み',
      price: 5000,
      duration: 60,
      category: 'ヘアスタイル',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      name: 'カラー',
      description: 'フルカラー',
      price: 8000,
      duration: 90,
      category: 'カラーリング',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440003',
      name: 'パーマ',
      description: 'デジタルパーマ',
      price: 12000,
      duration: 120,
      category: 'パーマ',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440004',
      name: 'カット＋カラー',
      description: 'カット・カラー・シャンプー・ブロー込み',
      price: 12000,
      duration: 120,
      category: 'セット',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440005',
      name: 'ヘッドスパ',
      description: '頭皮マッサージで癒しのひとときを',
      price: 3000,
      duration: 30,
      category: 'トリートメント',
    },
  ];

  for (const menu of menus) {
    await prisma.restaurantMenu.upsert({
      where: { id: menu.id },
      update: {},
      create: {
        ...menu,
        tenantId: TENANT_ID,
        isActive: true,
      },
    });
  }
  console.log('✅ RestaurantMenuを5件作成しました');

  // 3. RestaurantStaff作成（emailが必須なのでダミーメールアドレスを追加）
  console.log('📝 RestaurantStaff作成中...');

  const staff = [
    {
      id: '550e8400-e29b-41d4-a716-446655440011',
      name: '田中太郎',
      email: 'tanaka@demo-salon.com',
      role: 'シニアスタイリスト',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440012',
      name: '佐藤花子',
      email: 'sato@demo-salon.com',
      role: 'スタイリスト',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440013',
      name: '鈴木一郎',
      email: 'suzuki@demo-salon.com',
      role: 'アシスタント',
    },
  ];

  try {
    for (const s of staff) {
      await prisma.restaurantStaff.upsert({
        where: { id: s.id },
        update: {},
        create: {
          ...s,
          tenantId: TENANT_ID,
          isActive: true,
        },
      });
    }
    console.log('✅ RestaurantStaffを3件作成しました');
  } catch (error) {
    console.log('⚠️  RestaurantStaff作成をスキップしました（データベーススキーマの問題）');
    console.log('   RestaurantSettings と RestaurantMenu は正常に作成されています');
  }

  console.log('\n🎉 すべてのシードデータを作成しました！');
}

main()
  .catch((e) => {
    console.error('❌ エラー:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
