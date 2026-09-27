<template>
  <div class="relative" ref="rootEl">
    <button
      type="button"
      @click="toggle"
      :class="[
        isDark
          ? 'bg-zinc-950 border-zinc-800 text-zinc-200 hover:border-emerald-500/60'
          : 'bg-slate-50 border-slate-300 text-slate-900 hover:border-emerald-500/60',
        invalid ? 'border-rose-500' : '',
        widthClass,
        'appearance-none border rounded-xl px-3 py-2 pr-8 text-xs outline-none transition-all cursor-pointer text-left flex items-center justify-between gap-2'
      ]"
    >
      <span :class="selectedLabel ? '' : 'text-zinc-500'" class="truncate">{{ selectedLabel || placeholder }}</span>
      <ChevronDown class="w-3.5 h-3.5 text-zinc-400 shrink-0" />
    </button>

    <!-- Click-away backdrop + dropdown panel (teleported to body so no parent overflow clips it on mobile) -->
    <Teleport to="body">
    <div v-if="open" @click="open = false" class="fixed inset-0 z-[9998]"></div>
    <div
      v-if="open"
      ref="panelEl"
      :style="panelStyle"
      :class="[
        isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-slate-200',
        'fixed z-[9999] border rounded-xl shadow-2xl overflow-hidden'
      ]"
    >
      <!-- Search box -->
      <div v-if="searchable" :class="isDark ? 'border-zinc-800' : 'border-slate-100'" class="p-2 border-b">
        <div class="relative">
          <Search class="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref="searchEl"
            v-model="q"
            type="text"
            :placeholder="'Search...'"
            :class="[
              isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-slate-50 border-slate-300 text-slate-900',
              'w-full border rounded-lg pl-8 pr-2 py-1.5 text-xs outline-none'
            ]"
          />
        </div>
      </div>

      <!-- Options list -->
      <div class="max-h-56 overflow-y-auto py-1">
        <template v-if="groupedView.length > 0">
          <template v-for="grp in groupedView" :key="grp.name || '__flat__'">
            <div
              v-if="grp.name"
              class="px-3 py-1 text-[10px] font-bold uppercase tracking-wider sticky top-0"
              :class="isDark ? 'text-zinc-500 bg-zinc-950' : 'text-slate-400 bg-white'"
            >
              {{ grp.name }}
            </div>
            <button
              v-for="opt in grp.items"
              :key="String(opt.value)"
              type="button"
              @click="choose(opt)"
              :class="[
                'w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center justify-between gap-2 ancient-hover',
                String(opt.value) === String(modelValue)
                  ? (isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-700')
                  : (isDark ? 'text-zinc-200' : 'text-slate-700')
              ]"
            >
              <span class="truncate">{{ opt.label }}</span>
              <Check v-if="String(opt.value) === String(modelValue)" class="w-3.5 h-3.5 shrink-0" />
            </button>
          </template>
        </template>
        <div v-else class="px-3 py-4 text-center text-xs text-zinc-500">No results</div>
      </div>
    </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch, onMounted, onBeforeUnmount } from "vue";
import { ChevronDown, Search, Check } from "lucide-vue-next";

interface Opt { value: any; label: string; group?: string }

const props = withDefaults(defineProps<{
  modelValue: any;
  options: Opt[];
  placeholder?: string;
  searchable?: boolean;
  theme?: string;
  invalid?: boolean;
  widthClass?: string;
}>(), {
  placeholder: "-- Select --",
  searchable: true,
  theme: "dark",
  invalid: false,
  widthClass: "w-full",
});

const emit = defineEmits<{ (e: "update:modelValue", v: any): void; (e: "change", v: any): void }>();

const open = ref(false);
const q = ref("");
const searchEl = ref<HTMLInputElement | null>(null);
const rootEl = ref<HTMLElement | null>(null);
const panelEl = ref<HTMLElement | null>(null);
const panelStyle = ref<Record<string, string>>({});

const isDark = computed(() => props.theme === "dark");

// Position the teleported panel under the trigger, flipping up if it would overflow the viewport.
function positionPanel() {
  const trg = rootEl.value?.querySelector("button");
  if (!trg) return;
  const r = trg.getBoundingClientRect();
  const width = Math.max(r.width, 200);
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const spaceBelow = vh - r.bottom;
  const estHeight = 300;
  const openUp = spaceBelow < estHeight && r.top > spaceBelow;
  let left = r.left;
  if (left + width > vw - 8) left = Math.max(8, vw - width - 8);
  const style: Record<string, string> = { left: `${left}px`, width: `${width}px` };
  if (openUp) {
    style.bottom = `${vh - r.top + 4}px`;
    style.maxHeight = `${Math.min(estHeight, r.top - 12)}px`;
  } else {
    style.top = `${r.bottom + 4}px`;
    style.maxHeight = `${Math.min(estHeight, spaceBelow - 12)}px`;
  }
  panelStyle.value = style;
}

function onReposition() {
  if (open.value) positionPanel();
}
onMounted(() => {
  window.addEventListener("resize", onReposition);
  window.addEventListener("scroll", onReposition, true);
});
onBeforeUnmount(() => {
  window.removeEventListener("resize", onReposition);
  window.removeEventListener("scroll", onReposition, true);
});

const selectedLabel = computed(() => {
  const found = props.options.find((o) => String(o.value) === String(props.modelValue));
  return found ? found.label : "";
});

const filtered = computed(() => {
  const term = q.value.trim().toLowerCase();
  if (!term) return props.options;
  return props.options.filter((o) => o.label.toLowerCase().includes(term) || (o.group || "").toLowerCase().includes(term));
});

const groupedView = computed(() => {
  const hasGroups = props.options.some((o) => o.group);
  if (!hasGroups) {
    return filtered.value.length ? [{ name: "", items: filtered.value }] : [];
  }
  const map = new Map<string, Opt[]>();
  for (const o of filtered.value) {
    const g = o.group || "";
    if (!map.has(g)) map.set(g, []);
    map.get(g)!.push(o);
  }
  return Array.from(map.entries()).map(([name, items]) => ({ name, items }));
});

function toggle() {
  open.value = !open.value;
  if (open.value) {
    q.value = "";
    nextTick(() => { positionPanel(); searchEl.value?.focus(); });
  }
}
function choose(opt: Opt) {
  emit("update:modelValue", opt.value);
  emit("change", opt.value);
  open.value = false;
}

watch(() => props.modelValue, () => { /* keep label reactive */ });
</script>
