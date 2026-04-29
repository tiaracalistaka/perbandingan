import pkg from 'pg'
const { Client } = pkg

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)

  const readTotal = (response: any) => {
    const candidates = [
      response?.data?.total,
      response?.data?.total_data,
      response?.data?.totalRecords,
      response?.data?.total_records,
      response?.total,
      response?.total_data,
      response?.totalRecords,
      response?.total_records
    ]

    for (const value of candidates) {
      const total = Number(value)
      if (!Number.isNaN(total) && total > 0) return total
    }

    return 0
  }

  // Query parameters untuk pagination
  const wrdcPage = Math.max(1, parseInt(query.wrdcPage as string) || 1)
  const wrdcLimit = Math.min(100, parseInt(query.wrdcLimit as string) || 20)
  const epaksiPage = Math.max(1, parseInt(query.epaksiPage as string) || 1)
  const epaksiLimit = Math.min(100, parseInt(query.epaksiLimit as string) || 20)

  const wrdcOffset = (wrdcPage - 1) * wrdcLimit
  const epaksiOffset = (epaksiPage - 1) * epaksiLimit

  try {
    // =============================
    // 🔹 WRDC API (dengan pagination)
    // =============================
    const permukaan: any = await $fetch(
      `https://pdsda.sda.pu.go.id/api/daerah_irigasi?offset=${wrdcOffset + 1}&jenis_kewenangan_id=1&jenis_daerah_irigasi_id=1&take=${wrdcLimit}`,
      {
        headers: {
          'User': `${config.WRDC_USER}`,
          'Token': `${config.WRDC_TOKEN}`,
          'User-Agent': 'Mozilla/5.0'
        }
      }
    )

    const rawa: any = await $fetch(
      `https://pdsda.sda.pu.go.id/api/daerah_irigasi?offset=${wrdcOffset + 1}&jenis_kewenangan_id=1&jenis_daerah_irigasi_id=3&take=${wrdcLimit}`,
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
    const wrdcTotal = readTotal(permukaan) + readTotal(rawa) || wrdcRaw.length

    const wrdc = wrdcRaw.map((d: any) => ({
      nama: d.nama_daerah_irigasi?.trim(),
      luas: Number(d.total_luas_hektar),
      pengelola: d.data_daerah_irigasi?.[0]?.pengelola || d.pengelola || ''
    }))

    console.log(`✅ WRDC: ${wrdc.length} / Total: ${wrdcTotal}`)

    // =============================
    // 🔹 PostgreSQL (pakai DB_URL, dengan pagination)
    // =============================

    const client = new Client({
      connectionString: config.DB_URL,
      connectionTimeoutMillis: 10000
    })

    await client.connect()

    // Hitung total data
    const countResult = await client.query(`
      SELECT COUNT(*) as total
      FROM irigasi i
      LEFT JOIN tab_kabupaten k 
        ON i.id_kabupaten = k.id_kabupaten
      WHERE k.n_kabupaten LIKE 'BALAI%'
    `)

    const epaksiTotal = parseInt(countResult.rows[0]?.total || 0)

    // Query dengan LIMIT dan OFFSET
    const result = await client.query(`
      SELECT 
        i.n_di,
        i.luas_baku,
        k.n_kabupaten
      FROM irigasi i
      LEFT JOIN tab_kabupaten k 
        ON i.id_kabupaten = k.id_kabupaten
      WHERE k.n_kabupaten LIKE 'BALAI%'
      LIMIT $1 OFFSET $2
    `, [epaksiLimit, epaksiOffset])

    const epaksi = result.rows.map((r: any) => ({
      nama: r.n_di?.trim(),
      luas: Number(r.luas_baku),
      pengelola: r.n_kabupaten
    }))

    console.log(`✅ ePAKSI: ${epaksi.length} / Total: ${epaksiTotal}`)

    await client.end()

    return {
      wrdc: {
        data: wrdc,
        pagination: {
          page: wrdcPage,
          limit: wrdcLimit,
          total: wrdcTotal,
          totalPages: Math.ceil(wrdcTotal / wrdcLimit)
        }
      },
      epaksi: {
        data: epaksi,
        pagination: {
          page: epaksiPage,
          limit: epaksiLimit,
          total: epaksiTotal,
          totalPages: Math.ceil(epaksiTotal / epaksiLimit)
        }
      }
    }

  } catch (error: any) {
    console.error('❌ Error:', error)

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Internal Server Error'
    })
  }
})