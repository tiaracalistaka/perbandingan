import mysql from 'mysql2/promise'

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()

  try {
    // =============================
    // 🔹 WRDC (2 endpoint)
    // =============================
    const permukaan: any = await $fetch('https://pdsda.sda.pu.go.id/api/daerah_irigasi?offset=1&jenis_kewenangan_id=1&jenis_daerah_irigasi_id=1&take=320', {
      headers: {
        'User': `${config.WRDC_USER}`,
        'Token': `${config.WRDC_TOKEN}`,
        'User-Agent': 'Mozilla/5.0'
      }
    })

    const rawa: any = await $fetch(
      'https://pdsda.sda.pu.go.id/api/daerah_irigasi?offset=1&jenis_kewenangan_id=1&jenis_daerah_irigasi_id=3&take=120',
      {
        headers: {
          'User': `${config.WRDC_USER}`,
          'Token': `${config.WRDC_TOKEN}`,
          'User-Agent': 'Mozilla/5.0'
        }
      }
    )

    // Extract records from nested data structure
    const permukaanArray = Array.isArray(permukaan?.data?.records) ? permukaan.data.records : []
    const rawaArray = Array.isArray(rawa?.data?.records) ? rawa.data.records : []

    console.log(`✅ WRDC API: permukaan=${permukaanArray.length} records, rawa=${rawaArray.length} records`)

    const wrdcRaw = [
      ...permukaanArray,
      ...rawaArray
    ]

    const wrdc = wrdcRaw.map((d: any) => ({
      nama: d.nama_daerah_irigasi?.trim(),
      luas: Number(d.total_luas_hektar),
      pengelola: d.kewenangan
    }))
    // TEST WRDC
    // return {
    //   wrdc
    // }
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

    console.log(`✅ DB: epaksi=${epaksi.length} records`)

    return {
      wrdc,
      epaksi
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Internal Server Error'
    })
  }
})