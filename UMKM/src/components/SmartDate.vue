<template>
  <div class="relative inline-block" :class="widthClass || 'w-full sm:w-auto'" ref="rootEl">
    <button
      type="button"
      @click="toggle"
      :class="[
        isDark
          ? 'bg-zinc-900 border-zinc-800 text-zinc-200'
          : 'bg-white border-slate-300 text-slate-800',
        'w-full border rounded-xl px-3 py-2 sm:py-1.5 text-xs outline-none transition-colors flex items-center gap-2 cursor-pointer tnum'
      ]"
    >
      <Calendar class="w-3.5 h-3.5 text-emerald-500 shrink-0" />
      <span class="truncate flex-1 text-left">{{ modelValue || placeholder }}</span>
      <ChevronDown class="w-3 h-3 text-zinc-400 shrink-0" />
    </button>

    <div v-if="open" @click="open = false" class="fixed inset-0 z-[9998]"></div>

    <Teleport to="body">
    <div
      v-if="open"
      :style="panelStyle"
      :class="[
        isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-slate-200',
        'fixed z-[9999] border rounded-2xl p-3 shadow-2xl w-[calc(100vw-2rem)] max-w-[300px] sm:w-[280px] space-y-2'
      ]"
    >
      <!-- Header: prev / clickable label / next -->
      <div class="flex items-center justify-between">
        <button type="button" @click="shiftPrev" :class="isDark ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-slate-100 text-slate-700'" class="no-ancient p-1.5 rounded-lg transition-colors cursor-pointer">
          <ChevronDown class="w-4 h-4 rotate-90" />
        </button>
        <button type="button" @click="cycleView" class="no-ancient text-xs font-bold px-2 py-1 rounded-lg transition-colors cursor-pointer" :class="isDark ? 'text-white hover:bg-zinc-800' : 'text-slate-900 hover:bg-slate-100'">
          {{ headerLabel }}
        </button>
        <button type="button" @click="shiftNext" :class="isDark ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-slate-100 text-slate-700'" class="no-ancient p-1.5 rounded-lg transition-colors cursor-pointer">
          <ChevronDown class="w-4 h-4 -rotate-90" />
        </button>
      </div>

      <!-- DAY VIEW -->
      <template v-if="view === 'day'">
        <div class="grid grid-cols-7 gap-1 text-center">
          <span v-for="wd in ['Su','Mo','Tu','We','Th','Fr','Sa']" :key="wd" class="text-[10px] font-semibold" :class="isDark ? 'text-zinc-500' : 'text-slate-400'">{{ wd }}</span>
        </div>
        <div class="grid grid-cols-7 gap-1">
          <div v-for="blank in blanks" :key="'b' + blank"></div>
          <button
            v-for="day in days"
            :key="day.iso"
            type="button"
            @click="pick(day.iso)"
            :title="colorize && day.hasOrder ? statusLabel(day.status) : ''"
            :class="[
              'no-ancient relative w-full aspect-square rounded-lg text-[11px] tnum flex items-center justify-center transition-all cursor-pointer',
              modelValue === day.iso ? 'ring-2 ring-emerald-500' : '',
              colorize && day.hasOrder
                ? (day.status === 'past'
                    ? (isDark ? 'bg-zinc-700 text-zinc-200 font-bold' : 'bg-slate-300 text-slate-700 font-bold')
                    : day.status === 'today'
                      ? 'bg-emerald-500 text-zinc-950 font-bold'
                      : 'bg-amber-500 text-zinc-950 font-bold')
                : day.status === 'today'
                  ? (isDark ? 'text-emerald-400 hover:bg-zinc-800' : 'text-emerald-600 hover:bg-slate-100')
                  : (isDark ? 'text-zinc-400 hover:bg-zinc-800' : 'text-slate-600 hover:bg-slate-100')
            ]"
          >
            {{ day.d }}
          </button>
        </div>

        <div v-if="colorize" class="flex items-center justify-center gap-3 pt-1 border-t text-[9px]" :class="isDark ? 'border-zinc-800 text-zinc-500' : 'border-slate-100 text-slate-400'">
          <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-sm bg-slate-400 inline-block"></span> Lewat</span>
          <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-sm bg-emerald-500 inline-block"></span> Hari ini</span>
          <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-sm bg-amber-500 inline-block"></span> Akan datang</span>
        </div>
      </template>

      <!-- MONTH VIEW -->
      <div v-else-if="view === 'month'" class="grid grid-cols-3 gap-1.5">
        <button
          v-for="(mn, mi) in monthNames"
          :key="mn"
          type="button"
          @click="pickMonth(mi)"
          :class="[
            'no-ancient py-2 rounded-lg text-[11px] font-medium transition-colors cursor-pointer',
            mi === cursor.getMonth()
              ? 'bg-emerald-500 text-zinc-950 font-bold'
              : (isDark ? 'text-zinc-300 hover:bg-zinc-800' : 'text-slate-700 hover:bg-slate-100')
          ]"
        >
          {{ mn }}
        </button>
      </div>

      <!-- YEAR VIEW -->
      <div v-else class="grid grid-cols-4 gap-1.5">
        <button
          v-for="yr in yearGrid"
          :key="yr"
          type="button"
          @click="pickYear(yr)"
          :class="[
            'no-ancient py-2 rounded-lg text-[11px] font-medium transition-colors cursor-pointer',
            yr === cursor.getFullYear()
              ? 'bg-emerald-500 text-zinc-950 font-bold'
              : (isDark ? 'text-zinc-300 hover:bg-zinc-800' : 'text-slate-700 hover:bg-slate-100')
          ]"
        >
          {{ yr }}
        </button>
      </div>
    </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from "vue";
