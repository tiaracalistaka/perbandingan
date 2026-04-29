<script setup>
const { data } = await useFetch('/api/compare')

const wrdcPage = ref(1)
const epaksiPage = ref(1)
const perPage = 10

const wrdcPaginated = computed(() => {
  const start = (wrdcPage.value - 1) * perPage
  return data.value?.wrdc.slice(start, start + perPage) || []
})

const epaksiPaginated = computed(() => {
  const start = (epaksiPage.value - 1) * perPage
  return data.value?.epaksi.slice(start, start + perPage) || []
})

// 🔥 fungsi compare warna
function getStatus(w) {
  const match = data.value?.epaksi.find(
    e => e.nama?.toLowerCase() === w.nama?.toLowerCase()
  )

  if (!match) return 'missing'

  if (w.luas !== match.luas || w.pengelola !== match.pengelola) {
    return 'different'
  }

  return 'same'
}
</script>

<template>
  <div class="p-6 bg-gray-50 min-h-screen">
    <h1 class="text-2xl font-bold mb-6">Compare WRDC vs ePAKSI</h1>

    <div class="grid grid-cols-2 gap-6">

      <!-- ================= WRDC ================= -->
      <div class="bg-white shadow rounded-xl p-4">
        <h2 class="font-semibold mb-3">WRDC</h2>

        <table class="w-full text-sm">
          <thead class="bg-gray-100">
            <tr>
              <th class="p-2 text-left">Nama DI</th>
              <th class="p-2">Luas</th>
              <th class="p-2">Pengelola</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="w in wrdcPaginated" :key="w.nama"
              :class="{
                'bg-green-100': getStatus(w)==='same',
                'bg-yellow-100': getStatus(w)==='different',
                'bg-red-100': getStatus(w)==='missing'
              }"
            >
              <td class="p-2">{{ w.nama }}</td>
              <td class="p-2 text-center">{{ w.luas }}</td>
              <td class="p-2 text-center">{{ w.pengelola }}</td>
            </tr>
          </tbody>
        </table>

        <div class="flex justify-between mt-3">
          <button @click="wrdcPage--" :disabled="wrdcPage===1">Prev</button>
          <button @click="wrdcPage++">Next</button>
        </div>
      </div>

      <!-- ================= ePAKSI ================= -->
      <div class="bg-white shadow rounded-xl p-4">
        <h2 class="font-semibold mb-3">ePAKSI</h2>

        <table class="w-full text-sm">
          <thead class="bg-gray-100">
            <tr>
              <th class="p-2 text-left">Nama DI</th>
              <th class="p-2">Luas</th>
              <th class="p-2">Pengelola</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="e in epaksiPaginated" :key="e.nama">
              <td class="p-2">{{ e.nama }}</td>
              <td class="p-2 text-center">{{ e.luas }}</td>
              <td class="p-2 text-center">{{ e.pengelola }}</td>
            </tr>
          </tbody>
        </table>

        <div class="flex justify-between mt-3">
          <button @click="epaksiPage--" :disabled="epaksiPage===1">Prev</button>
          <button @click="epaksiPage++">Next</button>
        </div>
      </div>

    </div>

    <!-- legend -->
    <div class="mt-6 flex gap-4 text-sm">
      <span class="bg-green-100 px-2 py-1 rounded">Sama</span>
      <span class="bg-yellow-100 px-2 py-1 rounded">Berbeda</span>
      <span class="bg-red-100 px-2 py-1 rounded">Tidak ada di ePAKSI</span>
    </div>
  </div>
</template>