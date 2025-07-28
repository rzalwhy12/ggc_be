const {
    PrismaClient
} = require("@prisma/client");
const prisma = new PrismaClient();

// ✅ Ambil semua lowongan
const getLoker = async (req, res) => {
    try {
        const loker = await prisma.lowonganPekerjaan.findMany({
            orderBy: {
                createdAt: 'desc'
            },
        });
        res.status(200).json(loker);
    } catch (error) {
        res.status(500).json({
            error: "Gagal mengambil data lowongan"
        });
    }
};

// ✅ Ambil satu lowongan berdasarkan ID
const getLokerById = async (req, res) => {
    const {
        id
    } = req.params;
    try {
        const loker = await prisma.lowonganPekerjaan.findUnique({
            where: {
                id: parseInt(id)
            },
        });

        if (!loker) {
            return res.status(404).json({
                error: "Lowongan tidak ditemukan"
            });
        }

        res.status(200).json(loker);
    } catch (error) {
        res.status(500).json({
            error: "Terjadi kesalahan saat mengambil data"
        });
    }
};

// ✅ Tambah lowongan baru
const createLoker = async (req, res) => {
    const { posisi, lokasi, deskripsi, kualifikasi, jenis, gaji, deadline, perusahaan } = req.body;

    console.log('=== DEBUG CREATE LOKER ===');
    console.log('Request body:', req.body);
    console.log('Posisi:', posisi);
    console.log('Deadline:', deadline);
    console.log('Deadline type:', typeof deadline);

    // Validasi input
    if (!posisi || !lokasi || !deskripsi || !kualifikasi || !jenis || !deadline) {
        return res.status(400).json({
            error: "Semua field wajib diisi",
            missing: {
                posisi: !posisi,
                lokasi: !lokasi,
                deskripsi: !deskripsi,
                kualifikasi: !kualifikasi,
                jenis: !jenis,
                deadline: !deadline
            }
        });
    }

    try {
        const newLoker = await prisma.lowonganPekerjaan.create({
            data: {
                posisi,
                lokasi,
                deskripsi,
                kualifikasi,
                jenis,
                gaji: gaji || null,
                deadline: new Date(deadline),
                perusahaan: perusahaan || "Tidak disebutkan",
            },
        });

        console.log('Created loker:', newLoker);
        res.status(201).json(newLoker);
    } catch (error) {
        console.error('=== PRISMA ERROR ===');
        console.error('Error:', error);
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        console.error('Error meta:', error.meta);
        
        res.status(500).json({
            error: "Gagal menambahkan lowongan",
            detail: error.message,
            code: error.code
        });
    }
};

// ✅ Update lowongan berdasarkan ID
const updateLoker = async (req, res) => {
    const {
        id
    } = req.params;
    const {
        posisi,
        perusahaan,
        lokasi,
        deskripsi,
        kualifikasi,
        jenis,
        gaji,
        deadline
    } = req.body;

    try {
        const updated = await prisma.lowonganPekerjaan.update({
            where: {
                id: parseInt(id)
            },
            data: {
                posisi,
                perusahaan,
                lokasi,
                deskripsi,
                kualifikasi,
                jenis,
                gaji,
                deadline: new Date(deadline),
            },
        });

        res.status(200).json(updated);
    } catch (error) {
        res.status(500).json({
            error: "Gagal mengupdate lowongan"
        });
    }
};

// ✅ Hapus lowongan berdasarkan ID
const deleteLoker = async (req, res) => {
    const {
        id
    } = req.params;

    try {
        await prisma.lowonganPekerjaan.delete({
            where: {
                id: parseInt(id)
            },
        });

        res.status(200).json({
            message: "Lowongan berhasil dihapus"
        });
    } catch (error) {
        res.status(500).json({
            error: "Gagal menghapus lowongan"
        });
    }
};

module.exports = {
    getLoker,
    getLokerById,
    createLoker,
    updateLoker,
    deleteLoker,
};
