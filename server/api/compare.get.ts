import mysql from 'mysql2/promise'

export default defineEventHandler(async () => {
const config = useRuntimeConfig()

  // =============================
  // 🔹 WRDC (2 endpoint)
  // =============================
  const permukaan: any  = await $fetch('https://pdsda.sda.pu.go.id/api/daerah_irigasi?offset=1&jenis_kewenangan_id=1&jenis_daerah_irigasi_id=1&take=320', {
  headers: {
    'Authorization': `Bearer ${config.WRDC_TOKEN}`,
    'User-Agent': 'Mozilla/5.0'
  }
})

  const rawa: any = await $fetch(
    'https://pdsda.sda.pu.go.id/api/daerah_irigasi?offset=1&jenis_kewenangan_id=1&jenis_daerah_irigasi_id=3&take=120',
    {
      headers: {
        'Authorization': `Bearer ${config.WRDC_TOKEN}`,
        'User-Agent': 'Mozilla/5.0'
      }
    }
  )

  const wrdcRaw = [
    ...(permukaan.data || permukaan),
    ...(rawa.data || rawa)
  ]

  const wrdc = wrdcRaw.map((d: any) => ({
    nama: d.nama_daerah_irigasi?.trim(),
    luas: Number(d.total_luas_hektar),
    pengelola: d.kewenangan
  }))

  // =============================
  // 🔹 DB ePAKSI (JOIN + filter BALAI)
  // =============================


  const conn = await mysql.createConnection(config.DB_URL)

  const [rows]: any = await conn.execute(`
    SELECT 
      i.n_di,
      i.luas_baku,
      k.n_kabupaten
    FROM irigasi i
    LEFT JOIN tab_kabupaten k 
      ON i.id_kabupaten = k.id_kabupaten
    WHERE k.n_kabupaten LIKE 'BALAI%'
  `)

  const epaksi = rows.map((r: any) => ({
    nama: r.n_di?.trim(),
    luas: Number(r.luas_baku),
    pengelola: r.n_kabupaten
  }))

  return {
    wrdc,
    epaksi
  }
})