const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const streamifier = require("streamifier");
const cloudinary = require("../utils/cloudinary"); // ✅ pastikan path benar

const uploadToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

const createPerumahan = async (req, res) => {
  try {
    const {
      nama,
      lokasi,
      type,
      hargaMulai,
      deskripsi,
      spesifikasi,
      fasilitasIds,
    } = req.body;

    // Validasi data dasar
    if (
      !nama ||
      !lokasi ||
      !type | !hargaMulai ||
      !deskripsi ||
      !spesifikasi ||
      !fasilitasIds
    ) {
      return res.status(400).json({
        error:
          "Field wajib: nama, lokasi, hargaMulai, deskripsi, spesifikasi, fasilitasIds, type",
      });
    }

    // Parsing spesifikasi
    let parsedSpesifikasi, parsedFasilitasIds;

    try {
      parsedSpesifikasi =
        typeof spesifikasi === "string" ? JSON.parse(spesifikasi) : spesifikasi;
      if (
        typeof parsedSpesifikasi !== "object" ||
        Array.isArray(parsedSpesifikasi)
      ) {
        return res
          .status(400)
          .json({ error: "Format spesifikasi harus berupa object" });
      }
      // Konversi field numerik ke integer
      if (parsedSpesifikasi.luasTanah)
        parsedSpesifikasi.luasTanah = parseInt(parsedSpesifikasi.luasTanah);
      if (parsedSpesifikasi.luasBangunan)
        parsedSpesifikasi.luasBangunan = parseInt(
          parsedSpesifikasi.luasBangunan
        );
      if (parsedSpesifikasi.kamarTidur)
        parsedSpesifikasi.kamarTidur = parseInt(parsedSpesifikasi.kamarTidur);
      if (parsedSpesifikasi.kamarMandi)
        parsedSpesifikasi.kamarMandi = parseInt(parsedSpesifikasi.kamarMandi);
      if (parsedSpesifikasi.listrik)
        parsedSpesifikasi.listrik = String(parsedSpesifikasi.listrik);
    } catch (e) {
      return res
        .status(400)
        .json({ error: "Format spesifikasi tidak valid", detail: e.message });
    }

    // Parsing fasilitasIds
    try {
      parsedFasilitasIds =
        typeof fasilitasIds === "string"
          ? JSON.parse(fasilitasIds)
          : fasilitasIds;
      if (!Array.isArray(parsedFasilitasIds)) {
        return res
          .status(400)
          .json({ error: "Format fasilitasIds harus berupa array" });
      }
    } catch (e) {
      return res
        .status(400)
        .json({ error: "Format fasilitasIds tidak valid", detail: e.message });
    }

    // Validasi thumbnail
    if (
      !req.files ||
      !req.files["thumbnail"] ||
      req.files["thumbnail"].length === 0
    ) {
      return res.status(400).json({
        error: "Thumbnail wajib diupload. Field file harus bernama 'thumbnail'",
      });
    }

    const thumbnailBuffer = req.files["thumbnail"][0].buffer;
    const thumbnailUrl = await uploadToCloudinary(
      thumbnailBuffer,
      "perumahan/thumbnail"
    );

    const gambarLainnyaFiles = req.files["gambarLainnya"] || [];
    const gambarLainnyaUrls = await Promise.all(
      gambarLainnyaFiles.map((file) =>
        uploadToCloudinary(file.buffer, "perumahan/gambarLainnya")
      )
    );

    // Buat entitas perumahan beserta relasi
    const perumahan = await prisma.perumahan.create({
      data: {
        nama,
        lokasi,
        hargaMulai: parseInt(hargaMulai),
        deskripsi,
        type,
        thumbnail: thumbnailUrl,
        gambarLainnya: gambarLainnyaUrls,

        spesifikasi: {
          create: {
            luasTanah: parsedSpesifikasi.luasTanah,
            luasBangunan: parsedSpesifikasi.luasBangunan,
            kamarTidur: parsedSpesifikasi.kamarTidur,
            kamarMandi: parsedSpesifikasi.kamarMandi,
            listrik: parsedSpesifikasi.listrik,
          },
        },

        fasilitas: {
          create: parsedFasilitasIds.map((fasilitasId) => ({
            fasilitas: {
              connect: { id: fasilitasId },
            },
          })),
        },
      },
      include: {
        spesifikasi: true,
        fasilitas: {
          include: { fasilitas: true },
        },
      },
    });

    res.status(201).json({ success: true, data: perumahan });
  } catch (error) {
    console.error("Error creating perumahan:", error);
    res.status(500).json({
      error: "Terjadi kesalahan saat membuat perumahan",
      detail:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// UPDATE

const updatePerumahan = async (req, res) => {
  try {
    const {
      nama,
      lokasi,
      type,
      hargaMulai,
      deskripsi,
      spesifikasi,
      fasilitasIds,
    } = req.body;

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "ID perumahan harus disediakan" });
    }

    const perumahanId = parseInt(id);

    const existingPerumahan = await prisma.perumahan.findUnique({
      where: { id: perumahanId },
      include: { spesifikasi: true, fasilitas: true },
    });

    if (!existingPerumahan) {
      return res.status(404).json({ error: "Perumahan tidak ditemukan" });
    }

    let parsedSpesifikasi, parsedFasilitasIds;

    try {
      parsedSpesifikasi =
        typeof spesifikasi === "string" ? JSON.parse(spesifikasi) : spesifikasi;
      if (
        parsedSpesifikasi &&
        (typeof parsedSpesifikasi !== "object" ||
          Array.isArray(parsedSpesifikasi))
      ) {
        return res
          .status(400)
          .json({ error: "Format spesifikasi harus berupa object" });
      }
    } catch (e) {
      return res
        .status(400)
        .json({ error: "Format spesifikasi tidak valid", detail: e.message });
    }

    try {
      parsedFasilitasIds =
        typeof fasilitasIds === "string"
          ? JSON.parse(fasilitasIds)
          : fasilitasIds;
      if (parsedFasilitasIds && !Array.isArray(parsedFasilitasIds)) {
        return res
          .status(400)
          .json({ error: "Format fasilitasIds harus berupa array" });
      }
    } catch (e) {
      return res
        .status(400)
        .json({ error: "Format fasilitasIds tidak valid", detail: e.message });
    }

    // Upload thumbnail jika ada file baru
    let thumbnailUrl = existingPerumahan.thumbnail;
    if (req.files?.["thumbnail"]?.[0]) {
      thumbnailUrl = await uploadToCloudinary(
        req.files["thumbnail"][0].buffer,
        "perumahan/thumbnail"
      );
    }

    // Upload gambar lainnya jika ada file baru
    let gambarLainnyaUrls = existingPerumahan.gambarLainnya;
    if (req.files?.["gambarLainnya"]?.length > 0) {
      gambarLainnyaUrls = await Promise.all(
        req.files["gambarLainnya"].map((file) =>
          uploadToCloudinary(file.buffer, "perumahan/gambarLainnya")
        )
      );
    }

    // Update perumahan
    const updatedPerumahan = await prisma.perumahan.update({
      where: { id: perumahanId },
      data: {
        nama,
        lokasi,
        hargaMulai: hargaMulai ? parseInt(hargaMulai) : undefined,
        deskripsi,
        type,
        thumbnail: thumbnailUrl,
        gambarLainnya: gambarLainnyaUrls,

        spesifikasi: parsedSpesifikasi
          ? {
              upsert: {
                update: {
                  luasTanah: parsedSpesifikasi.luasTanah,
                  luasBangunan: parsedSpesifikasi.luasBangunan,
                  kamarTidur: parsedSpesifikasi.kamarTidur,
                  kamarMandi: parsedSpesifikasi.kamarMandi,
                  listrik: parsedSpesifikasi.listrik,
                },
                create: {
                  luasTanah: parsedSpesifikasi.luasTanah,
                  luasBangunan: parsedSpesifikasi.luasBangunan,
                  kamarTidur: parsedSpesifikasi.kamarTidur,
                  kamarMandi: parsedSpesifikasi.kamarMandi,
                  listrik: parsedSpesifikasi.listrik,
                },
              },
            }
          : undefined,

        fasilitas: parsedFasilitasIds
          ? {
              deleteMany: {}, // Hapus semua relasi lama
              create: parsedFasilitasIds.map((fasilitasId) => ({
                fasilitasId: fasilitasId,
              })),
            }
          : undefined,
      },
      include: {
        spesifikasi: true,
        fasilitas: {
          include: { fasilitas: true },
        },
      },
    });

    res.status(200).json({ success: true, data: updatedPerumahan });
  } catch (error) {
    console.error("Error updating perumahan:", error);
    res.status(500).json({
      error: "Terjadi kesalahan saat mengupdate perumahan",
      detail:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Read all Perumahan lengkap dengan relasi
const getAllPerumahan = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const offset = (page - 1) * limit;
    const search = req.query.search || "";

    const where = search
      ? {
          nama: {
            contains: search,
            mode: "insensitive",
          },
        }
      : {};

    const [data, total] = await Promise.all([
      prisma.perumahan.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          spesifikasi: true,
          fasilitas: {
            include: {
              fasilitas: true,
            },
          },
        },
      }),
      prisma.perumahan.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      data,
      total,
      totalPages,
      currentPage: page,
    });
  } catch (err) {
    console.error("Error getAllPerumahan:", err);
    res.status(500).json({ error: "Gagal mengambil data perumahan" });
  }
};

