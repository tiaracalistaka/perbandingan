<script setup lang="ts">
type DataDI = {
  nama: string
  luas: number
  pengelola: string
}

type ApiResponse = {
  wrdc: {
    data?: DataDI[]
    pagination?: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
    permukaan?: {
      data: DataDI[]
      pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
      }
    }
    rawa?: {
      data: DataDI[]
      pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
      }
    }
  }
  epaksi: {
    data: DataDI[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }
}

const route = useRoute()
const router = useRouter()

const wrdcPage = ref(parseInt(route.query.wrdcPage as string) || 1)
const wrdcLimit = ref(10)
const epaksiPage = ref(parseInt(route.query.epaksiPage as string) || 1)
const epaksiLimit = ref(10)

const { data, pending, refresh } = await useFetch<ApiResponse>('/api/compare', {
  query: {
    wrdcPage: wrdcPage,
    wrdcLimit: wrdcLimit,
    epaksiPage: epaksiPage,
    epaksiLimit: epaksiLimit
  }
})

const wrdcData = computed<DataDI[]>(() => {
  const merged = data.value?.wrdc?.data

  if (Array.isArray(merged)) return merged

  const permukaan = data.value?.wrdc?.permukaan?.data || []
  const rawa = data.value?.wrdc?.rawa?.data || []

  return [...permukaan, ...rawa]
})

const wrdcPagination = computed(() => {
  const pagination = data.value?.wrdc?.pagination
  if (pagination) return pagination

  const permukaan = data.value?.wrdc?.permukaan?.pagination
  if (permukaan) return permukaan

  return data.value?.wrdc?.rawa?.pagination
})

const epaksiData = computed<DataDI[]>(() => data.value?.epaksi?.data || [])
const epaksiPagination = computed(() => data.value?.epaksi?.pagination)

function findMatch(nama: string) {
  return epaksiData.value.find(e => e.nama === nama)
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

// Update pagination
async function updateWrdcPage(page: number) {
  wrdcPage.value = page
  await router.push({
    query: {
      ...route.query,
      wrdcPage: page
    }
  })
  await refresh()
}

async function updateEpaksiPage(page: number) {
  epaksiPage.value = page
  await router.push({
    query: {
      ...route.query,
      epaksiPage: page
    }
  })
  await refresh()
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
            <UBadge color="primary">{{ wrdcPagination?.total || 0 }}</UBadge>
          </div>
        </template>

        <UTable :data="wrdcData" :columns="columns">
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
            <UButton size="xs" color="neutral" @click="openDetail(row.original)">
              Detail
            </UButton>
          </template>
        </UTable>

        <!-- Pagination WRDC -->
        <template #footer v-if="wrdcPagination">
          <div class="flex justify-center mt-4">
            <UPagination
              v-model:page="wrdcPage"
              :items-per-page="wrdcLimit"
              :total="wrdcPagination.total"
            />
          </div>
        </template>
      </UCard>

      <!-- EPAKSI -->
      <UCard>
        <template #header>
          <div class="flex justify-between items-center">
            <span class="font-semibold">ePAKSI</span>
            <UBadge color="info">{{ epaksiPagination?.total || 0 }}</UBadge>
          </div>
        </template>

        <UTable
          :data="epaksiData"
          :columns="[
            { accessorKey: 'nama', header: 'Nama DI' },
            { accessorKey: 'luas', header: 'Luas' },
            { accessorKey: 'pengelola', header: 'Pengelola' }
          ]"
        />

        <!-- Pagination ePAKSI -->
        <template #footer v-if="epaksiPagination">
          <div class="flex justify-center mt-4">
            <UPagination
              v-model:page="epaksiPage"
              :items-per-page="epaksiLimit"
              :total="epaksiPagination.total"
            />
          </div>
        </template>
      </UCard>
    </div>

    <!-- Removed old pagination -->

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