<script setup lang="ts">
type DataDI = {
  nama: string
  luas: number
  pengelola: string
}

const { data, pending } = await useFetch<{
  wrdc: DataDI[]
  epaksi: DataDI[]
}>('/api/compare')

const page = ref(1)
const perPage = 10

const wrdc = computed<DataDI[]>(() => data.value?.wrdc || [])
const epaksi = computed<DataDI[]>(() => data.value?.epaksi || [])

const paginated = computed(() => {
  const start = (page.value - 1) * perPage
  return wrdc.value.slice(start, start + perPage)
})

function findMatch(nama: string) {
  return epaksi.value.find(e => e.nama === nama)
}

function getStatus(w: DataDI) {
  const match = findMatch(w.nama)

  if (!match) return 'red'

  if (
    match.luas === w.luas &&
    match.pengelola === w.pengelola
  ) return 'green'

  return 'yellow'
}

// modal
const isOpen = ref(false)
const selected = ref<{ wrdc: DataDI; epaksi?: DataDI } | null>(null)

function openDetail(w: DataDI) {
  selected.value = {
    wrdc: w,
    epaksi: findMatch(w.nama)
  }
  isOpen.value = true
}

// ✅ columns FIX
const columns = [
  { accessorKey: 'nama', header: 'Nama DI' },
  { accessorKey: 'luas', header: 'Luas' },
  { accessorKey: 'pengelola', header: 'Pengelola' },
  { id: 'action', header: '' }
]
</script>

<template>
  <UContainer class="py-8">
    <!-- HEADER -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold">Compare WRDC vs ePAKSI</h1>
      <p class="text-gray-500 text-sm">
        Highlight perbedaan data daerah irigasi
      </p>
    </div>

    <div v-if="pending" class="text-center py-10">
      <ULoader size="lg" />
    </div>

    <div v-else class="grid grid-cols-2 gap-6">
      <!-- WRDC -->
      <UCard>
        <template #header>
          <div class="flex justify-between items-center">
            <span class="font-semibold">WRDC</span>
            <UBadge color="blue">{{ wrdc.length }}</UBadge>
          </div>
        </template>

        <UTable :data="paginated" :columns="columns">
          <!-- warna status -->
          <template #nama-cell="{ row }">
            <div
              class="px-2 py-1 rounded text-sm font-medium"
              :class="{
                'bg-green-100 text-green-700': getStatus(row.original) === 'green',
                'bg-yellow-100 text-yellow-700': getStatus(row.original) === 'yellow',
                'bg-red-100 text-red-700': getStatus(row.original) === 'red'
              }"
            >
              {{ row.original.nama }}
            </div>
          </template>

          <!-- tombol -->
          <template #action-cell="{ row }">
            <UButton size="xs" color="gray" @click="openDetail(row.original)">
              Detail
            </UButton>
          </template>
        </UTable>
      </UCard>

      <!-- EPAKSI -->
      <UCard>
        <template #header>
          <div class="flex justify-between items-center">
            <span class="font-semibold">ePAKSI</span>
            <UBadge color="green">{{ epaksi.length }}</UBadge>
          </div>
        </template>

        <UTable
          :data="epaksi.slice(0, 10)"
          :columns="[
            { accessorKey: 'nama', header: 'Nama DI' },
            { accessorKey: 'luas', header: 'Luas' },
            { accessorKey: 'pengelola', header: 'Pengelola' }
          ]"
        />
      </UCard>
    </div>

    <!-- PAGINATION -->
    <div class="mt-6 flex justify-center">
      <UPagination
        v-model="page"
        :total="wrdc.length"
        :page-count="perPage"
      />
    </div>

    <!-- MODAL -->
    <UModal v-model="isOpen">
      <UCard>
        <template #header>
          <div class="font-semibold text-lg">Detail Perbandingan</div>
        </template>

        <div v-if="selected" class="grid grid-cols-2 gap-6 text-sm">
          <!-- WRDC -->
          <div class="space-y-2">
            <h3 class="font-semibold text-blue-600">WRDC</h3>
            <p><b>Nama:</b> {{ selected.wrdc.nama }}</p>
            <p><b>Luas:</b> {{ selected.wrdc.luas }}</p>
            <p><b>Pengelola:</b> {{ selected.wrdc.pengelola }}</p>
          </div>

          <!-- EPAKSI -->
          <div class="space-y-2">
            <h3 class="font-semibold text-green-600">ePAKSI</h3>

            <div v-if="selected.epaksi">
              <p><b>Nama:</b> {{ selected.epaksi.nama }}</p>
              <p><b>Luas:</b> {{ selected.epaksi.luas }}</p>
              <p><b>Pengelola:</b> {{ selected.epaksi.pengelola }}</p>
            </div>

            <div v-else class="text-red-500 font-medium">
              ❌ Tidak ditemukan di ePAKSI
            </div>
          </div>
        </div>
      </UCard>
    </UModal>
  </UContainer>
</template>