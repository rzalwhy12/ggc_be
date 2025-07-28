const { PrismaClient } = require("@prisma/client");
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  // 1. Tambahkan Fasilitas
  const fasilitasData = [
    { nama: "Kolam Renang", iconUrl: "https://example.com/icons/pool.png" },
    { nama: "Taman", iconUrl: "https://iili.io/FNlUJ07.png" },
    { nama: "Playground", iconUrl: "https://iili.io/FNlsJQs.png" },
    { nama: "Keamanan 24 Jam", iconUrl: "https://iili.io/FNlPi0l.png" },
    { nama: "Area Parkir", iconUrl: "https://iili.io/FNl4vrN.png" },
  ];

  const fasilitasRecords = [];
  for (const f of fasilitasData) {
    const created = await prisma.fasilitas.create({ data: f });
    fasilitasRecords.push(created);
  }

  // 2. Tambahkan User dengan hashed password
  const hashedPassword = await bcrypt.hash("123admin", 10);
  const admin = await prisma.user.create({
    data: {
      name: "admin",
      email: "admin@gmail.com",
      password: hashedPassword,
    },
  });

  // 3. Tambahkan Article untuk User
  const articlesData = [
    {
      title: "Tips Membeli Rumah Pertama",
      content: "Berikut ini tips penting dalam membeli rumah pertama...",
      category: "Edukasi",
      thumbnail: "https://imguh.com/images/2025/07/26/Contoh-Perumahan-Minimalis-Metland-Tambun-1024x6403b9179f2bfc2274c.jpg",
      authorId: admin.id,
    },
    {
      title: "Perbedaan KPR Subsidi & Non-Subsidi",
      content: "KPR subsidi cocok untuk penghasilan rendah...",
      category: "Finansial",
      thumbnail: "https://imguh.com/images/2025/07/26/Contoh-Perumahan-Minimalis-1024x71381cedd7864b329de.jpg",
      authorId: admin.id,
    },
  ];

  for (const article of articlesData) {
    await prisma.article.create({ data: article });
  }

  // 4. Tambahkan Perumahan, Spesifikasi & Relasi Fasilitas
  const perumahanData = [
    {
      nama: "Green Hill Residence",
      lokasi: "Bogor",
      hargaMulai: 450000000,
      thumbnail: "https://imguh.com/images/2025/07/26/Contoh-Perumahan-Minimalis-8-Park-Cluster-1024x706f3803f3ec149f437.jpg",
      type: "Cluster",
      gambarLainnya: [
        "https://imguh.com/images/2025/07/26/Contoh-Perumahan-Minimalis-1024x71381cedd7864b329de.jpg",
        "https://imguh.com/images/2025/07/26/Contoh-Perumahan-Minimalis-Cigelam-Citra-Residence-1024x64005e5699ec4a841ed.jpg",
      ],
      deskripsi: "Perumahan hijau dengan udara segar.",
      spesifikasi: {
        luasTanah: 120,
        luasBangunan: 90,
        kamarTidur: 3,
        kamarMandi: 2,
        listrik: "2200 Watt",
      },
      fasilitasIds: [fasilitasRecords[0].id, fasilitasRecords[1].id, fasilitasRecords[3].id],
    },
    {
      nama: "Citra Indah City",
      lokasi: "Cileungsi",
      hargaMulai: 300000000,
      thumbnail: "https://imguh.com/images/2025/07/26/Contoh-Perumahan-Minimalis-Metland-Tambun-1024x6403b9179f2bfc2274c.jpg",
      type: "Townhouse",
      gambarLainnya: [
        "https://imguh.com/images/2025/07/26/Contoh-Perumahan-Minimalis-1024x71381cedd7864b329de.jpg",
        "https://imguh.com/images/2025/07/26/Contoh-Perumahan-Minimalis-Cigelam-Citra-Residence-1024x64005e5699ec4a841ed.jpg",
      ],
      deskripsi: "Perumahan murah dan nyaman untuk keluarga muda.",
      spesifikasi: {
        luasTanah: 90,
        luasBangunan: 70,
        kamarTidur: 2,
        kamarMandi: 1,
        listrik: "1300 Watt",
      },
      fasilitasIds: [fasilitasRecords[1].id, fasilitasRecords[2].id, fasilitasRecords[4].id],
    },
  ];

  for (const p of perumahanData) {
    const createdPerumahan = await prisma.perumahan.create({
      data: {
        nama: p.nama,
        lokasi: p.lokasi,
        hargaMulai: p.hargaMulai,
        thumbnail: p.thumbnail,
        type: p.type,
        gambarLainnya: p.gambarLainnya,
        deskripsi: p.deskripsi,
        createdAt: new Date(),
      },
    });

    // Tambahkan spesifikasi
    await prisma.spesifikasiPerumahan.create({
      data: {
        ...p.spesifikasi,
        perumahanId: createdPerumahan.id,
      },
    });

    // Tambahkan relasi fasilitas
    for (const fasilitasId of p.fasilitasIds) {
      await prisma.fasilitasPerumahan.create({
        data: {
          perumahanId: createdPerumahan.id,
          fasilitasId: fasilitasId,
        },
      });
    }
  }

  console.log("✅ Semua dummy data berhasil dibuat!");
}

main()
  .catch((e) => {
    console.error("❌ Error saat seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