import { Calendar, ChevronDown } from "lucide-vue-next";

const props = withDefaults(defineProps<{
  modelValue: string;
  theme?: string;
  colorize?: boolean;
  orderDates?: string[];
  placeholder?: string;
  widthClass?: string;
}>(), {
  theme: "dark",
  colorize: false,
  orderDates: () => [],
  placeholder: "Select date",
  widthClass: "",
});

const emit = defineEmits<{ (e: "update:modelValue", v: string): void; (e: "change", v: string): void }>();

const open = ref(false);
const view = ref<"day" | "month" | "year">("day");
const cursor = ref(props.modelValue ? new Date(props.modelValue + "T00:00:00") : new Date());
const isDark = computed(() => props.theme === "dark");
const rootEl = ref<HTMLElement | null>(null);
const panelStyle = ref<Record<string, string>>({});

// Position the teleported calendar under the trigger, flipping up / clamping to viewport.
function positionPanel() {
  const trg = rootEl.value?.querySelector("button");
  if (!trg) return;
  const r = trg.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(300, vw - 32);
  const estHeight = 340;
  const spaceBelow = vh - r.bottom;
  const openUp = spaceBelow < estHeight && r.top > spaceBelow;
  let left = r.right - width; // right-align to trigger
  if (left < 8) left = 8;
  if (left + width > vw - 8) left = Math.max(8, vw - width - 8);
  const style: Record<string, string> = { left: `${left}px` };
  if (openUp) style.bottom = `${vh - r.top + 6}px`;
  else style.top = `${r.bottom + 6}px`;
  panelStyle.value = style;
}
function onReposition() { if (open.value) positionPanel(); }
onMounted(() => {
  window.addEventListener("resize", onReposition);
  window.addEventListener("scroll", onReposition, true);
});
onBeforeUnmount(() => {
  window.removeEventListener("resize", onReposition);
  window.removeEventListener("scroll", onReposition, true);
});

const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function todayISO(): string {
  return new Date().toLocaleDateString("en-CA");
}
function dateStatus(d: string): "past" | "today" | "future" {
  const t = todayISO();
  if (d === t) return "today";
  return d < t ? "past" : "future";
}
function statusLabel(s: string): string {
  return s === "past" ? "Ada pesanan (lewat)" : s === "today" ? "Ada pesanan (hari ini)" : "Ada pesanan (akan datang)";
}

const headerLabel = computed(() => {
  if (view.value === "day") return cursor.value.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  if (view.value === "month") return String(cursor.value.getFullYear());
  const base = yearGrid.value;
  return `${base[0]} - ${base[base.length - 1]}`;
});

const blanks = computed(() => new Date(cursor.value.getFullYear(), cursor.value.getMonth(), 1).getDay());
const days = computed(() => {
  const y = cursor.value.getFullYear();
  const m = cursor.value.getMonth();
  const count = new Date(y, m + 1, 0).getDate();
  const set = new Set(props.orderDates);
  const out: Array<{ d: number; iso: string; hasOrder: boolean; status: "past" | "today" | "future" }> = [];
  for (let d = 1; d <= count; d++) {
    const iso = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    out.push({ d, iso, hasOrder: set.has(iso), status: dateStatus(iso) });
  }
  return out;
});

const yearGrid = computed(() => {
  const y = cursor.value.getFullYear();
  const start = y - (y % 12);
  return Array.from({ length: 12 }, (_, i) => start + i);
});

// Header click cycles day -> year (choose year), then year -> month, then month -> day
function cycleView() {
  view.value = view.value === "day" ? "year" : view.value === "year" ? "month" : "day";
}

function shiftPrev() {
  if (view.value === "day") cursor.value = new Date(cursor.value.getFullYear(), cursor.value.getMonth() - 1, 1);
  else if (view.value === "month") cursor.value = new Date(cursor.value.getFullYear() - 1, cursor.value.getMonth(), 1);
  else cursor.value = new Date(cursor.value.getFullYear() - 12, cursor.value.getMonth(), 1);
}
function shiftNext() {
  if (view.value === "day") cursor.value = new Date(cursor.value.getFullYear(), cursor.value.getMonth() + 1, 1);
  else if (view.value === "month") cursor.value = new Date(cursor.value.getFullYear() + 1, cursor.value.getMonth(), 1);
  else cursor.value = new Date(cursor.value.getFullYear() + 12, cursor.value.getMonth(), 1);
}

// Flow: year picked -> show months; month picked -> show days
function pickYear(yr: number) {
  cursor.value = new Date(yr, cursor.value.getMonth(), 1);
  view.value = "month";
}
function pickMonth(mi: number) {
  cursor.value = new Date(cursor.value.getFullYear(), mi, 1);
  view.value = "day";
}

function toggle() {
  open.value = !open.value;
  if (open.value) {
    view.value = "day";
    if (props.modelValue) cursor.value = new Date(props.modelValue + "T00:00:00");
    nextTick(positionPanel);
  }
}
function pick(iso: string) {
  emit("update:modelValue", iso);
  emit("change", iso);
  open.value = false;
}
</script>
