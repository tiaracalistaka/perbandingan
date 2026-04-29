import pkg from 'pg'
const { Client } = pkg

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()

  try {
    // =============================
    // 🔹 WRDC API
    // =============================
    const permukaan: any = await $fetch(
      'https://pdsda.sda.pu.go.id/api/daerah_irigasi?offset=1&jenis_kewenangan_id=1&jenis_daerah_irigasi_id=1&take=320',
      {
        headers: {
          'User': `${config.WRDC_USER}`,
          'Token': `${config.WRDC_TOKEN}`,
          'User-Agent': 'Mozilla/5.0'
        }
      }
    )

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

    const permukaanArray = permukaan?.data?.records || []
    const rawaArray = rawa?.data?.records || []

    const wrdcRaw = [...permukaanArray, ...rawaArray]

    const wrdc = wrdcRaw.map((d: any) => ({
      nama: d.nama_daerah_irigasi?.trim(),
      luas: Number(d.total_luas_hektar),
      pengelola: d.kewenangan
    }))

    console.log(`✅ WRDC: ${wrdc.length}`)

    // =============================
    // 🔹 PostgreSQL (pakai DB_URL)
    // =============================

    const client = new Client({
      connectionString: config.DB_URL,
      connectionTimeoutMillis: 10000
    })

    await client.connect()

    const result = await client.query(`
      SELECT 
        i.n_di,
        i.luas_baku,
        k.n_kabupaten
      FROM irigasi i
      LEFT JOIN tab_kabupaten k 
        ON i.id_kabupaten = k.id_kabupaten
      WHERE k.n_kabupaten LIKE 'BALAI%'
    `)

    const epaksi = result.rows.map((r: any) => ({
      nama: r.n_di?.trim(),
      luas: Number(r.luas_baku),
      pengelola: r.n_kabupaten
    }))

    console.log(`✅ ePAKSI: ${epaksi.length}`)

    await client.end()

    return {
      wrdc,
      epaksi
    }

  } catch (error: any) {
    console.error('❌ Error:', error)

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Internal Server Error'
    })
  }
})