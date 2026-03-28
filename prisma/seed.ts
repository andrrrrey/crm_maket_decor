import { PrismaClient, Role, ClientStatus, ProjectType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Создать директора
  const director = await prisma.user.upsert({
    where: { login: "admin" },
    update: {},
    create: {
      email: "admin@maketdecor.ru",
      login: "admin",
      passwordHash: await bcrypt.hash("admin123", 10),
      name: "Руководитель",
      role: Role.DIRECTOR,
      isActive: true,
      hasInfoAccess: true,
      settings: {
        create: {
          openMonths: [],
        },
      },
    },
  });
  console.log("Director created:", director.login);

  // Создать менеджера
  const manager = await prisma.user.upsert({
    where: { login: "manager1" },
    update: {},
    create: {
      email: "manager1@maketdecor.ru",
      login: "manager1",
      passwordHash: await bcrypt.hash("manager123", 10),
      name: "Александра",
      role: Role.MANAGER,
      isActive: true,
      settings: {
        create: {
          openMonths: [],
        },
      },
    },
  });
  console.log("Manager created:", manager.login);

  // Создать производство
  const production = await prisma.user.upsert({
    where: { login: "production1" },
    update: {},
    create: {
      email: "production1@maketdecor.ru",
      login: "production1",
      passwordHash: await bcrypt.hash("prod123", 10),
      name: "Производство",
      role: Role.PRODUCTION,
      isActive: true,
      settings: {
        create: {
          openMonths: ["2026-03", "2026-04"],
        },
      },
    },
  });
  console.log("Production created:", production.login);

  // Создать дизайнера
  const designer = await prisma.user.upsert({
    where: { login: "designer1" },
    update: {},
    create: {
      email: "designer1@maketdecor.ru",
      login: "designer1",
      passwordHash: await bcrypt.hash("design123", 10),
      name: "Дизайнер",
      role: Role.DESIGNER,
      isActive: true,
      settings: {
        create: {
          openMonths: [],
        },
      },
    },
  });
  console.log("Designer created:", designer.login);

  // Тестовые клиенты
  const client1 = await prisma.client.create({
    data: {
      dateReceived: new Date("2026-03-01"),
      meetingDate: "05.03.2026",
      projectDate: new Date("2026-06-15"),
      venue: "Ресторан 'Марсель'",
      projectType: ProjectType.WEDDING,
      status: ClientStatus.ESTIMATE,
      clientName: "Иванов Иван / Петрова Мария",
      source: "Instagram",
      projectIdea: "Свадьба в пастельных тонах, арка с живыми цветами",
      managerId: manager.id,
    },
  });

  const client2 = await prisma.client.create({
    data: {
      dateReceived: new Date("2026-03-10"),
      projectDate: new Date("2026-05-20"),
      venue: "БЦ 'Горизонт'",
      projectType: ProjectType.CORPORATE,
      status: ClientStatus.MEETING,
      clientName: "ООО 'ТехПром'",
      source: "Рекомендация",
      managerId: manager.id,
    },
  });

  console.log("Test clients created");

  // Тестовый договор
  const contract = await prisma.contract.create({
    data: {
      dateSignedAt: new Date("2026-03-05"),
      installDate: new Date("2026-06-15"),
      mockupStatus: "IN_PROGRESS",
      clientName: "Сидорова Анна / Козлов Дмитрий",
      venue: "Загородный клуб 'Маяк'",
      totalAmount: 350000,
      prepaymentDate: "10.03.2026",
      prepaymentAmount: 175000,
      invoiceNumber: "2026-001",
      managerId: manager.id,
      sourceClientId: client1.id,
    },
  });

  // Обновить клиента — привязать к договору
  await prisma.client.update({
    where: { id: client1.id },
    data: { status: ClientStatus.CONTRACT },
  });

  console.log("Test contract created");

  // Тестовый проект
  const project = await prisma.project.create({
    data: {
      date: new Date("2026-06-15"),
      venue: "Загородный клуб 'Маяк'",
      description: "Свадьба Сидорова/Козлов. Пастельная гамма.",
      month: "2026-06",
      calendarColor: "#F472B6",
      managerId: manager.id,
      contractId: contract.id,
      tasks: {
        create: [
          { title: "Закупить живые цветы", sortOrder: 1 },
          { title: "Подготовить арку", sortOrder: 2 },
          { title: "Упаковать инвентарь", sortOrder: 3 },
        ],
      },
      purchases: {
        create: [
          { title: "Пионы розовые — 200 шт.", sortOrder: 1 },
          { title: "Эустома белая — 100 шт.", sortOrder: 2 },
        ],
      },
    },
  });
  console.log("Test project created");

  // Категории инвентаря
  const tablesCat = await prisma.inventoryCategory.create({
    data: { name: "Столы", sortOrder: 1 },
  });
  const glasswareCat = await prisma.inventoryCategory.create({
    data: { name: "Посуда для гостей", sortOrder: 2 },
  });

  await prisma.inventoryItem.createMany({
    data: [
      {
        categoryId: tablesCat.id,
        name: "Стол круглый",
        color: "Белый",
        quantity: 10,
      },
      {
        categoryId: tablesCat.id,
        name: "Стол прямоугольный",
        color: "Белый",
        quantity: 5,
      },
      {
        categoryId: glasswareCat.id,
        name: "Бокал для вина",
        color: "Прозрачный",
        quantity: 200,
      },
      {
        categoryId: glasswareCat.id,
        name: "Бокал для шампанского",
        color: "Прозрачный",
        quantity: 150,
      },
    ],
  });
  console.log("Inventory created");

  // Ткани
  await prisma.fabric.createMany({
    data: [
      {
        material: "БАРХАТ",
        color: "Чёрный",
        width: 300,
        cuts: "4м-4шт, 6м-8шт",
        totalLength: 64,
        yearBought: "2024",
        supplier: "Мухамад МСК",
      },
      {
        material: "ШЁЛК",
        color: "Пудра",
        width: 280,
        cuts: "3м-6шт, 5м-4шт",
        totalLength: 38,
        yearBought: "2025",
      },
    ],
  });
  console.log("Fabrics created");

  // Персонал
  await prisma.staff.createMany({
    data: [
      {
        section: "CORE_TEAM",
        fullName: "Смирнова Александра",
        position: "Руководитель",
        phone: "+7 999 000-00-01",
        startDate: "апрель 2018",
      },
      {
        section: "CORE_TEAM",
        fullName: "Петров Сергей",
        position: "Монтажник",
        phone: "+7 999 000-00-02",
        startDate: "июнь 2020",
        hasVehicle: "есть авто",
      },
      {
        section: "FREELANCE_MALE",
        fullName: "Иванов Алексей",
        position: "Монтажник",
        phone: "+7 999 000-00-03",
        hasVehicle: "нет авто",
      },
    ],
  });
  console.log("Staff created");

  // Подрядчики
  await prisma.contractor.createMany({
    data: [
      {
        category: "ПЕЧАТЬ ПЛЁНКИ",
        companyName: "ЗЕНОН",
        address: "ул. Примерная, 1",
        phone: "+7 495 000-00-01",
        recordedBy: "Александра",
      },
      {
        category: "БУМАГА",
        companyName: "Синий филин",
        phone: "+7 495 000-00-02",
      },
    ],
  });
  console.log("Contractors created");

  // Запись истории
  await prisma.historyEntry.create({
    data: {
      userId: director.id,
      action: "system.seed",
      entityType: "system",
      details: { message: "Database seeded" },
    },
  });

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