// Read single Perumahan by id
const getPerumahanById = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const perumahan = await prisma.perumahan.findUnique({
      where: { id },
      include: {
        spesifikasi: true,
        fasilitas: {
          include: {
            fasilitas: true,
          },
        },
      },
    });
    if (!perumahan)
      return res.status(404).json({ error: "Perumahan not found" });
    res.json(perumahan);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch perumahan" });
  }
};

// Delete Perumahan + cascade spesifikasi & fasilitas relation
const deletePerumahan = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    // Hapus spesifikasi dulu
    await prisma.spesifikasiPerumahan.deleteMany({
      where: { perumahanId: id },
    });
    // Hapus fasilitas relation dulu
    await prisma.fasilitasPerumahan.deleteMany({ where: { perumahanId: id } });
    // Hapus perumahan
    await prisma.perumahan.delete({ where: { id } });

    res.json({ message: "Perumahan deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete perumahan" });
  }
};

const filterPerumahan = async (req, res) => {
  try {
    const { nama, type, hargaMin, hargaMax, fasilitasIds } = req.query;

    const where = {};

    if (nama) {
      where.nama = {
        contains: nama,
        mode: "insensitive",
      };
    }

    if (type) {
      where.type = {
        equals: type,
        mode: "insensitive",
      };
    }

    if (hargaMin || hargaMax) {
      where.hargaMulai = {};
      if (hargaMin) where.hargaMulai.gte = parseInt(hargaMin);
      if (hargaMax) where.hargaMulai.lte = parseInt(hargaMax);
    }

    // fasilitasIds diharapkan berupa string JSON array, contoh: fasilitasIds=[1,2,3]
    let fasilitasFilter = {};
    if (fasilitasIds) {
      let parsedFasilitasIds;
      try {
        parsedFasilitasIds =
          typeof fasilitasIds === "string"
            ? JSON.parse(fasilitasIds)
            : fasilitasIds;

        if (!Array.isArray(parsedFasilitasIds)) {
          return res
            .status(400)
            .json({ error: "Format fasilitasIds harus berupa array" });
        }
      } catch (e) {
        return res
          .status(400)
          .json({
            error: "Format fasilitasIds tidak valid",
            detail: e.message,
          });
      }

      fasilitasFilter = {
        some: {
          fasilitasId: {
            in: parsedFasilitasIds,
          },
        },
      };
    }

    const perumahanList = await prisma.perumahan.findMany({
      where: {
        ...where,
        ...(fasilitasIds ? { fasilitas: fasilitasFilter } : {}),
      },
      include: {
        spesifikasi: true,
        fasilitas: {
          include: {
            fasilitas: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      success: true,
      data: perumahanList,
      total: perumahanList.length,
    });
  } catch (error) {
    console.error("Error filterPerumahan:", error);
    res
      .status(500)
      .json({ error: "Terjadi kesalahan saat memfilter perumahan" });
  }
};

module.exports = {
  createPerumahan,
  getAllPerumahan,
  filterPerumahan,
  getPerumahanById,
  updatePerumahan,
  deletePerumahan,
};
