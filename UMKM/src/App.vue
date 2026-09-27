<template>
  <div 
    :class="[
      theme === 'dark' ? 'bg-zinc-950 text-zinc-100' : 'bg-slate-50 text-slate-800',
      'min-h-screen app-shell flex flex-col font-sans selection:bg-emerald-500 selection:text-white transition-colors duration-200'
    ]"
  >
    <!-- 1. Authentication Screen with Project Logo & Password Complexity -->
    <div v-if="!currentUser" class="flex-1 relative flex items-stretch overflow-hidden min-h-[100dvh]">
      <!-- Ambient layers -->
      <div class="absolute inset-0" :class="theme === 'dark' ? 'bg-aurora' : ''"></div>
      <div class="absolute inset-0 pointer-events-none" :class="theme === 'dark' ? 'bg-grid' : 'bg-grid-light'"></div>

      <div class="relative z-10 w-full grid lg:grid-cols-2 min-h-[100dvh]">
        <!-- LEFT: editorial brand panel with free Unsplash imagery -->
        <div class="hidden lg:flex relative flex-col justify-between p-10 overflow-hidden min-h-[100dvh]">
          <div class="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=1400&q=80"
              alt="Local commerce"
              class="w-full h-full object-cover"
            />
            <div class="absolute inset-0" :class="theme === 'dark' ? 'bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-zinc-950/40' : 'bg-gradient-to-t from-slate-950/90 via-slate-900/70 to-slate-900/30'"></div>
          </div>
          <div class="relative flex items-center gap-2.5">
            <img src="/logo-icon.png" alt="UMKM" class="w-9 h-9 object-contain" />
            <span class="text-white font-semibold tracking-tight">{{ t('UMKM ERP') }}</span>
          </div>
          <div class="relative space-y-4 max-w-md">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-400/25 backdrop-blur">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              {{ t('Enterprise Operations Platform') }}
            </span>
            <h2 class="text-3xl font-bold text-white leading-tight tracking-tight">
              {{ t('Run your business on') }} <span class="accent-text">{{ t('clean, precise') }}</span> {{ t('numbers.') }}
            </h2>
            <p class="text-sm text-zinc-300 leading-relaxed">
              {{ t('Periodic inventory, daily operations, operational expenditure, and executive analytics — unified in one accountable workspace.') }}
            </p>
            <div class="flex items-center gap-6 pt-2 text-xs text-zinc-400">
              <div><div class="text-lg font-bold text-white">{{ t('Realtime') }}</div>Stock &amp; sales</div>
              <div><div class="text-lg font-bold text-white">30-day</div>{{ t('Rolling P&amp;L') }}</div>
              <div><div class="text-lg font-bold text-white">{{ t('Secure') }}</div>API &amp; bots</div>
            </div>
          </div>
          <p class="relative text-[11px] text-zinc-500">© 2026 SkyUniverse Technology</p>
        </div>

        <!-- RIGHT: auth form -->
        <div class="flex items-center justify-center p-4 sm:p-8">
          <div
            v-spotlight
            :class="[
              theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white/90 border-slate-200',
              'spotlight ring-grad w-full max-w-md border rounded-md p-7 sm:p-8 backdrop-blur-xl space-y-6 shadow-sm rise-in'
            ]"
          >
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <img src="/logo.png" alt="UMKM" class="h-11 w-auto object-contain lg:hidden" />
                <button
                  type="button"
                  @click="toggleTheme"
                  :title="theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'"
                  class="ml-auto no-ancient p-2 rounded-md border transition-colors flex items-center justify-center cursor-pointer"
                  :class="theme === 'dark' ? 'border-zinc-800 text-zinc-400 hover:text-amber-300' : 'border-slate-200 text-slate-500 hover:text-amber-500'"
                >
                  <component :is="theme === 'dark' ? Sun : Moon" class="w-4 h-4" />
                </button>
              </div>
              <div>
                <h1 class="text-2xl font-bold tracking-tight" :class="theme === 'dark' ? 'text-white' : 'text-slate-900'">
                  {{ t('Welcome back') }}
                </h1>
                <p class="text-sm mt-1" :class="theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'">
                  {{ t('Sign in to your operations workspace.') }}
                </p>
              </div>
            </div>

            <!-- Form with novalidate to prevent browser default tooltips -->
            <form @submit.prevent="login" novalidate class="space-y-4">
              <div v-if="loginError" role="alert" aria-live="assertive" class="p-3.5 text-sm font-semibold bg-rose-500/15 border-2 border-rose-500/70 text-black rounded-md flex items-center gap-2.5 shadow-lg shadow-rose-950/30 animate-in fade-in slide-in-from-top-1 duration-200">
                <AlertTriangle class="w-5 h-5 shrink-0 text-rose-400" />
                <span>{{ loginError }}</span>
              </div>

              <!-- UID -->
              <div class="space-y-1.5">
                <label class="text-xs font-semibold" :class="theme === 'dark' ? 'text-zinc-300' : 'text-slate-700'">{{ t('UID') }}</label>
                <input
                  type="text"
                  v-model="loginForm.uid"
                  :placeholder="t('Masukan UID kamu')"
                  @input="loginErrors.username = ''; loginForm.uid = loginForm.uid.toUpperCase()"
                  :class="[
                    loginErrors.username
                      ? 'border-rose-500 ring-1 ring-rose-500/20'
                      : (theme === 'dark' ? 'bg-zinc-950/70 border-zinc-800 text-zinc-100' : 'bg-slate-50 border-slate-300 text-slate-900'),
                    'w-full border rounded-md px-3.5 py-2.5 text-sm outline-none transition-all font-mono tracking-wide'
                  ]"
                />
                <p v-if="loginErrors.username" class="text-[11px] text-rose-500 font-medium flex items-center gap-1">
                  <AlertTriangle class="w-3 h-3" />
                  <span>{{ loginErrors.username }}</span>
                </p>
              </div>

              <!-- Password -->
              <div class="space-y-1.5">
                <div class="flex items-center justify-between">
                  <label class="text-xs font-semibold" :class="theme === 'dark' ? 'text-zinc-300' : 'text-slate-700'">{{ t('Password') }}</label>
                  <span class="text-[10px] text-zinc-500">{{ t('A-Z, a-z, 0-9, special') }}</span>
                </div>
                <div class="relative">
                  <input
                    :type="showLoginPw ? 'text' : 'password'"
                    v-model="loginForm.password"
                    placeholder="••••••••"
                    @input="onPasswordInput"
                    :class="[
                      loginErrors.password
                        ? 'border-rose-500 ring-1 ring-rose-500/20'
                        : (theme === 'dark' ? 'bg-zinc-950/70 border-zinc-800 text-zinc-100' : 'bg-slate-50 border-slate-300 text-slate-900'),
                      'w-full border rounded-md pl-3.5 pr-11 py-2.5 text-sm outline-none transition-all'
                    ]"
                  />
                  <button
                    type="button"
                    @click="showLoginPw = !showLoginPw"
                    :title="showLoginPw ? 'Hide password' : 'Show password'"
                    class="no-ancient absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-colors"
                    :class="theme === 'dark' ? 'text-zinc-500 hover:text-emerald-400' : 'text-slate-400 hover:text-emerald-600'"
                  >
                    <component :is="showLoginPw ? EyeOff : Eye" class="w-4 h-4" />
                  </button>
                </div>
                <p v-if="loginErrors.password" class="text-[11px] text-rose-500 font-medium leading-tight flex items-start gap-1">
                  <AlertTriangle class="w-3 h-3 shrink-0 mt-0.5" />
                  <span>{{ loginErrors.password }}</span>
                </p>
              </div>

              <!-- Remember me (90 days) — unchecked by default -->
              <label class="flex items-center gap-2.5 cursor-pointer select-none group">
                <input
                  type="checkbox"
                  v-model="loginForm.remember"
                  class="w-4 h-4 rounded border cursor-pointer accent-emerald-500"
                  :class="theme === 'dark' ? 'bg-zinc-950 border-zinc-700' : 'bg-white border-slate-300'"
                />
                <span class="text-xs font-medium" :class="theme === 'dark' ? 'text-zinc-300 group-hover:text-zinc-100' : 'text-slate-600 group-hover:text-slate-900'">
                  {{ t('Ingat saya untuk 90 Hari') }}
                </span>
              </label>

              <!-- Locked login button -->
              <button
                type="submit"
                :disabled="!isLoginFormValid || isLoggingIn"
                :class="[
                  'no-ancient w-full py-2.5 rounded-md text-sm font-semibold transition-all flex items-center justify-center gap-2',
                  !isLoginFormValid || isLoggingIn
                    ? (theme === 'dark' ? 'bg-zinc-800/60 text-zinc-500 border border-zinc-800 cursor-not-allowed' : 'bg-slate-200 text-slate-400 border border-slate-200 cursor-not-allowed')
                    : 'btn-primary'
                ]"
              >
                <span v-if="isLoggingIn">{{ t('Authenticating…') }}</span>
                <span v-else>{{ isLoginFormValid ? 'Sign in to workspace' : 'Enter valid credentials to unlock' }}</span>
              </button>
            </form>

            <p class="text-center text-[11px] text-zinc-500 lg:hidden">© 2026 SkyUniverse Technology</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. Main Authenticated Application -->
    <div v-else class="flex-1 flex flex-col pb-28 md:pb-0">
      <!-- Top Navigation Header -->
      <header 
        :class="[
          theme === 'dark' 
            ? 'bg-zinc-950/70 border-zinc-800/70' 
            : 'bg-white/80 border-slate-200/70',
          'topbar-fixed sticky top-0 z-40 backdrop-blur-xl border-b px-4 md:px-8 py-3 transition-colors'
        ]"
      >
        <div class="max-w-6xl mx-auto flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="flex items-center justify-center rounded-md overflow-hidden shrink-0" :class="theme === 'dark' ? 'bg-zinc-900/60' : 'bg-slate-100'">
              <img 
                :src="businessInfo.business_logo || '/logo-icon.png'" 
                alt="UMKM Emblem" 
                class="w-9 h-9 object-contain p-0.5 hover:scale-105 transition-transform" 
              />
            </div>
            <div class="flex flex-col leading-tight">
              <div class="flex items-center gap-2">
                <span class="font-bold text-[15px] tracking-tight truncate max-w-[180px] sm:max-w-none" :class="theme === 'dark' ? 'text-white' : 'text-slate-900'">
                  {{ businessInfo.business_name || 'UMKM ERP' }}
                </span>
              </div>
              <span class="text-[10px] font-medium tracking-wide uppercase" :class="theme === 'dark' ? 'text-zinc-500' : 'text-slate-400'">{{ t('Operations Workspace') }}</span>
            </div>
          </div>

          <!-- Desktop Navigation Tabs (Ancient green animated line, zero fade background wash) -->
          <nav class="hidden md:flex items-center gap-1 bg-transparent border-0 p-0">
            <button 
              v-for="tab in tabs" 
              :key="tab.id"
              @click="handleTabChange(tab.id)"
              :class="[
                'nav-ancient-item flex items-center gap-1.5 px-3 py-2 text-xs font-semibold select-none',
                currentTab === tab.id 
                  ? (theme === 'dark' ? 'active-ancient text-emerald-400' : 'active-ancient text-emerald-600')
                  : (theme === 'dark' ? 'text-zinc-400 hover:text-white' : 'text-slate-600 hover:text-slate-950')
              ]"
            >
              <component :is="tab.icon" class="w-3.5 h-3.5 transition-transform" />
              <span>{{ t(tab.label) }}</span>
            </button>
          </nav>

          <!-- Header Right: Theme Switcher & User Profile & Logout -->
          <div class="flex items-center gap-2.5">
            <!-- Language Toggle (ID default / EN) -->
            <button
              @click="toggleLang"
              :title="lang === 'id' ? 'Ganti ke English' : 'Switch to Indonesian'"
              :class="[
                theme === 'dark'
                  ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:border-emerald-500/50'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 hover:border-emerald-500/50',
                'px-2.5 py-2 rounded-md border transition-all flex items-center gap-1 cursor-pointer text-[11px] font-bold uppercase tracking-wide'
              ]"
            >
              <Globe class="w-3.5 h-3.5 text-emerald-500" />
              <span>{{ lang.toUpperCase() }}</span>
            </button>

            <!-- Theme Toggle Button -->
            <button 
              @click="toggleTheme"
              :title="theme === 'dark' ? 'Switch to White Mode' : 'Switch to Dark Mode'"
              :class="[
                theme === 'dark' 
                  ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-amber-300 hover:border-emerald-500/50' 
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-amber-500 hover:border-emerald-500/50',
                'p-2 rounded-md border transition-all flex items-center justify-center cursor-pointer'
              ]"
            >
              <Sun v-if="theme === 'dark'" class="w-4 h-4 text-amber-400" />
              <Moon v-else class="w-4 h-4 text-slate-700" />
            </button>

            <!-- User profile circle + dropdown -->
            <div class="relative flex items-center gap-2.5" ref="profileMenuRoot">
              <!-- UID badge beside the profile photo -->
              <span
                v-if="currentUser?.wa_uid"
                :class="[
                  theme === 'dark' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' : 'bg-emerald-50 text-emerald-700 border-emerald-200',
                  'hidden sm:inline-flex items-center border rounded-md px-2 py-1 text-[11px] font-semibold font-mono tracking-wide whitespace-nowrap'
                ]"
                :title="'UID: ' + currentUser.wa_uid"
              >UID: {{ currentUser.wa_uid }}</span>
              <button
                ref="profileBtn"
                @click="toggleProfileMenu"
                :title="t('Account')"
                :class="[
                  theme === 'dark' ? 'ring-zinc-800 hover:ring-emerald-500/50' : 'ring-slate-200 hover:ring-emerald-500/50',
                  'w-9 h-9 rounded-full overflow-hidden ring-2 transition-all flex items-center justify-center cursor-pointer bg-emerald-500/15 shrink-0'
                ]"
              >
                <img v-if="currentUser?.avatar_url" :src="currentUser.avatar_url" alt="Avatar" class="w-full h-full object-cover" />
                <span v-else class="text-xs font-bold text-emerald-500 uppercase">{{ userInitials }}</span>
              </button>

              <!-- Dropdown (teleported to body so header zoom / overflow can't clip it) -->
              <Teleport to="body">
                <template v-if="showProfileMenu">
                  <!-- Click-away -->
                  <div @click="showProfileMenu = false" class="fixed inset-0 z-[60]"></div>
                  <div
                    :style="profileMenuStyle"
                    :class="[
                      theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-slate-200',
                      'fixed w-60 z-[61] border rounded-md shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-100'
                    ]"
                  >
                    <div class="p-4 flex items-center gap-3 border-b" :class="theme === 'dark' ? 'border-zinc-800' : 'border-slate-100'">
                      <div class="w-11 h-11 rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-emerald-500/15">
                        <img v-if="currentUser?.avatar_url" :src="currentUser.avatar_url" alt="Avatar" class="w-full h-full object-cover" />
                        <span v-else class="text-sm font-bold text-emerald-500 uppercase">{{ userInitials }}</span>
                      </div>
                      <div class="min-w-0">
                        <p class="text-sm font-bold truncate" :class="theme === 'dark' ? 'text-white' : 'text-slate-900'">{{ currentUser?.display_name || currentUser?.username }}</p>
                        <p v-if="currentUser?.wa_uid" class="text-[10px] font-mono text-emerald-500 truncate">UID: {{ currentUser.wa_uid }}</p>
                        <p class="text-[10px] text-zinc-500 capitalize">{{ currentUser?.role }}</p>
                      </div>
                    </div>
                    <div class="p-1.5">
                      <button
                        @click="openAppearance"
                        :class="theme === 'dark' ? 'text-zinc-200 hover:bg-zinc-800' : 'text-slate-700 hover:bg-slate-100'"
                        class="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer"
                      >
                        <UserCog class="w-4 h-4 text-emerald-500" />
                        <span>{{ t('User Appearance') }}</span>
                      </button>
                      <button
                        @click="logout"
                        class="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer text-rose-500 hover:bg-rose-500/10"
                      >
                        <LogOut class="w-4 h-4" />
                        <span>{{ t('Logout') }}</span>
                      </button>
                    </div>
                  </div>
                </template>
              </Teleport>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Application Container -->
      <main class="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 space-y-6">

        <!-- TAB 1: EXECUTIVE DASHBOARD & 30-DAY ROLLING -->
        <section v-if="currentTab === 'dashboard'" class="space-y-5 tab-view">
          <!-- Dashboard View Switcher: Finance vs Pesanan -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="inline-flex w-full sm:w-auto rounded-md p-1 gap-1" :class="theme === 'dark' ? 'bg-zinc-900 border border-zinc-800' : 'bg-slate-100 border border-slate-200'">
              <button
                @click="dashboardView = 'finance'"
                :class="[
                  'flex-1 sm:flex-none justify-center px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer',
                  dashboardView === 'finance'
                    ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                    : (theme === 'dark' ? 'text-zinc-400 hover:text-white' : 'text-slate-600 hover:text-slate-900')
                ]"
              >
                <DollarSign class="w-3.5 h-3.5 shrink-0" />
                <span class="truncate">{{ t('Dashboard Finance') }}</span>
              </button>
              <button
                @click="dashboardView = 'pesanan'"
                :class="[
                  'flex-1 sm:flex-none justify-center px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer',
                  dashboardView === 'pesanan'
                    ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                    : (theme === 'dark' ? 'text-zinc-400 hover:text-white' : 'text-slate-600 hover:text-slate-900')
                ]"
              >
                <ShoppingCart class="w-3.5 h-3.5 shrink-0" />
                <span class="truncate">{{ t('Dashboard Pesanan') }}</span>
              </button>
            </div>
            <div class="flex items-center gap-2 self-start sm:self-auto">
            <button
              @click="toggleFavoriteDashboard"
              :title="favoriteDashboard === dashboardView ? 'This is your default dashboard' : 'Set as default dashboard'"
              :class="[
                'px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 border cursor-pointer',
                favoriteDashboard === dashboardView
                  ? 'bg-amber-500/15 border-amber-500/50 text-amber-500'
                  : (theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-amber-400 hover:border-amber-500/40' : 'bg-white border-slate-200 text-slate-500 hover:text-amber-500 hover:border-amber-400')
              ]"
            >
              <Star class="w-3.5 h-3.5" :class="favoriteDashboard === dashboardView ? 'fill-amber-500' : ''" />
              <span>{{ favoriteDashboard === dashboardView ? 'Default' : 'Set as Default' }}</span>
            </button>
            <button
              @click="refreshCurrentTab"
              :title="t('Muat ulang data')"
              :class="[
                'px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 border cursor-pointer',
                theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-emerald-400 hover:border-emerald-500/40' : 'bg-white border-slate-200 text-slate-600 hover:text-emerald-600 hover:border-emerald-400'
              ]"
            >
              <RefreshCw class="w-3.5 h-3.5" />
              <span>{{ t('Segarkan') }}</span>
            </button>
            </div>
          </div>

          <!-- ============ DASHBOARD FINANCE ============ -->
          <div v-show="dashboardView === 'finance'" class="space-y-5">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 class="text-lg font-bold tracking-tight" :class="theme === 'dark' ? 'text-white' : 'text-slate-900'">
                {{ t('Financial & Inventory Overview') }}
              </h2>
              <p class="text-xs" :class="theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'">
                {{ t('Analisa Performa Keuangan Bulanan (Cut Off Setiap tanggal 1)') }}
              </p>
            </div>
            <div class="flex items-center gap-2 self-start sm:self-auto">
              <span class="text-xs" :class="theme === 'dark' ? 'text-zinc-400' : 'text-slate-600'">{{ t('Audit Date:') }}</span>
              <SmartDate v-model="selectedDate" :theme="theme" @change="loadDailyAnalytics" />
            </div>
          </div>

          <!-- 30-Day KPI Metrics Grid — clickable cards; explicit "lihat rincian" affordance, no colored rail/border-highlight -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
            <!-- 1. Omset (Revenue) -->
            <button
              type="button"
              @click="openKpiOverlay('revenue')"
              :class="[
                theme === 'dark' ? 'bg-zinc-900/70 border-zinc-800 hover:bg-zinc-900 hover:border-emerald-500' : 'bg-white border-slate-200 hover:bg-emerald-50/40 hover:border-emerald-400',
                'group no-lift no-ancient text-left border rounded-lg p-3 sm:p-4 flex flex-col gap-1.5 transition-colors cursor-pointer'
              ]"
            >
              <span class="flex items-center gap-2 text-[11px] sm:text-xs font-semibold" :class="theme === 'dark' ? 'text-zinc-300' : 'text-slate-600'">
                <span class="w-6 h-6 rounded-md flex items-center justify-center shrink-0 bg-emerald-500/15"><DollarSign class="w-3.5 h-3.5 text-emerald-500" /></span>
                <span class="leading-tight">{{ t('30 Days Revenue') }}</span>
              </span>
              <p class="font-bold tnum whitespace-nowrap leading-tight text-[clamp(1rem,4.5vw,1.5rem)]" :class="theme === 'dark' ? 'text-white' : 'text-slate-900'">{{ formatCurrency(analytics.rolling_revenue) }}</p>
              <span class="mt-auto pt-1 inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-emerald-600 group-hover:gap-1.5 transition-all">{{ t('Lihat rincian') }} <ChevronRight class="w-3 h-3" /></span>
            </button>

            <!-- 2. Pengeluaran (OpEx) -->
            <button
              type="button"
              @click="openKpiOverlay('opex')"
              :class="[
                theme === 'dark' ? 'bg-zinc-900/70 border-zinc-800 hover:bg-zinc-900 hover:border-rose-500' : 'bg-white border-slate-200 hover:bg-rose-50/40 hover:border-rose-400',
                'group no-lift no-ancient text-left border rounded-lg p-3 sm:p-4 flex flex-col gap-1.5 transition-colors cursor-pointer'
              ]"
            >
              <span class="flex items-center gap-2 text-[11px] sm:text-xs font-semibold" :class="theme === 'dark' ? 'text-zinc-300' : 'text-slate-600'">
                <span class="w-6 h-6 rounded-md flex items-center justify-center shrink-0 bg-rose-500/15"><Receipt class="w-3.5 h-3.5 text-rose-500" /></span>
                <span class="leading-tight">{{ t('30D OpEx') }}</span>
              </span>
              <p class="font-bold tnum whitespace-nowrap leading-tight text-[clamp(1rem,4.5vw,1.5rem)] text-rose-600">{{ formatCurrency(analytics.rolling_opex) }}</p>
              <span class="mt-auto pt-1 inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-rose-600 group-hover:gap-1.5 transition-all">{{ t('Lihat rincian') }} <ChevronRight class="w-3 h-3" /></span>
            </button>

            <!-- 3. Untung Bersih (Net Profit) -->
            <button
              type="button"
              @click="openKpiOverlay('profit')"
              :class="[
                theme === 'dark' ? 'bg-zinc-900/70 border-zinc-800 hover:bg-zinc-900 hover:border-sky-500' : 'bg-white border-slate-200 hover:bg-sky-50/40 hover:border-sky-400',
                'group no-lift no-ancient text-left border rounded-lg p-3 sm:p-4 flex flex-col gap-1.5 transition-colors cursor-pointer'
              ]"
            >
              <span class="flex items-center gap-2 text-[11px] sm:text-xs font-semibold" :class="theme === 'dark' ? 'text-zinc-300' : 'text-slate-600'">
                <span class="w-6 h-6 rounded-md flex items-center justify-center shrink-0 bg-sky-500/15"><TrendingUp class="w-3.5 h-3.5 text-sky-500" /></span>
                <span class="leading-tight">{{ t('30 Days Net Profit') }}</span>
              </span>
              <p 
                class="font-bold tnum whitespace-nowrap leading-tight text-[clamp(1rem,4.5vw,1.5rem)]"
                :class="analytics.gross_profit < 0 ? 'text-rose-600' : (theme === 'dark' ? 'text-white' : 'text-slate-900')"
              >
                {{ formatCurrency(analytics.gross_profit) }}
              </p>
              <span class="mt-auto pt-1 inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-emerald-600 group-hover:gap-1.5 transition-all">{{ t('Lihat cara hitung') }} <ChevronRight class="w-3 h-3" /></span>
            </button>

            <!-- 4. Barang Terbuang (Waste) -->
            <button
              type="button"
              @click="openKpiOverlay('waste')"
              :class="[
                theme === 'dark' ? 'bg-zinc-900/70 border-zinc-800 hover:bg-zinc-900 hover:border-amber-500' : 'bg-white border-slate-200 hover:bg-amber-50/40 hover:border-amber-400',
                'group no-lift no-ancient text-left border rounded-lg p-3 sm:p-4 flex flex-col gap-1.5 transition-colors cursor-pointer'
              ]"
            >
              <span class="flex items-center gap-2 text-[11px] sm:text-xs font-semibold" :class="theme === 'dark' ? 'text-zinc-300' : 'text-slate-600'">
                <span class="w-6 h-6 rounded-md flex items-center justify-center shrink-0 bg-amber-500/15"><PackageCheck class="w-3.5 h-3.5 text-amber-500" /></span>
                <span class="leading-tight">{{ t('Barang Terbuang') }}</span>
              </span>
              <p class="font-bold tnum whitespace-nowrap leading-tight text-[clamp(1rem,4.5vw,1.5rem)]" :class="theme === 'dark' ? 'text-white' : 'text-slate-900'">{{ analytics.rolling_waste_qty || 0 }} <span class="text-xs font-normal" :class="theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'">{{ t('pcs') }}</span></p>
              <span class="mt-auto pt-1 inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-emerald-600 group-hover:gap-1.5 transition-all">{{ t('Lihat rincian') }} <ChevronRight class="w-3 h-3" /></span>
            </button>
          </div>

          <!-- ANALYTICS SUGGESTION CALLOUT -->
          <!-- No background wash / no outline. Emphasis via a colored icon chip + colored heading + left accent bar of whitespace. -->
          <div 
            v-if="analytics.health_suggestion"
            class="no-lift flex items-start gap-3 py-1"
          >
            <span
              class="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              :class="analytics.health_status === 'bad'
                ? 'bg-rose-500/15'
                : analytics.health_status === 'unhealthy'
                  ? 'bg-amber-500/15'
                  : 'bg-emerald-500/15'"
            >
              <AlertOctagon v-if="analytics.health_status === 'bad'" class="w-4.5 h-4.5 text-rose-500" />
              <AlertTriangle v-else-if="analytics.health_status === 'unhealthy'" class="w-4.5 h-4.5 text-amber-500" />
              <Sparkles v-else class="w-4.5 h-4.5 text-emerald-500" />
            </span>
            <div class="min-w-0 flex-1">
              <p
                class="text-sm font-bold leading-tight"
                :class="analytics.health_status === 'bad'
                  ? 'text-rose-600'
                  : analytics.health_status === 'unhealthy'
                    ? 'text-amber-600'
                    : 'text-emerald-600'"
              >
                {{ analytics.health_status === 'bad' ? t('High Risk') : analytics.health_status === 'unhealthy' ? t('Caution') : t('Optimal') }}
              </p>
              <p class="text-sm break-words mt-0.5 font-medium"
                :class="analytics.health_status === 'bad'
                  ? 'text-rose-600'
                  : analytics.health_status === 'unhealthy'
                    ? 'text-amber-600'
                    : 'text-emerald-600'"
              >{{ t('health.' + (analytics.health_status || 'healthy')) }}</p>
            </div>
          </div>

          <!-- Daily Audit Strip (Global Currency Formatted: e.g. Rp 702,000.00) -->
          <div 
            :class="[
              theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800/80' : 'bg-white border-slate-200 shadow-sm',
              'border rounded-md p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4'
            ]"
          >
            <div>
              <h3 class="text-sm font-bold" :class="theme === 'dark' ? 'text-white' : 'text-slate-900'">Daily Audit — {{ selectedDate }}</h3>
              <p class="text-xs" :class="theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'">{{ t('Audited inventory balance recognized revenue for day.') }}</p>
            </div>
            <div class="grid grid-cols-3 sm:flex sm:items-center gap-3 sm:gap-6 text-xs">
              <div>
                <span class="block text-[10px] uppercase font-medium" :class="theme === 'dark' ? 'text-zinc-500' : 'text-slate-400'">{{ t('Sold') }}</span>
                <span class="tnum font-bold text-sm break-all" :class="theme === 'dark' ? 'text-white' : 'text-slate-900'">{{ dailyView.total_items_sold }} pcs</span>
              </div>
              <div>
                <span class="block text-[10px] uppercase font-medium" :class="theme === 'dark' ? 'text-zinc-500' : 'text-slate-400'">{{ t('Leftover (Sisa)') }}</span>
                <span class="tnum font-bold text-rose-500 text-sm break-all">{{ dailyView.total_waste }} pcs</span>
              </div>
              <div>
                <span class="block text-[10px] uppercase font-medium" :class="theme === 'dark' ? 'text-zinc-500' : 'text-slate-400'">{{ t('Output Revenue') }}</span>
                <span class="tnum font-bold text-emerald-500 text-sm break-all">{{ formatCurrency(dailyView.daily_revenue) }}</span>
              </div>
            </div>
          </div>

          <!-- SECTION DATA MINING: SKU PERFORMANCE & IMPROVEMENT ADVICE (always open, no collapse) -->
          <div 
            :class="[
              theme === 'dark' ? 'bg-zinc-900/70 border-zinc-800' : 'bg-white border-slate-200 shadow-sm',
              'border rounded-md p-5 space-y-4'
            ]"
          >
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3" :class="theme === 'dark' ? 'border-zinc-800' : 'border-slate-100'">
              <div class="flex items-center gap-2">
                <Sparkles class="w-4 h-4 text-emerald-500" />
                <h3 class="text-xs font-bold uppercase tracking-wider" :class="theme === 'dark' ? 'text-white' : 'text-slate-900'">
                  {{ t('Barang Paling Laku & Paling Sepi') }}
                </h3>
              </div>
              <div class="flex items-center gap-3 flex-wrap">
                <span class="text-[11px] font-medium" :class="theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'">
                  {{ t('Lihat barang mana yang paling laris dan mana yang perlu didorong') }}
                </span>
                <button
                  v-if="hasGeneratedReport"
                  type="button"
                  @click="generateDataMiningReport"
                  :disabled="isGeneratingReport"
                  class="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 border border-emerald-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw class="w-3.5 h-3.5 shrink-0" :class="{ 'animate-spin': isGeneratingReport }" />
                  <span>{{ isGeneratingReport ? t('Menganalisa…') : t('Perbarui') }}</span>
                </button>
              </div>
            </div>

            <div>
            <!-- If NOT clicked yet: Show ONLY button "Generate Report" -->
            <div v-if="!hasGeneratedReport" class="py-8 text-center space-y-3">
              <button
                type="button"
                @click="generateDataMiningReport"
                :disabled="isGeneratingReport"
                class="bg-emerald-500 hover:bg-emerald-400 hover:border-emerald-400 active:scale-[0.98] text-zinc-950 font-bold px-6 py-2.5 rounded-md text-xs transition-all shadow-sm inline-flex items-center gap-2 cursor-pointer"
              >
                <Sparkles class="w-4 h-4" :class="{ 'animate-spin': isGeneratingReport }" />
                <span>{{ isGeneratingReport ? t('Membuat laporan…') : t('Lihat Analisa') }}</span>
              </button>
            </div>

            <!-- Best vs Worst Cards & Advice (Shown ONLY after clicking Generate Report) -->
            <template v-else>
              <!-- SKU Performance comparison — single flat data table -->
              <div class="overflow-x-auto no-lift border rounded-md" :class="theme === 'dark' ? 'border-zinc-800' : 'border-slate-200'">
                <table class="w-full text-xs">
                  <thead>
                    <tr :class="theme === 'dark' ? 'bg-zinc-950/60 text-zinc-400 border-b border-zinc-800' : 'bg-slate-50 text-slate-600 border-b border-slate-200'">
                      <th class="text-left font-semibold uppercase tracking-wide px-3 py-2">{{ t('SKU Name') }}</th>
                      <th class="text-left font-semibold uppercase tracking-wide px-3 py-2">{{ t('Group') }}</th>
                      <th class="text-left font-semibold uppercase tracking-wide px-3 py-2">{{ t('Tier') }}</th>
                      <th class="text-right font-semibold uppercase tracking-wide px-3 py-2">{{ t('Total Sold') }}</th>
                      <th class="text-right font-semibold uppercase tracking-wide px-3 py-2">{{ t('Waste') }}</th>
                      <th class="text-right font-semibold uppercase tracking-wide px-3 py-2">30D Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="analytics.data_mining?.best_sku" :class="theme === 'dark' ? 'border-b border-zinc-800' : 'border-b border-slate-200'">
                      <td class="px-3 py-2 font-semibold" :class="theme === 'dark' ? 'text-white' : 'text-slate-900'">{{ analytics.data_mining.best_sku.name }}</td>
                      <td class="px-3 py-2" :class="theme === 'dark' ? 'text-zinc-400' : 'text-slate-600'">{{ analytics.data_mining.best_sku.group_name || 'General' }}</td>
                      <td class="px-3 py-2"><span class="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600"><TrendingUp class="w-3 h-3" />{{ t('Top Earner') }}</span></td>
                      <td class="px-3 py-2 text-right tnum" :class="theme === 'dark' ? 'text-white' : 'text-slate-900'">{{ analytics.data_mining.best_sku.total_sold }}</td>
                      <td class="px-3 py-2 text-right tnum" :class="theme === 'dark' ? 'text-white' : 'text-slate-900'">{{ analytics.data_mining.best_sku.total_waste }}</td>
                      <td class="px-3 py-2 text-right tnum font-semibold" :class="theme === 'dark' ? 'text-white' : 'text-slate-900'">{{ formatCurrency(analytics.data_mining.best_sku.total_revenue) }}</td>
                    </tr>
                    <tr v-if="analytics.data_mining?.worst_sku">
                      <td class="px-3 py-2 font-semibold" :class="theme === 'dark' ? 'text-white' : 'text-slate-900'">{{ analytics.data_mining.worst_sku.name }}</td>
                      <td class="px-3 py-2" :class="theme === 'dark' ? 'text-zinc-400' : 'text-slate-600'">{{ analytics.data_mining.worst_sku.group_name || 'General' }}</td>
                      <td class="px-3 py-2"><span class="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600"><AlertTriangle class="w-3 h-3" />{{ t('Needs Improvement') }}</span></td>
                      <td class="px-3 py-2 text-right tnum" :class="theme === 'dark' ? 'text-white' : 'text-slate-900'">{{ analytics.data_mining.worst_sku.total_sold }}</td>
                      <td class="px-3 py-2 text-right tnum" :class="theme === 'dark' ? 'text-white' : 'text-slate-900'">{{ analytics.data_mining.worst_sku.total_waste }}</td>
                      <td class="px-3 py-2 text-right tnum font-semibold" :class="theme === 'dark' ? 'text-white' : 'text-slate-900'">{{ formatCurrency(analytics.data_mining.worst_sku.total_revenue) }}</td>
                    </tr>
                    <tr v-if="!analytics.data_mining?.best_sku && !analytics.data_mining?.worst_sku">
                      <td colspan="6" class="px-3 py-6 text-center" :class="theme === 'dark' ? 'text-zinc-500' : 'text-slate-500'">{{ t('No sales data recorded yet in the past 30 days.') }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Advice: friendly saran, no boxed background/outline. Icon chip + heading + plain readable text. -->
              <div 
                v-if="analytics.data_mining?.advice"
                class="flex items-start gap-3 pt-1"
              >
                <span class="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-amber-500/15">
                  <Lightbulb class="w-4.5 h-4.5 text-amber-500" />
                </span>
                <div class="min-w-0 flex-1 space-y-0.5">
                  <p class="text-sm font-bold text-amber-600">
                    {{ t('Saran Buat Kamu') }}
                  </p>
                  <p class="text-sm leading-relaxed" :class="theme === 'dark' ? 'text-zinc-300' : 'text-slate-600'">
                    {{ analytics.data_mining.advice }}
                  </p>
                </div>
              </div>
            </template>
            </div>
          </div>
          </div>
          <!-- ============ END DASHBOARD FINANCE ============ -->

          <!-- ============ DASHBOARD PESANAN ============ -->
          <div v-show="dashboardView === 'pesanan'" class="space-y-5">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 class="text-lg font-bold tracking-tight" :class="theme === 'dark' ? 'text-white' : 'text-slate-900'">
                  {{ t('PESANAN HARI INI') }}
                </h2>
                <p class="text-xs" :class="theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'">
                  {{ t('Orders recorded for the selected date. Future-dated orders are highlighted in the picker.') }}
                </p>
              </div>
              <div class="flex items-center gap-2 self-start sm:self-auto relative">
                <span class="text-xs" :class="theme === 'dark' ? 'text-zinc-400' : 'text-slate-600'">{{ t('Tanggal:') }}</span>
                <SmartDate
                  v-model="pesananDate"
                  :theme="theme"
                  :colorize="true"
                  :order-dates="orderDates"
                  @change="loadPesananDashboard"
                />
              </div>
            </div>

            <!-- Total Pesanan Yang Akan Datang (clickable -> overlay) -->
            <button
              type="button"
              @click="openUpcomingOverlay"
              :class="[
                theme === 'dark' ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-500/70' : 'bg-amber-50 border-amber-300 hover:border-amber-400',
                'w-full border rounded-md p-4 flex items-center justify-between gap-3 transition-all cursor-pointer text-left'
              ]"
            >
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-10 h-10 rounded-md flex items-center justify-center shrink-0 bg-amber-500/20 text-amber-500">
                  <Calendar class="w-5 h-5" />
                </div>
                <div class="min-w-0">
                  <span class="text-[11px] font-semibold uppercase tracking-wider block" :class="theme === 'dark' ? 'text-amber-300/80' : 'text-amber-700'">{{ t(upcomingLabelKey) }}</span>
                  <p class="text-lg sm:text-xl font-bold text-amber-500 tnum leading-tight">{{ upcomingTotalQty }} <span class="text-xs font-normal opacity-70">{{ t('pcs') }}</span> <span class="text-xs font-normal opacity-70">/ {{ upcomingDates.length }} tanggal</span></p>
                </div>
              </div>
              <ChevronRight class="w-5 h-5 text-amber-500 shrink-0" />
            </button>

            <!-- Pesanan KPI cards -->
            <div class="grid grid-cols-2 gap-3.5">
              <div 
                :class="[
                  theme === 'dark' ? 'bg-zinc-900/70 border-zinc-800/80 hover:border-emerald-500/50' : 'bg-white border-slate-200 shadow-sm hover:border-emerald-500/50',
                  ' border rounded-md p-4 space-y-1.5 transition-all'
                ]"
              >
                <div class="flex items-center justify-between" :class="theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'">
                  <span class="text-[11px] font-semibold uppercase tracking-wider">{{ t('Total Jumlah Pesanan') }}</span>
                  <ShoppingCart class="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <p class="text-xl font-bold text-emerald-500 tnum">{{ pesananTotalQty }} <span class="text-xs font-normal" :class="theme === 'dark' ? 'text-zinc-400' : 'text-slate-400'">{{ t('pcs') }}</span></p>
                <p class="text-[10px]" :class="theme === 'dark' ? 'text-zinc-500' : 'text-slate-400'">Total item dipesan pada {{ pesananDate }}</p>
              </div>
              <div 
                :class="[
                  theme === 'dark' ? 'bg-zinc-900/70 border-zinc-800/80 hover:border-emerald-500/50' : 'bg-white border-slate-200 shadow-sm hover:border-emerald-500/50',
                  ' border rounded-md p-4 space-y-1.5 transition-all'
                ]"
              >
                <div class="flex items-center justify-between" :class="theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'">
                  <span class="text-[11px] font-semibold uppercase tracking-wider">{{ t('Total Pembeli') }}</span>
                  <User class="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <p class="text-xl font-bold text-emerald-500 tnum">{{ pesananBuyers.length }} <span class="text-xs font-normal" :class="theme === 'dark' ? 'text-zinc-400' : 'text-slate-400'">{{ t('orang') }}</span></p>
                <p class="text-[10px]" :class="theme === 'dark' ? 'text-zinc-500' : 'text-slate-400'">Jumlah pembeli unik pada {{ pesananDate }}</p>
              </div>
            </div>

            <!-- List Pembeli with dropdown selector -->
            <div 
              :class="[
                theme === 'dark' ? 'bg-zinc-900/70 border-zinc-800' : 'bg-white border-slate-200 shadow-sm',
                'border rounded-md p-5 space-y-4'
              ]"
            >
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3" :class="theme === 'dark' ? 'border-zinc-800' : 'border-slate-100'">
                <div class="flex items-center gap-2">
                  <User class="w-4 h-4 text-emerald-500" />
                  <h3 class="text-xs font-bold uppercase tracking-wider" :class="theme === 'dark' ? 'text-white' : 'text-slate-900'">
                    {{ t('Daftar Pembeli') }}
                  </h3>
                </div>
                <div class="relative" v-if="pesananBuyers.length > 0">
                  <SmartSelect
                    v-model="selectedPesananBuyer"
                    :theme="theme"
                    :placeholder="t('Semua Pembeli')"
                    width-class="w-48"
                    :options="[{ value: '', label: 'Semua Pembeli' }, ...pesananBuyers.map(b => ({ value: b.name, label: b.name }))]"
                  />
                </div>
              </div>

              <div>
              <!-- Empty state: highlighted prompt + record-now button -->
              <div v-if="pesananBuyers.length === 0" class="py-8 text-center space-y-3">
                <p
                  class="text-sm font-semibold px-4 py-3 rounded-md inline-block"
                  :class="theme === 'dark' ? 'bg-amber-950/40 text-amber-300 border border-amber-500/40' : 'bg-amber-50 text-amber-800 border border-amber-300'"
                >
                  {{ t('Belum ada pembeli, mungkin kamu lupa catat?') }}
                </p>
                <div>
                  <button
                    type="button"
                    @click="openOrderEntry"
                    class="no-ancient inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2.5 rounded-md text-sm transition-colors cursor-pointer"
                  >
                    <Plus class="w-4 h-4" />
                    <span>{{ t('Catat Sekarang!') }}</span>
                  </button>
                </div>
              </div>

              <div v-else class="space-y-2.5">
                <div 
                  v-for="b in displayedPesananBuyers" 
                  :key="b.name"
                  :class="[
                    theme === 'dark' ? 'bg-zinc-950/60 border-zinc-800' : 'bg-slate-50 border-slate-200',
                    'border rounded-md p-3.5 space-y-1.5'
                  ]"
                >
                  <div class="flex items-center justify-between">
                    <span class="font-bold text-sm" :class="theme === 'dark' ? 'text-white' : 'text-slate-900'">{{ b.name }}</span>
                    <span class="text-[10px] tnum px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500">{{ b.totalQty }} pcs</span>
                  </div>
                  <p class="text-xs leading-relaxed" :class="theme === 'dark' ? 'text-zinc-300' : 'text-slate-600'">
                    <span v-for="(it, i) in b.items" :key="i">
                      {{ it.name }} <span class="tnum text-emerald-500">[{{ it.qty }}]</span><span v-if="i < b.items.length - 1">, </span>
                    </span>
                  </p>
                </div>
              </div>
              </div>
            </div>
          </div>
          <!-- ============ END DASHBOARD PESANAN ============ -->

          <!-- ============ UPCOMING ORDERS OVERLAY ============ -->
          <Teleport to="body">
          <div
            v-if="showUpcomingOverlay"
            @click.self="showUpcomingOverlay = false"
            class="fixed inset-0 z-[70] flex items-start justify-center p-4 sm:p-8 bg-black/75 backdrop-blur-md overflow-y-auto"
          >
            <div
              :class="[
                theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200',
                'w-full max-w-2xl border rounded-md shadow-sm my-auto'
              ]"
            >
              <div class="flex items-center justify-between px-5 py-4 border-b" :class="theme === 'dark' ? 'border-zinc-800' : 'border-slate-100'">
                <div class="flex items-center gap-2.5">
                  <div class="w-9 h-9 rounded-md flex items-center justify-center bg-amber-500/15 text-amber-500">
                    <Calendar class="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 class="text-sm font-bold" :class="theme === 'dark' ? 'text-white' : 'text-slate-900'">{{ t(upcomingHasToday ? 'Pesanan Hari Ini' : 'Pesanan Yang Akan Datang') }}</h3>
                    <p class="text-[11px]" :class="theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'">{{ upcomingTotalQty }} pcs across {{ upcomingDates.length }} tanggal</p>
                  </div>
                </div>
                <button type="button" @click="showUpcomingOverlay = false" title="Close" class="modal-x">
                  <X class="w-4 h-4" />
                </button>
              </div>

              <div class="p-4 space-y-2.5 max-h-[70vh] overflow-y-auto">
                <div v-if="upcomingByDate.length === 0" class="py-10 text-center text-zinc-500 text-xs">
                  {{ t('Tidak ada pesanan yang akan datang.') }}
                </div>
                <div
                  v-for="d in upcomingByDate"
                  :key="d.date"
                  :class="[theme === 'dark' ? 'bg-zinc-950/60 border-zinc-800' : 'bg-slate-50 border-slate-200', 'border rounded-md overflow-hidden']"
                >
                  <button
                    type="button"
                    @click="toggleUpcomingDate(d.date)"
                    class="w-full flex items-center justify-between px-4 py-3 text-left transition-colors"
                    :class="theme === 'dark' ? 'hover:bg-zinc-900' : 'hover:bg-slate-100'"
                  >
                    <div class="flex items-center gap-2.5">
                      <ChevronDown class="w-4 h-4 text-amber-500 transition-transform" :class="expandedUpcoming[d.date] ? 'rotate-0' : '-rotate-90'" />
                      <span class="w-2 h-2 rounded-full bg-orange-500"></span>
                      <span class="text-xs font-bold tnum" :class="theme === 'dark' ? 'text-white' : 'text-slate-900'">{{ d.date }}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="text-[10px] tnum px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500">{{ d.totalQty }} pcs</span>
                      <span class="text-[10px] tnum px-2 py-0.5 rounded-full" :class="theme === 'dark' ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-200 text-slate-600'">{{ d.buyers.length }} pembeli</span>
                    </div>
                  </button>
                  <div v-if="expandedUpcoming[d.date]" class="px-4 pb-3 space-y-2 border-t" :class="theme === 'dark' ? 'border-zinc-800' : 'border-slate-200'">
                    <div v-for="b in d.buyers" :key="b.name" class="pt-2.5">
                      <div class="flex items-center justify-between">
                        <span class="text-xs font-bold" :class="theme === 'dark' ? 'text-white' : 'text-slate-900'">{{ b.name }}</span>
                        <span class="text-[10px] tnum text-emerald-500">{{ b.totalQty }} pcs</span>
                      </div>
                      <p class="text-xs leading-relaxed" :class="theme === 'dark' ? 'text-zinc-300' : 'text-slate-600'">
                        <span v-for="(it, i) in b.items" :key="i">
                          {{ it.name }} <span class="tnum text-emerald-500">[{{ it.qty }}]</span><span v-if="i < b.items.length - 1">, </span>
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </Teleport>
          <!-- ============ END UPCOMING ORDERS OVERLAY ============ -->

          <!-- ============ KPI DETAIL OVERLAY (Omset / Pengeluaran / Untung Bersih / Barang Terbuang) ============ -->
          <Teleport to="body">
          <div
            v-if="kpiOverlay"
            @click.self="kpiOverlay = null"
            class="fixed inset-0 z-[70] flex items-start justify-center p-4 sm:p-8 bg-black/75 backdrop-blur-md overflow-y-auto"
          >
            <div
              :class="[
                theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200',
                'w-full max-w-3xl border rounded-md shadow-sm my-auto'
              ]"
            >
              <!-- Header -->
              <div class="flex items-center justify-between px-5 py-4 border-b" :class="theme === 'dark' ? 'border-zinc-800' : 'border-slate-100'">
                <div class="flex items-center gap-2.5 min-w-0">
                  <div class="w-9 h-9 rounded-md flex items-center justify-center shrink-0" :class="kpiMeta.badge">
                    <component :is="kpiMeta.icon" class="w-4.5 h-4.5" />
                  </div>
                  <div class="min-w-0">
                    <h3 class="text-sm font-bold truncate" :class="theme === 'dark' ? 'text-white' : 'text-slate-900'">{{ t(kpiMeta.title) }}</h3>
                    <p class="text-[11px]" :class="theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'">{{ t('Periode bulan berjalan (cut off tanggal 1)') }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    v-if="kpiOverlay !== 'profit'"
                    type="button"
                    @click="exportKpiCsv"
                    class="no-ancient inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
                  >
                    <Upload class="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                  <button type="button" @click="kpiOverlay = null" title="Close" class="modal-x">
                    <X class="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div class="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
                <div v-if="kpiLoading" class="py-10 text-center text-zinc-500 text-xs">{{ t('Memuat data…') }}</div>

                <!-- PROFIT: formula breakdown -->
                <template v-else-if="kpiOverlay === 'profit'">
                  <div class="space-y-2.5 text-sm">
                    <div class="flex items-center justify-between px-3 py-2.5 rounded-md" :class="theme === 'dark' ? 'bg-emerald-950/30' : 'bg-emerald-50'">
                      <span class="font-medium" :class="theme === 'dark' ? 'text-emerald-300' : 'text-emerald-700'">{{ t('Omset (Total Pendapatan)') }}</span>
                      <span class="tnum font-bold" :class="theme === 'dark' ? 'text-emerald-300' : 'text-emerald-700'">{{ formatCurrency(analytics.rolling_revenue) }}</span>
                    </div>
                    <div class="flex items-center justify-between px-3 py-2.5 rounded-md" :class="theme === 'dark' ? 'bg-rose-950/30' : 'bg-rose-50'">
                      <span class="font-medium" :class="theme === 'dark' ? 'text-rose-300' : 'text-rose-700'">{{ t('(–) Pengeluaran (OpEx)') }}</span>
                      <span class="tnum font-bold" :class="theme === 'dark' ? 'text-rose-300' : 'text-rose-700'">{{ formatCurrency(analytics.rolling_opex) }}</span>
                    </div>
                    <div class="border-t pt-2.5" :class="theme === 'dark' ? 'border-zinc-800' : 'border-slate-200'">
                      <div class="flex items-center justify-between px-3 py-2.5 rounded-md" :class="theme === 'dark' ? 'bg-sky-950/30' : 'bg-sky-50'">
                        <span class="font-bold" :class="theme === 'dark' ? 'text-sky-300' : 'text-sky-700'">{{ t('(=) Untung Bersih') }}</span>
                        <span class="tnum font-bold text-base" :class="analytics.gross_profit < 0 ? 'text-rose-500' : (theme === 'dark' ? 'text-sky-300' : 'text-sky-700')">{{ formatCurrency(analytics.gross_profit) }}</span>
                      </div>
                    </div>
                    <p class="text-[11px] tnum text-center pt-1" :class="theme === 'dark' ? 'text-zinc-500' : 'text-slate-400'">
                      {{ formatCurrency(analytics.rolling_revenue) }} − {{ formatCurrency(analytics.rolling_opex) }} = {{ formatCurrency(analytics.gross_profit) }}
                    </p>
                  </div>
                </template>

                <!-- REVENUE breakdown table -->
                <template v-else-if="kpiOverlay === 'revenue'">
                  <div v-if="kpiRows.length === 0" class="py-10 text-center text-zinc-500 text-xs">{{ t('Belum ada data bulan ini.') }}</div>
                  <div v-else class="overflow-x-auto">
                    <table class="w-full text-xs">
                      <thead>
                        <tr :class="theme === 'dark' ? 'bg-zinc-950/60 text-zinc-400 border-b border-zinc-800' : 'bg-slate-50 text-slate-600 border-b border-slate-200'">
                          <th class="text-left font-semibold uppercase tracking-wide px-3 py-2">{{ t('Tanggal') }}</th>
                          <th class="text-left font-semibold uppercase tracking-wide px-3 py-2">{{ t('Pembeli') }}</th>
                          <th class="text-left font-semibold uppercase tracking-wide px-3 py-2">{{ t('Barang') }}</th>
                          <th class="text-right font-semibold uppercase tracking-wide px-3 py-2">{{ t('Jumlah') }}</th>
                          <th class="text-right font-semibold uppercase tracking-wide px-3 py-2">{{ t('Harga Satuan') }}</th>
                          <th class="text-right font-semibold uppercase tracking-wide px-3 py-2">{{ t('Total') }}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(r, i) in kpiRows" :key="i" :class="theme === 'dark' ? 'border-b border-zinc-800/60' : 'border-b border-slate-200'">
                          <td class="px-3 py-1.5 tnum" :class="theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'">{{ r.entry_date }}</td>
                          <td class="px-3 py-1.5" :class="theme === 'dark' ? 'text-zinc-200' : 'text-slate-800'">{{ r.buyer_name || 'Walk-in' }}</td>
                          <td class="px-3 py-1.5" :class="theme === 'dark' ? 'text-zinc-200' : 'text-slate-800'">{{ r.item_name }}</td>
                          <td class="px-3 py-1.5 text-right tnum">{{ r.sold_quantity }}</td>
                          <td class="px-3 py-1.5 text-right tnum">{{ formatCurrency(r.snapshotted_unit_price) }}</td>
                          <td class="px-3 py-1.5 text-right tnum font-semibold" :class="theme === 'dark' ? 'text-white' : 'text-slate-900'">{{ formatCurrency(r.line_total) }}</td>
                        </tr>
                      </tbody>
                      <tfoot>
                        <tr :class="theme === 'dark' ? 'bg-zinc-950/60 border-t border-zinc-800' : 'bg-slate-50 border-t border-slate-200'">
                          <td colspan="5" class="px-3 py-2 text-right font-bold uppercase text-[11px]" :class="theme === 'dark' ? 'text-zinc-300' : 'text-slate-700'">{{ t('Total Omset') }}</td>
                          <td class="px-3 py-2 text-right tnum font-bold text-emerald-500">{{ formatCurrency(kpiRows.reduce((a, r) => a + Number(r.line_total), 0)) }}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </template>

                <!-- OPEX breakdown table -->
                <template v-else-if="kpiOverlay === 'opex'">
                  <div v-if="kpiRows.length === 0" class="py-10 text-center text-zinc-500 text-xs">{{ t('Belum ada data bulan ini.') }}</div>
                  <div v-else class="overflow-x-auto">
                    <table class="w-full text-xs">
                      <thead>
                        <tr :class="theme === 'dark' ? 'bg-zinc-950/60 text-zinc-400 border-b border-zinc-800' : 'bg-slate-50 text-slate-600 border-b border-slate-200'">
                          <th class="text-left font-semibold uppercase tracking-wide px-3 py-2">{{ t('Tanggal') }}</th>
                          <th class="text-left font-semibold uppercase tracking-wide px-3 py-2">{{ t('Barang') }}</th>
                          <th class="text-right font-semibold uppercase tracking-wide px-3 py-2">{{ t('Jumlah') }}</th>
                          <th class="text-right font-semibold uppercase tracking-wide px-3 py-2">{{ t('Harga Satuan') }}</th>
                          <th class="text-right font-semibold uppercase tracking-wide px-3 py-2">{{ t('Harga Dibayar') }}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(r, i) in kpiRows" :key="i" :class="theme === 'dark' ? 'border-b border-zinc-800/60' : 'border-b border-slate-200'">
                          <td class="px-3 py-1.5 tnum" :class="theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'">{{ r.expense_date }}</td>
                          <td class="px-3 py-1.5" :class="theme === 'dark' ? 'text-zinc-200' : 'text-slate-800'">{{ r.item_name }}</td>
                          <td class="px-3 py-1.5 text-right tnum">{{ r.quantity }} <span class="text-[10px] opacity-60">{{ r.measurement }}</span></td>
                          <td class="px-3 py-1.5 text-right tnum">{{ formatCurrency(r.unit_cost) }}</td>
                          <td class="px-3 py-1.5 text-right tnum font-semibold" :class="theme === 'dark' ? 'text-white' : 'text-slate-900'">{{ formatCurrency(r.price_paid) }}</td>
                        </tr>
                      </tbody>
                      <tfoot>
                        <tr :class="theme === 'dark' ? 'bg-zinc-950/60 border-t border-zinc-800' : 'bg-slate-50 border-t border-slate-200'">
                          <td colspan="4" class="px-3 py-2 text-right font-bold uppercase text-[11px]" :class="theme === 'dark' ? 'text-zinc-300' : 'text-slate-700'">{{ t('Total Pengeluaran') }}</td>
                          <td class="px-3 py-2 text-right tnum font-bold text-rose-500">{{ formatCurrency(kpiRows.reduce((a, r) => a + Number(r.price_paid), 0)) }}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </template>

                <!-- WASTE breakdown table -->
                <template v-else-if="kpiOverlay === 'waste'">
                  <div v-if="kpiRows.length === 0" class="py-10 text-center text-zinc-500 text-xs">{{ t('Belum ada barang terbuang bulan ini.') }}</div>
                  <div v-else class="overflow-x-auto">
                    <table class="w-full text-xs">
                      <thead>
                        <tr :class="theme === 'dark' ? 'bg-zinc-950/60 text-zinc-400 border-b border-zinc-800' : 'bg-slate-50 text-slate-600 border-b border-slate-200'">
                          <th class="text-left font-semibold uppercase tracking-wide px-3 py-2">{{ t('Tanggal') }}</th>
                          <th class="text-left font-semibold uppercase tracking-wide px-3 py-2">{{ t('Barang') }}</th>
                          <th class="text-left font-semibold uppercase tracking-wide px-3 py-2">{{ t('Pembeli') }}</th>
                          <th class="text-right font-semibold uppercase tracking-wide px-3 py-2">{{ t('Jumlah Terbuang') }}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(r, i) in kpiRows" :key="i" :class="theme === 'dark' ? 'border-b border-zinc-800/60' : 'border-b border-slate-200'">
                          <td class="px-3 py-1.5 tnum" :class="theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'">{{ r.entry_date }}</td>
                          <td class="px-3 py-1.5" :class="theme === 'dark' ? 'text-zinc-200' : 'text-slate-800'">{{ r.item_name }}</td>
                          <td class="px-3 py-1.5" :class="theme === 'dark' ? 'text-zinc-200' : 'text-slate-800'">{{ r.buyer_name || 'Walk-in' }}</td>
                          <td class="px-3 py-1.5 text-right tnum font-semibold text-amber-500">{{ r.waste_quantity }} pcs</td>
                        </tr>
                      </tbody>
                      <tfoot>
                        <tr :class="theme === 'dark' ? 'bg-zinc-950/60 border-t border-zinc-800' : 'bg-slate-50 border-t border-slate-200'">
                          <td colspan="3" class="px-3 py-2 text-right font-bold uppercase text-[11px]" :class="theme === 'dark' ? 'text-zinc-300' : 'text-slate-700'">{{ t('Total Terbuang') }}</td>
                          <td class="px-3 py-2 text-right tnum font-bold text-amber-500">{{ kpiRows.reduce((a, r) => a + Number(r.waste_quantity), 0) }} pcs</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </template>
              </div>
            </div>
          </div>
          </Teleport>
        </section>

        <!-- TAB 2: DAILY OPERATIONS & COLLAPSIBLE SKU LEDGER WITH BUYER BREAKDOWN -->
        <section v-if="currentTab === 'daily'" class="space-y-5 tab-view">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 class="text-lg font-bold tracking-tight" :class="theme === 'dark' ? 'text-white' : 'text-slate-900'">
                {{ t('Daily Operations & Stock Tracking') }}
              </h2>
              <p class="text-xs" :class="theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'">
                {{ t('Record stock counts per buyer, then audit item-level flow and leftovers.') }}
              </p>
            </div>
            <div class="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              <label class="text-xs" :class="theme === 'dark' ? 'text-zinc-400' : 'text-slate-600'">{{ t('Date:') }}</label>
              <SmartDate v-model="dailyFilterDate" :theme="theme" @change="loadDailyEntries" />
              <button
                @click="refreshCurrentTab"
                :title="t('Muat ulang data')"
                :class="[
                  'shrink-0 px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 border cursor-pointer',
                  theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-emerald-400 hover:border-emerald-500/40' : 'bg-white border-slate-200 text-slate-600 hover:text-emerald-600 hover:border-emerald-400'
                ]"
              >
                <RefreshCw class="w-3.5 h-3.5 shrink-0" />
                <span>{{ t('Segarkan') }}</span>
              </button>
            </div>
          </div>

          <!-- STAGE 1: Simple entry — button opens the order form overlay -->
          <div>
            <button
              type="button"
              @click="openOrderEntry"
              class="no-ancient inline-flex w-full sm:w-auto items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2.5 rounded-md text-sm transition-colors cursor-pointer"
            >
              <Plus class="w-4 h-4" />
              <span>{{ t('Masukan Pesanan Hari Ini') }}</span>
            </button>
          </div>


          <!-- STAGE 2: COLLAPSED-BY-DEFAULT SKU LEDGER WITH VIVID BUYER BADGE HIGHLIGHT -->
          <div 
            :class="[
              theme === 'dark' ? 'bg-zinc-900/70 border-zinc-800/80' : 'bg-white border-slate-200 shadow-sm',
              'border rounded-md overflow-hidden'
            ]"
          >
            <!-- Ledger Header Bar -->
            <div class="p-4 border-b flex items-center justify-between" :class="theme === 'dark' ? 'border-zinc-800' : 'border-slate-200'">
              <div class="flex items-center gap-2">
                <span class="w-5 h-5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[11px] font-bold flex items-center justify-center">2</span>
                <h3 class="text-xs font-semibold uppercase tracking-wider" :class="theme === 'dark' ? 'text-white' : 'text-slate-900'">
                  {{ t('Item Ledger & Buyer Audit') }}
                </h3>
              </div>
              <div class="flex items-center gap-3">
                <span class="text-xs tnum text-zinc-400">{{ groupedDailyEntries.length }} SKU(s)</span>
                <button 
                  @click="toggleAllSkus"
                  :class="[
                    theme === 'dark' 
                      ? 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white hover:border-emerald-500/50' 
                      : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200 hover:border-emerald-500/50',
                    'text-[11px] font-medium px-2.5 py-1 rounded-md border transition-all active:scale-95 cursor-pointer'
                  ]"
                >
                  {{ areAllExpanded ? 'Collapse All' : 'Expand All' }}
                </button>
              </div>
            </div>

            <div>
            <!-- Empty State -->
            <div v-if="groupedDailyEntries.length === 0" class="py-12 text-center space-y-2">
              <Boxes class="w-7 h-7 text-zinc-500 mx-auto" />
              <p class="text-xs" :class="theme === 'dark' ? 'text-zinc-400' : 'text-slate-600'">No stock operations recorded for {{ dailyFilterDate }}.</p>
              <p class="text-[11px] text-zinc-500">{{ t('Record a shift entry above in Step 1.') }}</p>
            </div>

            <!-- Distinct SKU Parent vs. Buyer Child Rows — standard ERP data table -->
            <div v-else class="overflow-x-auto">
              <table class="w-full text-xs">
                <thead>
                  <tr :class="theme === 'dark' ? 'bg-zinc-950/60 text-zinc-400 border-b border-zinc-800' : 'bg-slate-50 text-slate-600 border-b border-slate-200'">
                    <th class="text-left font-semibold uppercase tracking-wide px-3 py-2">{{ t('SKU') }}</th>
                    <th class="text-right font-semibold uppercase tracking-wide px-3 py-2">{{ t('Unit Price') }}</th>
                    <th class="text-right font-semibold uppercase tracking-wide px-3 py-2">{{ t('In') }}</th>
                    <th class="text-right font-semibold uppercase tracking-wide px-3 py-2">{{ t('Leftover') }}</th>
                    <th class="text-right font-semibold uppercase tracking-wide px-3 py-2">{{ t('Sold') }}</th>
                    <th class="text-right font-semibold uppercase tracking-wide px-3 py-2">{{ t('Total Revenue') }}</th>
                    <th class="text-right font-semibold uppercase tracking-wide px-3 py-2">{{ t('Buyers') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <template v-for="sku in groupedDailyEntries" :key="sku.itemId">
                    <!-- PARENT SKU SUMMARY ROW -->
                    <tr 
                      @click="toggleSku(sku.itemId)"
                      :class="[
                        theme === 'dark' ? 'hover:bg-zinc-800/50 border-b border-zinc-800' : 'hover:bg-slate-50 border-b border-slate-200',
                        'cursor-pointer select-none'
                      ]"
                    >
                      <td class="px-3 py-2">
                        <div class="flex items-center gap-2">
                          <component :is="expandedSkus[sku.itemId] ? ChevronDown : ChevronRight" class="w-4 h-4 shrink-0" :class="theme === 'dark' ? 'text-zinc-500' : 'text-slate-400'" />
                          <span class="tnum text-[10px]" :class="theme === 'dark' ? 'text-zinc-500' : 'text-slate-400'">#{{ sku.itemId }}</span>
                          <span class="font-semibold" :class="theme === 'dark' ? 'text-white' : 'text-slate-900'">{{ sku.itemName }}</span>
                          <span v-if="sku.groupName" class="px-1.5 py-0.5 rounded text-[10px] font-medium" :class="theme === 'dark' ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-slate-600'">{{ sku.groupName }}</span>
                        </div>
                      </td>
                      <td class="px-3 py-2 text-right tnum" :class="theme === 'dark' ? 'text-zinc-300' : 'text-slate-700'">{{ formatCurrency(sku.snapshottedUnitPrice) }}</td>
                      <td class="px-3 py-2 text-right tnum" :class="theme === 'dark' ? 'text-white' : 'text-slate-900'">{{ sku.totalAvailable }}</td>
                      <td class="px-3 py-2 text-right tnum" :class="theme === 'dark' ? 'text-white' : 'text-slate-900'">{{ sku.totalWaste }}</td>
                      <td class="px-3 py-2 text-right tnum font-semibold" :class="theme === 'dark' ? 'text-white' : 'text-slate-900'">{{ sku.totalSold }}</td>
                      <td class="px-3 py-2 text-right tnum font-semibold" :class="theme === 'dark' ? 'text-white' : 'text-slate-900'">{{ formatCurrency(sku.totalRevenue) }}</td>
                      <td class="px-3 py-2 text-right tnum" :class="theme === 'dark' ? 'text-zinc-400' : 'text-slate-600'">{{ sku.entries.length }}</td>
                    </tr>

                    <!-- CHILD BUYER SUB-TRANSACTION ROWS -->
                    <tr 
                      v-for="entry in (expandedSkus[sku.itemId] ? sku.entries : [])" 
                      :key="entry.id"
                      :class="theme === 'dark' ? 'bg-zinc-950/50 border-b border-zinc-800/60' : 'bg-slate-50/60 border-b border-slate-200'"
                    >
                      <td class="px-3 py-1.5 pl-9">
                        <span :class="theme === 'dark' ? 'text-zinc-300' : 'text-slate-700'">{{ entry.buyer_name || 'Walk-in Customer' }}</span>
                      </td>
                      <td></td>
                      <td class="px-3 py-1.5 text-right tnum" :class="theme === 'dark' ? 'text-zinc-400' : 'text-slate-600'">{{ Number(entry.starting_stock) + Number(entry.restock_quantity) }}</td>
                      <td class="px-3 py-1.5 text-right tnum" :class="theme === 'dark' ? 'text-zinc-400' : 'text-slate-600'">{{ entry.waste_quantity }}</td>
                      <td class="px-3 py-1.5 text-right tnum" :class="theme === 'dark' ? 'text-zinc-300' : 'text-slate-700'">{{ entry.sold_quantity }}</td>
                      <td class="px-3 py-1.5 text-right tnum" :class="theme === 'dark' ? 'text-zinc-300' : 'text-slate-700'">{{ formatCurrency(entry.total_revenue) }}</td>
                      <td class="px-3 py-1.5">
                        <div class="flex items-center justify-end gap-1.5">
                          <button 
                            @click.stop="openEditDailyModal(entry)" 
                            :title="t('Edit Transaction')"
                            :class="[
                              theme === 'dark' 
                                ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white' 
                                : 'bg-white border-slate-300 text-slate-700 hover:text-slate-900',
                              'p-1 rounded border transition-all active:scale-95 cursor-pointer'
                            ]"
                          >
                            <Pencil class="w-3 h-3" />
                          </button>
                          <button 
                            @click.stop="promptDeleteDailyEntry(entry)" 
                            :title="t('Delete Transaction')"
                            :class="[
                              theme === 'dark' 
                                ? 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-rose-400' 
                                : 'bg-white border-slate-300 text-slate-600 hover:text-rose-600',
                              'p-1 rounded border transition-all active:scale-95 cursor-pointer'
                            ]"
                          >
                            <Trash2 class="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>
            </div>
          </div>
        </section>

        <!-- TAB 3: MASTER SALES CATALOG WITH DETAILED CREATE FORM -->
        <section v-if="currentTab === 'items'" class="space-y-5 tab-view">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 class="text-lg font-bold tracking-tight" :class="theme === 'dark' ? 'text-white' : 'text-slate-900'">
                {{ t('Master Sales Items') }}
              </h2>
              <p class="text-xs" :class="theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'">
                {{ t('Configure catalog products, selling prices, and SKU group types.') }}
              </p>
            </div>
            <div class="flex items-center gap-2 self-start sm:self-auto">
            <button 
              @click="showAddItemModal = !showAddItemModal"
              class="bg-emerald-500 hover:bg-emerald-400 hover:border-emerald-400 active:scale-[0.98] text-zinc-950 font-semibold px-3.5 py-1.5 rounded-md text-xs transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus class="w-3.5 h-3.5" />
              <span>{{ showAddItemModal ? 'Hide Form' : 'Create Item' }}</span>
            </button>
            <button
              @click="refreshCurrentTab"
              :title="t('Muat ulang data')"
              :class="[
                'px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 border cursor-pointer',
                theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-emerald-400 hover:border-emerald-500/40' : 'bg-white border-slate-200 text-slate-600 hover:text-emerald-600 hover:border-emerald-400'
              ]"
            >
              <RefreshCw class="w-3.5 h-3.5" />
              <span>{{ t('Segarkan') }}</span>
            </button>
            </div>
          </div>

          <!-- Filter Bar — tight inline, no bulky card -->
          <div class="flex flex-wrap items-center gap-2.5 text-xs">
            <span class="font-semibold flex items-center gap-1.5" :class="theme === 'dark' ? 'text-zinc-400' : 'text-slate-600'">
              <Filter class="w-3.5 h-3.5" />
              <span>{{ t('Filter') }}</span>
            </span>
            <SmartSelect
              v-model="itemFilterGroup"
              :theme="theme"
              :placeholder="t('All Groups')"
              width-class="w-40"
              :options="[{ value: '', label: 'All Groups' }, ...existingGroups.map(g => ({ value: g, label: g }))]"
            />
            <input 
              v-model="itemFilterPrice"
              type="number"
              :placeholder="t('Max Price (Rp)')"
              min="0"
              @keydown.up.prevent
              @keydown.down.prevent
              :class="[
                theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-200' : 'bg-white border-slate-300 text-slate-900',
                'border rounded-md px-3 py-1.5 text-xs outline-none tnum w-36 transition-all hover:border-emerald-500/60'
              ]"
            />
            <button 
              v-if="itemFilterGroup || itemFilterPrice"
              @click="itemFilterGroup = ''; itemFilterPrice = null"
              class="text-[11px] transition-colors flex items-center gap-1 cursor-pointer" :class="theme === 'dark' ? 'text-zinc-400 hover:text-rose-400' : 'text-slate-500 hover:text-rose-600'"
            >
              <X class="w-3 h-3" />
              <span>{{ t('Clear') }}</span>
            </button>
            <span v-if="filteredItems.length !== items.length" class="text-[10px] ml-auto" :class="theme === 'dark' ? 'text-zinc-500' : 'text-slate-500'">
              Showing {{ filteredItems.length }} of {{ items.length }}
            </span>
          </div>

          <!-- Add Item Form (Detailed with Name Product, Group, Selling Price & Inline Red Errors) -->
          <div 
            v-if="showAddItemModal" 
            :class="[
              theme === 'dark' ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white border-slate-200 shadow-sm',
              'border rounded-md p-5 space-y-4'
            ]"
          >
            <div class="border-b pb-2" :class="theme === 'dark' ? 'border-zinc-800' : 'border-slate-200'">
              <h3 class="text-xs font-semibold uppercase tracking-wider" :class="theme === 'dark' ? 'text-white' : 'text-slate-900'">{{ t('Create New Product SKU') }}</h3>
              <p class="text-[11px]" :class="theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'">{{ t('Fill in product specifications and category grouping.') }}</p>
            </div>

            <!-- Form with novalidate to suppress browser tooltip -->
            <form @submit.prevent="createItem" novalidate class="space-y-4">
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <!-- Field 1: Name Product -->
                <div class="space-y-1.5">
                  <label class="text-xs font-semibold" :class="theme === 'dark' ? 'text-zinc-300' : 'text-slate-700'">{{ t('Product Name') }} <span class="text-rose-500">*</span></label>
                  <input 
                    type="text" 
                    v-model="newItem.name" 
                    placeholder="e.g. Nasi Bakar Cakalang" 
                    @input="itemErrors.name = ''"
                    :class="[
                      itemErrors.name ? 'border-rose-500' : (theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-slate-50 border-slate-300 text-slate-900'),
                      'w-full border rounded-md px-3.5 py-2 text-xs outline-none transition-all hover:border-emerald-500/60'
                    ]"
                  />
                  <!-- Inline Red Error -->
                  <p v-if="itemErrors.name" class="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                    <AlertTriangle class="w-3 h-3" />
                    <span>{{ itemErrors.name }}</span>
                  </p>
                  <p v-else class="text-[10px] text-zinc-500">{{ t('Official product name shown across all reports') }}</p>
                </div>

                <!-- Field 2: Group / Category -->
                <div class="space-y-1.5">
                  <label class="text-xs font-semibold" :class="theme === 'dark' ? 'text-zinc-300' : 'text-slate-700'">{{ t('Group / Category') }}</label>
                  <SmartSelect
                    v-model="newItem.group_select"
                    :theme="theme"
                    :placeholder="t('-- No Group / Uncategorized --')"
                    :options="[{ value: '', label: '-- No Group / Uncategorized --' }, ...existingGroups.map(g => ({ value: g, label: g })), { value: '__CUSTOM__', label: '+ Create New Group...' }]"
                  />
                  <input 
                    v-if="newItem.group_select === '__CUSTOM__'"
                    type="text" 
                    v-model="newItem.custom_group" 
                    :placeholder="t('Type new group name')"
                    :class="[
                      theme === 'dark' ? 'bg-zinc-950 border-emerald-500/50 text-zinc-100' : 'bg-slate-50 border-emerald-600 text-slate-900',
                      'w-full mt-1 border rounded-md px-3 py-1.5 text-xs outline-none'
                    ]"
                  />
                  <p class="text-[10px] text-zinc-500">{{ t('Assigns SKU to a shared business category') }}</p>
                </div>

                <!-- Field 3: Selling Price -->
                <div class="space-y-1.5">
                  <label class="text-xs font-semibold" :class="theme === 'dark' ? 'text-zinc-300' : 'text-slate-700'">{{ t('Selling Price (Rp)') }} <span class="text-rose-500">*</span></label>
                  <input 
                    type="number" 
                    v-model.number="newItem.current_price" 
                    placeholder="e.g. 9000" 
                    min="0" 
                    @input="itemErrors.current_price = ''"
                    @keydown.up.prevent
                    @keydown.down.prevent
                    :class="[
                      itemErrors.current_price ? 'border-rose-500' : (theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-slate-50 border-slate-300 text-slate-900'),
                      'w-full border rounded-md px-3.5 py-2 text-xs outline-none tnum transition-all hover:border-emerald-500/60'
                    ]"
                  />
                  <!-- Inline Red Error -->
                  <p v-if="itemErrors.current_price" class="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                    <AlertTriangle class="w-3 h-3" />
                    <span>{{ itemErrors.current_price }}</span>
                  </p>
                  <p v-else class="text-[10px] text-zinc-500">{{ t('Current active unit price for operations') }}</p>
                </div>
              </div>

              <div class="flex justify-end pt-2">
                <button 
                  type="submit" 
                  class="bg-emerald-500 hover:bg-emerald-400 hover:border-emerald-400 active:scale-[0.98] text-zinc-950 font-semibold px-5 py-2 rounded-md text-xs transition-all shadow-sm cursor-pointer"
                >
                  {{ t('Save Product SKU') }}
                </button>
              </div>
            </form>
          </div>

          <!-- Catalog Table with Editable Group Dropdown per SKU -->
          <div 
            :class="[
              theme === 'dark' ? 'bg-zinc-900/70 border-zinc-800/80' : 'bg-white border-slate-200 shadow-sm',
              'border rounded-md overflow-hidden'
            ]"
          >
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead :class="theme === 'dark' ? 'bg-zinc-950/80 text-zinc-400 border-zinc-800' : 'bg-slate-50 text-slate-600 border-slate-200'" class="border-b">
                  <tr>
                    <th class="px-3 py-2 font-semibold uppercase tracking-wide">{{ t('SKU / ID') }}</th>
                    <th class="px-3 py-2 font-semibold uppercase tracking-wide">{{ t('Product Name') }}</th>
                    <th class="px-3 py-2 font-semibold uppercase tracking-wide">{{ t('Group Type') }}</th>
                    <th class="px-3 py-2 font-semibold uppercase tracking-wide text-right">{{ t('Selling Price') }}</th>
                    <th class="px-3 py-2 font-semibold uppercase tracking-wide">{{ t('Status') }}</th>
                    <th class="px-3 py-2 font-semibold uppercase tracking-wide text-right">{{ t('Actions') }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y" :class="theme === 'dark' ? 'divide-zinc-800/60' : 'divide-slate-200'">
                  <tr v-if="filteredItems.length === 0">
                    <td colspan="6" class="p-8 text-center" :class="theme === 'dark' ? 'text-zinc-500' : 'text-slate-500'">
                      {{ items.length === 0 ? 'No catalog items found. Click "Create Item" above to add your first product.' : 'No items match the current filter.' }}
                    </td>
                  </tr>
                  <tr 
                    v-for="it in filteredItems" 
                    :key="it.id" 
                    :class="theme === 'dark' ? 'hover:bg-zinc-800/20' : 'hover:bg-slate-50'"
                    class="transition-colors"
                  >
                    <td class="px-3 py-2 tnum" :class="theme === 'dark' ? 'text-zinc-500' : 'text-slate-500'">#{{ it.id }}</td>
                    <td class="px-3 py-2 font-semibold" :class="theme === 'dark' ? 'text-white' : 'text-slate-900'">{{ it.name }}</td>

                    <!-- Group Type: plain text by default, compact flat dropdown only in edit mode -->
                    <td class="px-3 py-2">
                      <div v-if="editGroupId === it.id" class="w-40">
                        <SmartSelect
                          :model-value="it.group_name || ''"
                          :theme="theme"
                          :placeholder="t('No Group')"
                          width-class="w-40"
                          :options="[{ value: '', label: 'No Group' }, ...existingGroups.map(g => ({ value: g, label: g })), { value: '__NEW__', label: '+ New Group...' }]"
                          @change="(v) => { onTableGroupChangeVal(it, v); editGroupId = null; }"
                        />
                      </div>
                      <button 
                        v-else
                        @click="editGroupId = it.id"
                        class="group inline-flex items-center gap-1.5 text-left cursor-pointer no-ancient"
                        :title="t('Edit group')"
                      >
                        <span :class="theme === 'dark' ? 'text-zinc-300' : 'text-slate-700'">{{ it.group_name || '—' }}</span>
                        <Pencil class="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" :class="theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'" />
                      </button>
                    </td>

                    <td class="px-3 py-2 text-right tnum font-semibold" :class="theme === 'dark' ? 'text-white' : 'text-slate-900'">{{ formatCurrency(it.current_price) }}</td>
                    <td class="px-3 py-2">
                      <span 
                        class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold"
                        :class="it.is_active ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : (theme === 'dark' ? 'bg-zinc-800 text-zinc-400 border border-zinc-700' : 'bg-slate-100 text-slate-500 border border-slate-200')"
                      >
                        {{ it.is_active ? 'Active' : 'Archived' }}
                      </span>
                    </td>
                    <td class="px-3 py-2 text-right">
                      <div class="flex items-center justify-end gap-1.5">
                        <button 
                          @click="openEditItemModal(it)" 
                          :title="t('Edit Item')"
                          :class="[
                            theme === 'dark' 
                              ? 'bg-zinc-800 hover:text-white text-zinc-300 border border-zinc-700' 
                              : 'bg-white hover:text-slate-900 text-slate-700 border border-slate-300',
                            'inline-flex items-center justify-center w-9 h-9 sm:w-auto sm:h-auto sm:p-1.5 rounded-md border transition-all active:scale-95 cursor-pointer'
                          ]"
                        >
                          <Pencil class="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                        </button>
                        <button 
                          @click="promptDeleteItem(it)" 
                          :title="t('Delete Item')"
                          :class="[
                            theme === 'dark' 
                              ? 'bg-zinc-800 text-zinc-400 hover:text-rose-400 border border-zinc-700' 
                              : 'bg-white text-slate-600 hover:text-rose-600 border border-slate-300',
                            'inline-flex items-center justify-center w-9 h-9 sm:w-auto sm:h-auto sm:p-1.5 rounded-md border transition-all active:scale-95 cursor-pointer'
                          ]"
                        >
                          <Trash2 class="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <!-- TAB 4: OPERATIONAL EXPENDITURES (OpEx) -->
        <section v-if="currentTab === 'opex'" class="space-y-5 tab-view">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 class="text-lg font-bold tracking-tight" :class="theme === 'dark' ? 'text-white' : 'text-slate-900'">
                {{ t('Cost & OpEx Registry') }}
              </h2>
              <p class="text-xs" :class="theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'">
                {{ t('Track and reconcile business operational expenditures.') }}
              </p>
            </div>
            <div class="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                @click="openReceiptScan"
                class="no-ancient bg-slate-900 hover:bg-slate-800 text-white font-medium px-3.5 py-2 rounded-md text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <ScanLine class="w-4 h-4 shrink-0" />
                <span>{{ t('Scan Receipt') }}</span>
              </button>
              <div class="text-xs flex items-center gap-2">
                <span :class="theme === 'dark' ? 'text-zinc-400' : 'text-slate-600'">{{ t('Total OpEx:') }}</span>
                <span class="tnum font-bold" :class="theme === 'dark' ? 'text-white' : 'text-slate-900'">{{ formatCurrency(opexTotalSum) }}</span>
              </div>
              <button
                @click="refreshCurrentTab"
                :title="t('Muat ulang data')"
                :class="[
                  'shrink-0 px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 border cursor-pointer',
                  theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-emerald-400 hover:border-emerald-500/40' : 'bg-white border-slate-200 text-slate-600 hover:text-emerald-600 hover:border-emerald-400'
                ]"
              >
                <RefreshCw class="w-3.5 h-3.5 shrink-0" />
                <span>{{ t('Segarkan') }}</span>
              </button>
            </div>
          </div>

          <!-- OpEx Input Form (novalidate with inline red errors) -->
          <div 
            :class="[
              theme === 'dark' ? 'bg-zinc-900/70 border-zinc-800/80' : 'bg-white border-slate-200 shadow-sm',
              'border rounded-md p-4 space-y-3'
            ]"
          >
            <button type="button" @click="toggleSection('opex')" class="no-ancient w-full flex items-center gap-2 cursor-pointer text-left">
              <h3 class="text-xs font-semibold uppercase tracking-wider" :class="theme === 'dark' ? 'text-white' : 'text-slate-900'">{{ t('Record Expense') }}</h3>
              <ChevronDown class="w-4 h-4 text-zinc-400 transition-transform" :class="isOpen('opex') ? '' : '-rotate-90'" />
            </button>
            <form v-show="isOpen('opex')" @submit.prevent="createOpEx" novalidate class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div class="space-y-1">
                <label class="text-[11px] font-semibold" :class="theme === 'dark' ? 'text-zinc-300' : 'text-slate-700'">{{ t('Expense Item') }}</label>
                <input 
                  type="text" 
                  v-model="newOpEx.item_name" 
                  placeholder="e.g. Minyak Goreng" 
                  @input="opexErrors.item_name = ''"
                  :class="[
                    opexErrors.item_name ? 'border-rose-500' : (theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-slate-50 border-slate-300 text-slate-900'),
                    'w-full border rounded-md px-3 py-2 text-xs outline-none transition-all hover:border-emerald-500/60'
                  ]"
                />
                <p v-if="opexErrors.item_name" class="text-[11px] text-rose-500 font-medium mt-0.5">{{ opexErrors.item_name }}</p>
              </div>

              <div class="space-y-1">
                <label class="text-[11px] font-semibold" :class="theme === 'dark' ? 'text-zinc-300' : 'text-slate-700'">{{ t('Cost Paid (Rp)') }}</label>
                <input 
                  type="number" 
                  v-model.number="newOpEx.price_paid" 
                  :placeholder="t('Cost (Rp)')" 
                  min="0" 
                  @input="opexErrors.price_paid = ''"
                  @keydown.up.prevent
                  @keydown.down.prevent
                  :class="[
                    opexErrors.price_paid ? 'border-rose-500' : (theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-slate-50 border-slate-300 text-slate-900'),
                    'w-full border rounded-md px-3 py-2 text-xs outline-none tnum transition-all hover:border-emerald-500/60'
                  ]"
                />
                <p v-if="opexErrors.price_paid" class="text-[11px] text-rose-500 font-medium mt-0.5">{{ opexErrors.price_paid }}</p>
              </div>

              <div class="space-y-1">
                <label class="text-[11px] font-semibold" :class="theme === 'dark' ? 'text-zinc-300' : 'text-slate-700'">{{ t('Quantity') }}</label>
                <input 
                  type="number" 
                  v-model.number="newOpEx.quantity" 
                  :placeholder="t('Qty')" 
                  min="0.01" 
                  step="any" 
                  @keydown.up.prevent
                  @keydown.down.prevent
                  :class="[
                    theme === 'dark' 
                      ? 'bg-zinc-950 border-zinc-800 text-zinc-100 hover:border-emerald-500/60' 
                      : 'bg-slate-50 border-slate-300 text-slate-900 hover:border-emerald-500/60',
                    'w-full border rounded-md px-3 py-2 text-xs outline-none tnum transition-all'
                  ]"
                />
              </div>

              <div class="space-y-1">
                <label class="text-[11px] font-semibold" :class="theme === 'dark' ? 'text-zinc-300' : 'text-slate-700'">{{ t('Unit') }}</label>
                <SmartSelect
                  v-model="newOpEx.measurement"
                  :theme="theme"
                  :searchable="false"
                  :options="[{value:'Box',label:'Box'},{value:'Pcs',label:'Pcs'},{value:'Kilo',label:'Kilo'},{value:'Litre',label:'Litre'},{value:'Sachet',label:'Sachet'}]"
                />
              </div>

              <div class="flex items-end">
                <button 
                  type="submit" 
                  class="no-ancient w-full bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white font-medium rounded-md text-xs py-2 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Receipt class="w-3.5 h-3.5" />
                  <span>{{ t('Save Expense') }}</span>
                </button>
              </div>
            </form>
          </div>

          <!-- OpEx Ledger Table -->
          <div 
            :class="[
              theme === 'dark' ? 'bg-zinc-900/70 border-zinc-800/80' : 'bg-white border-slate-200 shadow-sm',
              'border rounded-md overflow-hidden'
            ]"
          >
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead :class="theme === 'dark' ? 'bg-zinc-950/80 text-zinc-400 border-zinc-800' : 'bg-slate-50 text-slate-600 border-slate-200'" class="border-b">
                  <tr>
                    <th class="px-3 py-2 font-semibold uppercase tracking-wide">{{ t('Expense Date') }}</th>
                    <th class="px-3 py-2 font-semibold uppercase tracking-wide">{{ t('Item Description') }}</th>
                    <th class="px-3 py-2 font-semibold uppercase tracking-wide text-right">{{ t('Quantity') }}</th>
                    <th class="px-3 py-2 font-semibold uppercase tracking-wide text-right">{{ t('Unit Cost') }}</th>
                    <th class="px-3 py-2 font-semibold uppercase tracking-wide text-right">{{ t('Cost Paid') }}</th>
                    <th class="px-3 py-2 font-semibold uppercase tracking-wide text-right">{{ t('Actions') }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y" :class="theme === 'dark' ? 'divide-zinc-800/60' : 'divide-slate-200'">
                  <tr v-if="opexList.length === 0">
                    <td colspan="6" class="p-8 text-center" :class="theme === 'dark' ? 'text-zinc-500' : 'text-slate-500'">{{ t('No operational expenditures recorded yet.') }}</td>
                  </tr>
                  <tr 
                    v-for="op in opexList" 
                    :key="op.id" 
                    :class="theme === 'dark' ? 'hover:bg-zinc-800/20' : 'hover:bg-slate-50'"
                    class="transition-colors"
                  >
                    <td class="px-3 py-2 tnum" :class="theme === 'dark' ? 'text-zinc-500' : 'text-slate-500'">{{ formatDate(op.expense_date) }}</td>
                    <td class="px-3 py-2 font-semibold" :class="theme === 'dark' ? 'text-white' : 'text-slate-900'">
                      {{ op.item_name }}
                      <span v-if="op.notes" class="block text-[10px] font-normal" :class="theme === 'dark' ? 'text-zinc-500' : 'text-slate-500'">{{ op.notes }}</span>
                    </td>
                    <td class="px-3 py-2 text-right tnum" :class="theme === 'dark' ? 'text-white' : 'text-slate-900'">
                      {{ op.quantity }}
                      <span :class="theme === 'dark' ? 'text-zinc-500' : 'text-slate-500'" class="ml-1 text-[10px]">{{ op.measurement }}</span>
                    </td>
                    <td class="px-3 py-2 text-right tnum" :class="theme === 'dark' ? 'text-zinc-400' : 'text-slate-600'">
                      {{ formatCurrency(Math.round(Number(op.price_paid) / Number(op.quantity))) }}
                    </td>
                    <td class="px-3 py-2 text-right tnum font-semibold" :class="theme === 'dark' ? 'text-white' : 'text-slate-900'">
                      {{ formatCurrency(op.price_paid) }}
                    </td>
                    <td class="px-3 py-2 text-right">
                      <div class="flex items-center justify-end gap-1.5">
                        <button 
                          @click="openEditOpExModal(op)" 
                          :title="t('Edit OpEx')"
                          :class="[
                            theme === 'dark' 
                              ? 'bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700' 
                              : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-300',
                            'inline-flex items-center justify-center w-9 h-9 sm:w-auto sm:h-auto sm:p-1.5 rounded-md border transition-all active:scale-95 cursor-pointer'
                          ]"
                        >
                          <Pencil class="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                        </button>
                        <button 
                          @click="promptDeleteOpEx(op)" 
                          :title="t('Delete OpEx')"
                          :class="[
                            theme === 'dark' 
                              ? 'bg-zinc-800 text-zinc-400 hover:text-rose-400 border border-zinc-700' 
                              : 'bg-white text-slate-600 hover:text-rose-600 border border-slate-300',
                            'inline-flex items-center justify-center w-9 h-9 sm:w-auto sm:h-auto sm:p-1.5 rounded-md border transition-all active:scale-95 cursor-pointer'
                          ]"
                        >
                          <Trash2 class="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <!-- TAB 5: SYSTEM CONFIGURATION & BUSINESS INFORMATION & API LINK -->
        <section v-if="currentTab === 'system'" class="space-y-6 tab-view">
          <div class="flex items-start justify-between gap-3">
            <h2 class="text-lg font-bold tracking-tight" :class="theme === 'dark' ? 'text-white' : 'text-slate-900'">
              {{ t('System Configuration & Business Profile') }}
            </h2>
            <button
              @click="refreshCurrentTab"
              :title="t('Muat ulang data')"
              :class="[
                'shrink-0 px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 border cursor-pointer',
                theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-emerald-400 hover:border-emerald-500/40' : 'bg-white border-slate-200 text-slate-600 hover:text-emerald-600 hover:border-emerald-400'
              ]"
            >
              <RefreshCw class="w-3.5 h-3.5" />
              <span>{{ t('Segarkan') }}</span>
            </button>
            </div>

          <!-- 0b. USER MANAGEMENT (ADMIN ONLY): create users, roles, WA setup UID -->
          <div
            :class="[
              theme === 'dark' ? 'bg-zinc-900/70 border-zinc-800' : 'bg-white border-slate-200 shadow-sm',
              'border rounded-md p-5 space-y-4'
            ]"
          >
            <div class="flex items-center gap-2 border-b pb-3" :class="theme === 'dark' ? 'border-zinc-800' : 'border-slate-100'">
              <Users class="w-4 h-4 text-emerald-500" />
              <div>
                <h3 class="text-xs font-bold uppercase tracking-wider" :class="theme === 'dark' ? 'text-white' : 'text-slate-900'">
                  {{ t('Manajemen User') }}
                </h3>
                <p class="text-[11px]" :class="theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'">{{ t('Buat akun, atur role, dan bagikan UID untuk setup Bot WhatsApp.') }}</p>
              </div>
            </div>

            <!-- Create user form -->
            <form @submit.prevent="createUser" class="grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-end">
              <div class="space-y-1 sm:col-span-1">
                <label class="text-[11px] font-semibold" :class="theme === 'dark' ? 'text-zinc-400' : 'text-slate-600'">{{ t('Nama') }}</label>
                <input
                  v-model="newUser.username"
                  type="text"
                  :placeholder="t('Nama user')"
                  :class="[
                    theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900',
                    'w-full px-3 py-2 rounded-md border text-sm focus:outline-none focus:border-emerald-500'
                  ]"
                />
              </div>
              <div class="space-y-1 sm:col-span-1">
                <label class="text-[11px] font-semibold" :class="theme === 'dark' ? 'text-zinc-400' : 'text-slate-600'">{{ t('Password') }}</label>
                <input
                  v-model="newUser.password"
                  type="password"
                  placeholder="••••••••"
                  :class="[
                    theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900',
                    'w-full px-3 py-2 rounded-md border text-sm focus:outline-none focus:border-emerald-500'
                  ]"
                />
              </div>
              <div class="space-y-1 sm:col-span-1">
                <label class="text-[11px] font-semibold" :class="theme === 'dark' ? 'text-zinc-400' : 'text-slate-600'">{{ t('Role') }}</label>
                <select
                  v-model="newUser.role"
                  :class="[
                    theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900',
                    'w-full px-3 py-2 rounded-md border text-sm focus:outline-none focus:border-emerald-500 cursor-pointer'
                  ]"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button
                type="submit"
                :disabled="!newUser.username.trim() || !newUser.password || userSaving"
                :class="[
                  (!newUser.username.trim() || !newUser.password || userSaving)
                    ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer',
                  'sm:col-span-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-md text-sm font-semibold transition-colors'
                ]"
              >
                <Plus class="w-4 h-4" />
                <span>{{ userSaving ? t('Menyimpan…') : t('Buat User') }}</span>
              </button>
            </form>
            <p v-if="userFormMsg" class="text-xs font-medium" :class="userFormOk ? 'text-emerald-500' : 'text-rose-500'">{{ userFormMsg }}</p>

            <!-- Newly created UID callout -->
            <div v-if="lastCreatedUid" class="flex items-center justify-between gap-2 rounded-md px-3 py-2.5 border" :class="theme === 'dark' ? 'bg-emerald-950/30 border-emerald-800/50' : 'bg-emerald-50 border-emerald-200'">
              <div class="min-w-0">
                <p class="text-[11px] font-semibold" :class="theme === 'dark' ? 'text-emerald-300' : 'text-emerald-700'">{{ t('UID untuk setup WhatsApp') }}</p>
                <p class="text-sm font-bold tnum truncate" :class="theme === 'dark' ? 'text-white' : 'text-slate-900'">{{ lastCreatedUid }}</p>
                <p class="text-[11px]" :class="theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'">{{ t('User chat ke Bot WA:') }} <code>/setup {{ lastCreatedUid }}</code></p>
              </div>
              <button type="button" @click="copyUid(lastCreatedUid)" class="no-ancient text-[11px] font-semibold px-2.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shrink-0">{{ t('Salin') }}</button>
            </div>

            <!-- User list -->
            <div class="space-y-1.5">
              <label class="text-[11px] font-semibold uppercase tracking-wide" :class="theme === 'dark' ? 'text-zinc-400' : 'text-slate-600'">{{ t('Daftar User') }}</label>
              <div v-if="userList.length === 0" class="text-xs text-zinc-500 py-3 text-center">{{ t('Belum ada user.') }}</div>
              <div class="overflow-x-auto" v-else>
                <table class="w-full text-xs">
                  <thead>
                    <tr :class="theme === 'dark' ? 'text-zinc-400 border-b border-zinc-800' : 'text-slate-600 border-b border-slate-200'">
                      <th class="text-left font-semibold uppercase tracking-wide px-2 py-2">{{ t('Nama') }}</th>
                      <th class="text-left font-semibold uppercase tracking-wide px-2 py-2">{{ t('Role') }}</th>
                      <th class="text-left font-semibold uppercase tracking-wide px-2 py-2">UID</th>
                      <th class="text-left font-semibold uppercase tracking-wide px-2 py-2">{{ t('Nomor WA') }}</th>
                      <th class="px-2 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="u in userList" :key="u.id" :class="theme === 'dark' ? 'border-b border-zinc-800/60' : 'border-b border-slate-200'">
                      <td class="px-2 py-2 font-medium" :class="theme === 'dark' ? 'text-zinc-200' : 'text-slate-800'">{{ u.display_name || u.username }}</td>
                      <td class="px-2 py-2">
                        <span :class="[
                          'inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase',
                          u.role === 'admin' ? 'bg-sky-500/15 text-sky-500' : 'bg-zinc-500/15 text-zinc-400'
                        ]">{{ u.role }}</span>
                      </td>
                      <td class="px-2 py-2 tnum" :class="theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'">
                        <span class="inline-flex items-center gap-1.5">
                          <span class="truncate">{{ u.wa_uid || '—' }}</span>
                          <button v-if="u.wa_uid" type="button" @click="copyUid(u.wa_uid)" :title="t('Salin')" class="no-ancient inline-flex items-center justify-center w-8 h-8 sm:w-auto sm:h-auto sm:p-1 rounded-md text-emerald-500 hover:bg-emerald-500/10 cursor-pointer shrink-0"><Copy class="w-4 h-4 sm:w-3 sm:h-3" /></button>
                        </span>
                      </td>
                      <td class="px-2 py-2 tnum" :class="theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'">
                        <span v-if="u.wa_jid" class="text-emerald-500">{{ u.wa_jid.split('@')[0] }}</span>
                        <span v-else class="text-zinc-500">{{ t('Belum terhubung') }}</span>
                      </td>
                      <td class="px-2 py-2 text-right whitespace-nowrap">
                        <div class="inline-flex items-center gap-1">
                        <button type="button" @click="openEditUser(u)" :title="t('Edit user')" class="no-ancient inline-flex items-center justify-center w-9 h-9 sm:w-auto sm:h-auto sm:p-1.5 rounded-md text-sky-500 hover:bg-sky-500/10 cursor-pointer"><Pencil class="w-4 h-4 sm:w-3.5 sm:h-3.5" /></button>
                        <button type="button" @click="regenerateUid(u)" :title="t('Reset UID & lepas nomor')" class="no-ancient inline-flex items-center justify-center w-9 h-9 sm:w-auto sm:h-auto sm:p-1.5 rounded-md text-amber-500 hover:bg-amber-500/10 cursor-pointer"><RefreshCw class="w-4 h-4 sm:w-3.5 sm:h-3.5" /></button>
                        <button v-if="u.id !== currentUser?.id" type="button" @click="deleteUser(u)" :title="t('Hapus user')" class="no-ancient inline-flex items-center justify-center w-9 h-9 sm:w-auto sm:h-auto sm:p-1.5 rounded-md text-rose-500 hover:bg-rose-500/10 cursor-pointer"><X class="w-4 h-4 sm:w-3.5 sm:h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- 1. BUSINESS INFORMATION (Requested Feature) -->
          <div 
            :class="[
              theme === 'dark' ? 'bg-zinc-900/70 border-zinc-800' : 'bg-white border-slate-200 shadow-sm',
              'border rounded-md px-5 transition-all',
              !isOpen('business') ? 'py-4' : 'py-5 space-y-4'
            ]"
          >
            <button
              type="button"
              @click="toggleSection('business')"
              class="no-ancient w-full flex items-center justify-between cursor-pointer"
              :class="!isOpen('business') ? '' : 'border-b pb-3 ' + (theme === 'dark' ? 'border-zinc-800' : 'border-slate-200')"
            >
              <div class="flex items-center gap-2">
                <Store class="w-4 h-4 text-emerald-500" />
                <h3 class="text-xs font-bold uppercase tracking-wider" :class="theme === 'dark' ? 'text-white' : 'text-slate-900'">
                  {{ t('Business Information') }}
                </h3>
              </div>
              <div class="flex items-center gap-2">
                <span v-if="isBusinessInfoDirty" class="text-xs text-rose-500 font-semibold">(unsaved changes)</span>
                <span v-if="businessSaveMsg" class="text-xs text-emerald-500 font-semibold flex items-center gap-1">
                  <Check class="w-3.5 h-3.5" />
                  <span>{{ businessSaveMsg }}</span>
                </span>
                <ChevronDown class="w-4 h-4 text-zinc-400 transition-transform" :class="isOpen('business') ? '' : '-rotate-90'" />
              </div>
            </button>

            <!-- Business Form with novalidate & inline red errors -->
            <form v-show="isOpen('business')" @submit.prevent="saveBusinessInfo" novalidate class="space-y-3.5 text-xs">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <!-- Field: Business Name -->
                <div class="space-y-1">
                  <label class="font-semibold" :class="theme === 'dark' ? 'text-zinc-300' : 'text-slate-700'">{{ t('Business Name') }} <span class="text-rose-500">*</span></label>
                  <input 
                    type="text" 
                    v-model="businessInfo.business_name" 
                    placeholder="e.g. Warung Nasi Nusantara" 
                    @input="businessErrors.business_name = ''"
                    :class="[
                      businessErrors.business_name ? 'border-rose-500' : (theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-slate-50 border-slate-300 text-slate-900'),
                      'w-full border rounded-md px-3 py-2 outline-none transition-all hover:border-emerald-500/60'
                    ]"
                  />
                  <p v-if="businessErrors.business_name" class="text-[11px] text-rose-500 font-medium mt-0.5">{{ businessErrors.business_name }}</p>
                </div>

                <!-- Field: Business Email -->
                <div class="space-y-1">
                  <label class="font-semibold" :class="theme === 'dark' ? 'text-zinc-300' : 'text-slate-700'">{{ t('Business Email') }}</label>
                  <input 
                    type="email" 
                    v-model="businessInfo.business_email" 
                    placeholder="e.g. contact@business.com" 
                    :class="[
                      theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-slate-50 border-slate-300 text-slate-900',
                      'w-full border rounded-md px-3 py-2 outline-none transition-all hover:border-emerald-500/60'
                    ]"
                  />
                </div>
              </div>

              <!-- Field: Business Address — Indonesia region dropdowns + detail search -->
              <div class="space-y-2.5">
                <label class="font-semibold" :class="theme === 'dark' ? 'text-zinc-300' : 'text-slate-700'">{{ t('Business Address') }}</label>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div class="space-y-1">
                    <span class="text-[10px] uppercase tracking-wider text-zinc-500">{{ t('Provinsi') }}</span>
                    <SmartSelect
                      v-model="addr.province_id"
                      :theme="theme"
                      :placeholder="t('Pilih Provinsi')"
                      :options="provinceOptions"
                      @change="onProvinceChange"
                    />
                  </div>
                  <div class="space-y-1">
                    <span class="text-[10px] uppercase tracking-wider text-zinc-500">{{ t('Kabupaten / Kota') }}</span>
                    <SmartSelect
                      v-model="addr.regency_id"
                      :theme="theme"
                      :placeholder="t('Pilih Kab/Kota')"
                      :options="regencyOptions"
                      @change="onRegencyChange"
                    />
                  </div>
                  <div class="space-y-1">
                    <span class="text-[10px] uppercase tracking-wider text-zinc-500">{{ t('Kecamatan') }}</span>
                    <SmartSelect
                      v-model="addr.district_id"
                      :theme="theme"
                      :placeholder="t('Pilih Kecamatan')"
                      :options="districtOptions"
                      @change="onDistrictChange"
                    />
                  </div>
                  <div class="space-y-1">
                    <span class="text-[10px] uppercase tracking-wider text-zinc-500">{{ t('Kelurahan / Desa') }}</span>
                    <SmartSelect
                      v-model="addr.village_id"
                      :theme="theme"
                      :placeholder="t('Pilih Kelurahan')"
                      :options="villageOptions"
                      @change="onVillageChange"
                    />
                  </div>
                </div>

                <!-- Detail address — plain text, no lookup dropdown -->
                <div class="space-y-1">
                  <span class="text-[10px] uppercase tracking-wider text-zinc-500">{{ t('Detail (Cluster / Jalan / No.)') }}</span>
                  <input
                    type="text"
                    v-model="addr.detail"
                    placeholder='e.g. Cluster Amanah Gondrong No. 12'
                    autocomplete="off"
                    :class="[theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-slate-50 border-slate-300 text-slate-900', 'w-full border rounded-md px-3 py-2 outline-none transition-all']"
                  />
                </div>
                <p v-if="composedAddress" class="text-[11px] text-zinc-500">{{ t('Full:') }} <span class="text-emerald-500">{{ composedAddress }}</span></p>
              </div>

              <!-- Business Logo Preview & Upload Section -->
              <div 
                :class="[
                  theme === 'dark' ? 'bg-zinc-950/70 border-zinc-800' : 'bg-slate-50 border-slate-200',
                  'border rounded-md p-3.5 space-y-3'
                ]"
              >
                <div class="flex items-center justify-between">
                  <label class="font-semibold text-xs" :class="theme === 'dark' ? 'text-zinc-300' : 'text-slate-700'">
                    {{ t('Business Logo') }}
                  </label>
                  <span class="text-[10px] text-zinc-500 tnum">PNG, JPG, WEBP, SVG (Max 5MB)</span>
                </div>

                <div class="flex flex-col sm:flex-row sm:items-center gap-4">
                  <!-- Logo Preview Box -->
                  <div 
                    :class="[
                      theme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-slate-300 shadow-xs',
                      'w-16 h-16 rounded-md border flex items-center justify-center p-1.5 shrink-0 overflow-hidden'
                    ]"
                  >
                    <img 
                      v-if="businessInfo.business_logo" 
                      :src="businessInfo.business_logo" 
                      alt="Logo Preview" 
                      class="max-w-full max-h-full object-contain"
                      @error="(e: any) => e.target.src = '/logo-icon.png'"
                    />
                    <ImageIcon v-else class="w-6 h-6 text-zinc-600" />
                  </div>

                  <!-- Upload Button & File Input -->
                  <div class="flex-1 space-y-2">
                    <div class="flex items-center gap-2">
                      <input 
                        type="file" 
                        ref="logoFileInput" 
                        @change="handleLogoUpload" 
                        accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml" 
                        class="hidden" 
                      />
                      <button 
                        type="button" 
                        @click="triggerLogoUpload" 
                        :disabled="isUploadingLogo"
                        class="bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-zinc-950 font-semibold px-3.5 py-1.5 rounded-md text-xs transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <Upload class="w-3.5 h-3.5" />
                        <span>{{ isUploadingLogo ? 'Uploading...' : 'Upload Image' }}</span>
                      </button>
                    </div>
                    <p class="text-[11px] text-zinc-500">
                      {{ t('Uploaded image is set as your project logo.') }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Field: Business Telephone (Indonesia format) -->
              <div class="space-y-1">
                <label class="font-semibold text-xs" :class="theme === 'dark' ? 'text-zinc-300' : 'text-slate-700'">{{ t('Business Telephone') }}</label>
                <input 
                  type="tel" 
                  v-model="businessInfo.business_telephone" 
                  @input="onPhoneInput"
                  placeholder="e.g. +62 812-3456-7890" 
                  :class="[
                    phoneError ? 'border-rose-500' : (theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-slate-50 border-slate-300 text-slate-900'),
                    'w-full border rounded-md px-3 py-2 outline-none transition-all hover:border-emerald-500/60 tnum text-xs'
                  ]"
                />
                <p v-if="phoneError" class="text-[11px] text-rose-500 font-medium flex items-center gap-1"><AlertTriangle class="w-3 h-3" />{{ phoneError }}</p>
                <p v-else-if="phoneProvider" class="text-[11px] text-emerald-500">Provider: {{ phoneProvider }}</p>
              </div>

              <div class="flex justify-end pt-2">
                <button 
                  type="submit" 
                  :disabled="!!phoneError"
                  :class="[!!phoneError ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-400 hover:border-emerald-400 active:scale-[0.98] text-zinc-950 cursor-pointer', 'font-semibold px-4 py-2 rounded-md text-xs transition-all flex items-center gap-1.5 shadow-sm']"
                >
                  <Store class="w-3.5 h-3.5" />
                  <span>{{ t('Save Business Information') }}</span>
                </button>
              </div>
            </form>
          </div>

          <!-- 2. WHATSAPP BAILEYS BOT INTEGRATION & QR DISPLAY -->
          <div 
            :class="[
              theme === 'dark' ? 'bg-zinc-900/70 border-zinc-800' : 'bg-white border-slate-200 shadow-sm',
              'border rounded-md p-5 md:p-6 space-y-5'
            ]"
          >
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4" :class="theme === 'dark' ? 'border-zinc-800' : 'border-slate-200'">
              <button type="button" @click="toggleSection('waApi')" class="no-ancient space-y-1 text-left cursor-pointer flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <MessageSquare class="w-4 h-4 text-emerald-500" />
                  <h3 class="text-xs font-bold uppercase tracking-wider" :class="theme === 'dark' ? 'text-white' : 'text-slate-900'">
                    {{ t('HUBUNGKAN KE WHATSAPP & API KEY') }}
                  </h3>
                  <ChevronDown class="w-4 h-4 text-zinc-400 transition-transform" :class="isOpen('waApi') ? '' : '-rotate-90'" />
                  <span 
                    v-if="waStatus.status === 'connected'"
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                  >
                    ● Connected
                  </span>
                  <span 
                    v-else-if="waStatus.status === 'connecting'"
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20"
                  >
                    ● Pairing Required
                  </span>
                  <span 
                    v-else
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"
                  >
                    ○ Disconnected
                  </span>
                </div>
                <p class="text-xs" :class="theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'">
                  {{ t('Manage inventory and input OpEx directly via WhatsApp chats using prefixes') }} <code class="tnum text-emerald-500">/belanja</code>, <code class="tnum text-emerald-500">/pesanan</code>, and <code class="tnum text-emerald-500">/analytics</code>.
                </p>
              </button>

              <!-- Action Controls -->
              <div class="flex items-center gap-2">
                <button 
                  v-if="waStatus.status !== 'connected'"
                  type="button"
                  @click="connectToWhatsAppBot"
                  :disabled="isConnectingWA"
                  class="bg-emerald-500 hover:bg-emerald-400 hover:border-emerald-400 active:scale-[0.98] text-zinc-950 font-semibold px-4 py-2 rounded-md text-xs transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <QrCode class="w-3.5 h-3.5" />
                  <span>{{ isConnectingWA ? t('Connecting...') : t('Connect to WhatsApp and Generate QR') }}</span>
                </button>

                <button 
                  v-else
                  type="button"
                  @click="disconnectWhatsAppBot"
                  class="bg-rose-500 hover:bg-rose-400 text-white font-semibold px-4 py-2 rounded-md text-xs transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Power class="w-3.5 h-3.5" />
                  <span>{{ t('Disconnect Session') }}</span>
                </button>

                <button 
                  type="button" 
                  @click="fetchWAStatus" 
                  :title="t('Refresh Connection Status')"
                  :class="[
                    theme === 'dark' ? 'bg-zinc-800 text-zinc-300 hover:text-white' : 'bg-slate-100 text-slate-700 hover:text-slate-900',
                    'p-2 rounded-md border border-transparent hover:border-emerald-500/60 transition-all cursor-pointer'
                  ]"
                >
                  <RefreshCw class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div v-show="isOpen('waApi')" class="space-y-5 pt-1">
            <!-- Bot Connection Details & Interactive QR Panel -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
              <!-- Left: Commands Cheatsheet -->
              <div class="md:col-span-2 space-y-3 text-xs">
                <div 
                  :class="[
                    theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-200',
                    'border rounded-md p-3.5 space-y-2'
                  ]"
                >
                  <div class="font-bold text-[11px] uppercase tracking-wider text-emerald-500">{{ t('Available Bot Commands') }}</div>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                    <div>
                      <span class="font-semibold text-xs mb-1 block" :class="theme === 'dark' ? 'text-zinc-200' : 'text-slate-900'">1. /belanja</span>
                      <pre class="mt-1 p-2 rounded bg-zinc-900 text-zinc-300 tnum text-[10px] leading-tight">/belanja
24-09-26
Ayam, 240000, 4 KG
Cabe, 150000, 2 KG</pre>
                    </div>
                    <div>
                      <span class="font-semibold text-xs mb-1 block" :class="theme === 'dark' ? 'text-zinc-200' : 'text-slate-900'">2. /pesanan</span>
                      <pre class="mt-1 p-2 rounded bg-zinc-900 text-zinc-300 tnum text-[10px] leading-tight">/pesanan
26-09-26
Wina: ayam kare 10, cumi 11, sate kikil 11
Kevin: sate kikil 12, cumi 1
Darma: Jus Jambu 1</pre>
                    </div>
                  </div>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] mt-2">
                    <div>
                      <span class="font-semibold text-xs mb-1 block" :class="theme === 'dark' ? 'text-zinc-200' : 'text-slate-900'">3. /updatecatalog</span>
                      <pre class="mt-1 p-2 rounded bg-zinc-900 text-zinc-300 tnum text-[10px] leading-tight">/updatecatalog
Nasi Jagal, Aneka Nasi, 250000
Cumi Goreng, Aneka Laut, 18000</pre>
                    </div>
                    <div>
                      <span class="font-semibold text-xs mb-1 block" :class="theme === 'dark' ? 'text-zinc-200' : 'text-slate-900'">4. /analytics</span>
                      <pre class="mt-1 p-2 rounded bg-zinc-900 text-zinc-300 tnum text-[10px] leading-tight">/analytics
/dashboard</pre>
                    </div>
                  </div>
                  <div class="pt-1 text-[10px] text-zinc-500 flex items-center justify-between">
                    <span>{{ t('Command 5:') }} <code class="text-emerald-400">/bantuan</code> or <code class="text-emerald-400">/satuan</code></span>
                    <span>{{ t('Multi-line inputs supported') }}</span>
                  </div>
                </div>

                <div v-if="waStatus.status === 'connected'" class="p-3 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-xs" :class="theme === 'dark' ? 'text-emerald-300' : 'text-emerald-800'">
                  <Check class="w-4 h-4 inline-block mr-1 text-emerald-500" /> <b>{{ t('Connected Account:') }}</b> <span class="tnum">{{ maskJid(waStatus.user) }}</span>. The bot is actively listening to WhatsApp messages!
                </div>
              </div>

              <!-- Right: Interactive QR Code Display (Default: Hidden until user clicks button) -->
              <div class="flex flex-col items-center justify-center p-4 border rounded-md" :class="theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-200'">
                <!-- When user requested QR and QR data is ready -->
                <div v-if="qrRequested && waStatus.qr && waStatus.status !== 'connected'" class="text-center space-y-2">
                  <div class="p-2 bg-white rounded-md shadow-sm inline-block">
                    <img :src="waStatus.qr" alt="WhatsApp QR Code" class="w-48 h-48 object-contain" />
                  </div>
                  <p class="text-[11px] font-semibold text-emerald-500 animate-pulse">{{ t('Scan with WhatsApp &gt; Linked Devices') }}</p>
                  <p class="text-[10px] text-zinc-500">{{ t('QR refreshes automatically') }}</p>
                </div>

                <!-- When user clicked connect and waiting for QR generation -->
                <div v-else-if="qrRequested && (waStatus.status === 'connecting' || isConnectingWA)" class="text-center py-8 space-y-2">
                  <RefreshCw class="w-8 h-8 text-amber-500 animate-spin mx-auto" />
                  <p class="text-xs font-semibold text-amber-400">{{ t('Generating WhatsApp QR Code...') }}</p>
                </div>

                <!-- When paired and connected -->
                <div v-else-if="waStatus.status === 'connected'" class="text-center py-6 space-y-2">
                  <div class="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto text-xl font-bold">
                    ✓
                  </div>
                  <p class="text-xs font-bold text-emerald-400">{{ t('WhatsApp Paired') }}</p>
                  <p class="text-[11px] text-zinc-400">{{ t('Bot is live and ready') }}</p>
                </div>

                <!-- Default State: No QR visible until button is clicked -->
                <div v-else class="text-center py-8 space-y-2">
                  <QrCode class="w-10 h-10 text-zinc-600 mx-auto" />
                  <p class="text-xs font-medium" :class="theme === 'dark' ? 'text-zinc-300' : 'text-slate-700'">{{ t('QR Hidden') }}</p>
                  <p class="text-[10px] text-zinc-500 max-w-[170px] mx-auto">{{ t('Click "Connect to WhatsApp and Generate QR" to display pairing code') }}</p>
                </div>
              </div>
            </div>

            <!-- Whitelist Phone Numbers for WhatsApp Bot (Baileys JID format) -->
            <div class="border-t pt-4 space-y-3" :class="theme === 'dark' ? 'border-zinc-800' : 'border-slate-200'">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <Phone class="w-4 h-4 text-emerald-500" />
                  <span class="text-xs font-bold uppercase tracking-wider" :class="theme === 'dark' ? 'text-white' : 'text-slate-900'">
                    {{ t('Authorized Numbers (Whitelist)') }}
                  </span>
                </div>
                <span class="text-[10px] text-zinc-500 tnum">{{ t('Format: 628xxx@s.whatsapp.net') }}</span>
              </div>

              <div class="flex flex-col sm:flex-row gap-2">
                <input 
                  type="text"
                  v-model="newWhitelistNumber"
                  placeholder="e.g. 628123456789 or 628123456789@s.whatsapp.net"
                  @keyup.enter="addWhitelistNumber"
                  :class="[
                    theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-white border-slate-300 text-slate-900',
                    'flex-1 border rounded-md px-3 py-1.5 outline-none transition-all hover:border-emerald-500/60 tnum text-xs'
                  ]"
                />
                <button
                  type="button"
                  @click="addWhitelistNumber"
                  class="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold px-4 py-1.5 rounded-md text-xs transition-all shadow-sm cursor-pointer shrink-0"
                >
                  {{ t('Add Number') }}
                </button>
              </div>

              <!-- Whitelist tags display -->
              <div v-if="waWhitelist.length > 0" class="flex flex-wrap gap-2 pt-1">
                <div 
                  v-for="num in waWhitelist" 
                  :key="num"
                  class="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs tnum border"
                  :class="theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-emerald-400' : 'bg-slate-100 border-slate-300 text-emerald-700'"
                >
                  <span>{{ num }}</span>
                  <button
                    @click="confirmRemoveWhitelist(num)"
                    class="text-zinc-500 hover:text-rose-500 ml-1 transition-colors cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              </div>
              <p v-else class="text-[11px] text-zinc-500 italic">
                {{ t('No numbers whitelisted yet. (Empty whitelist allows admin/first sender; add numbers to enforce strict access control).') }}
              </p>
            </div>

            <!-- Automated Order Reminder Schedule Settings -->
            <div class="border-t pt-4 space-y-3" :class="theme === 'dark' ? 'border-zinc-800' : 'border-slate-200'">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <Clock class="w-4 h-4 text-emerald-500" />
                  <span class="text-xs font-bold uppercase tracking-wider" :class="theme === 'dark' ? 'text-white' : 'text-slate-900'">
                    {{ t('Automated Order Reminder Hours (WhatsApp)') }}
                  </span>
                </div>
                <span v-if="reminderStatusMsg" class="text-xs text-emerald-500 font-semibold flex items-center gap-1">
                  <Check class="w-3.5 h-3.5" />
                  <span>{{ reminderStatusMsg }}</span>
                </span>
              </div>
              <p class="text-xs" :class="theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'">
                {{ t('Bot automatically sends WhatsApp order summaries to whitelisted numbers. Default: Afternoon/Evening at 9 PM (21:00 WIB) for next-day prep, and Morning at 2 AM (02:00 WIB) for morning dispatch.') }}
              </p>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
                <!-- Toggle Active — theme-colored switch (left=off, right=on) -->
                <div class="flex items-center gap-3 sm:col-span-3">
                  <button
                    type="button"
                    role="switch"
                    :aria-checked="waReminder.enabled"
                    @click="waReminder.enabled = !waReminder.enabled"
                    :class="[
                      'ui-toggle',
                      waReminder.enabled ? 'ui-toggle-on' : (theme === 'dark' ? 'ui-toggle-off-dark' : 'ui-toggle-off-light')
                    ]"
                  >
                    <span class="ui-toggle-knob" :class="{ 'ui-toggle-knob-on': waReminder.enabled }"></span>
                  </button>
                  <span class="text-xs font-medium" :class="theme === 'dark' ? 'text-zinc-200' : 'text-slate-800'">{{ t('Enable Automated Daily WhatsApp Reminders') }}</span>
                </div>

                <!-- Evening Time -->
                <div class="space-y-1">
                  <label class="font-semibold block" :class="theme === 'dark' ? 'text-zinc-300' : 'text-slate-700'">
                    {{ t('Evening Prep Time (GMT+7)') }}
                  </label>
                  <input 
                    type="time" 
                    v-model="eveningTime" 
                    :class="[
                      theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-white border-slate-300 text-slate-900',
                      'w-full border rounded-md px-3 py-1.5 outline-none tnum text-xs cursor-pointer'
                    ]"
                  />
                  <span class="text-[10px] text-zinc-500 block">{{ t('Default: 21:00 (9 PM) for tomorrow') }}</span>
                </div>

                <!-- Morning Time -->
                <div class="space-y-1">
                  <label class="font-semibold block" :class="theme === 'dark' ? 'text-zinc-300' : 'text-slate-700'">
                    {{ t('Morning Packing Time (GMT+7)') }}
                  </label>
                  <input 
                    type="time" 
                    v-model="morningTime" 
                    :class="[
                      theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-white border-slate-300 text-slate-900',
                      'w-full border rounded-md px-3 py-1.5 outline-none tnum text-xs cursor-pointer'
                    ]"
                  />
                  <span class="text-[10px] text-zinc-500 block">{{ t('Default: 02:00 (2 AM) for today') }}</span>
                </div>

                <!-- Actions -->
                <div class="flex flex-col sm:flex-row gap-2 sm:col-span-3 sm:justify-end pt-1">
                  <button
                    type="button"
                    @click="saveReminderSettings"
                    :disabled="isSavingReminder"
                    class="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold px-4 py-2 rounded-md text-xs transition-all shadow-sm cursor-pointer w-full sm:w-auto disabled:opacity-50"
                  >
                    {{ isSavingReminder ? t('Saving...') : t('Save Reminder Schedule') }}
                  </button>
                  <button
                    type="button"
                    @click="triggerTestReminder"
                    :disabled="isTestingReminder || waStatus.status !== 'connected'"
                    class="no-ancient bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-medium px-4 py-2 rounded-md text-xs transition-all shadow-sm cursor-pointer w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {{ isTestingReminder ? t('Testing...') : t('Send Test Reminder Now') }}
                  </button>
                </div>
              </div>
            </div>
            <!-- Merged: Bot & Integration API Keys (inside WhatsApp Integrator card) -->
            <div class="border-t pt-4 space-y-3" :class="theme === 'dark' ? 'border-zinc-800' : 'border-slate-200'">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3" :class="theme === 'dark' ? 'border-zinc-800' : 'border-slate-200'">
              <div class="flex items-center gap-2">
                <Key class="w-4 h-4 text-emerald-500" />
                <div>
                  <h3 class="text-xs font-bold uppercase tracking-wider" :class="theme === 'dark' ? 'text-white' : 'text-slate-900'">
                    {{ t('Bot & Integration API Keys') }}
                  </h3>
                  <p class="text-[10px] text-zinc-500">{{ t('Generate credentials for external Telegram, WhatsApp, or POS automated calls.') }}</p>
                </div>
              </div>
              <button 
                @click="showCreateApiKeyModal = true"
                class="self-start sm:self-auto bg-emerald-500 hover:bg-emerald-400 hover:border-emerald-400 active:scale-[0.98] text-zinc-950 font-semibold px-3.5 py-1.5 rounded-md text-xs transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus class="w-3.5 h-3.5" />
                <span>{{ t('Generate API Key') }}</span>
              </button>
            </div>

            <!-- API Keys List -->
            <div class="space-y-2.5">
              <div v-if="apiKeys.length === 0" class="py-6 text-center text-xs text-zinc-500">
                {{ t('No active API keys found. Generate one above to connect your external bots.') }}
              </div>

              <div 
                v-for="k in apiKeys" 
                :key="k.id"
                :class="[
                  theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-200',
                  'p-3.5 rounded-md border flex flex-col sm:flex-row sm:items-center justify-between gap-3'
                ]"
              >
                <div>
                  <div class="flex items-center gap-2">
                    <span class="font-bold text-xs" :class="theme === 'dark' ? 'text-white' : 'text-slate-900'">{{ k.key_name }}</span>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">{{ t('Active') }}</span>
                  </div>
                  <div class="flex items-center gap-2 mt-1">
                    <code class="text-xs tnum px-2 py-0.5 rounded border break-all" :class="theme === 'dark' ? 'text-zinc-400 bg-zinc-900/80 border-zinc-800' : 'text-slate-600 bg-slate-100 border-slate-200'">
                      {{ k.api_key }}
                    </code>
                    <button 
                      @click="copySnippet(k.api_key)" 
                      :title="t('Copy Key')" 
                      class="inline-flex items-center justify-center w-8 h-8 sm:w-auto sm:h-auto sm:p-1 rounded-md transition-colors cursor-pointer shrink-0" :class="theme === 'dark' ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'"
                    >
                      <Copy class="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                    </button>
                  </div>
                  <p class="text-[10px] mt-1" :class="theme === 'dark' ? 'text-zinc-500' : 'text-slate-400'">Created on {{ formatDate(k.created_at) }}</p>
                </div>

                <div>
                  <button 
                    @click="promptRevokeApiKey(k)"
                    :class="[
                      theme === 'dark' 
                        ? 'bg-zinc-900 hover:bg-rose-950/60 text-zinc-400 hover:text-rose-400 border-zinc-800 hover:border-rose-900/60' 
                        : 'bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 border-slate-200',
                      'px-3 py-1.5 rounded-md border text-xs font-semibold transition-all active:scale-95 cursor-pointer'
                    ]"
                  >
                    {{ t('Revoke Key') }}
                  </button>
                </div>
              </div>
            </div>
            </div>
            </div>
          </div>

          <!-- 3. DEVELOPER API DOCS BANNER — title + button only, no collapse, no extra text -->
          <div 
            :class="[
              theme === 'dark' ? 'bg-zinc-900/70 border-zinc-800' : 'bg-white border-slate-200 shadow-sm',
              'border rounded-md p-5'
            ]"
          >
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h3 class="text-xs font-bold uppercase tracking-wider break-words" :class="theme === 'dark' ? 'text-white' : 'text-slate-900'">
                {{ t('Developer API Documentation') }}
              </h3>
              <a 
                href="/docs/api" 
                target="_blank"
                class="w-full sm:w-auto shrink-0 bg-emerald-500 hover:bg-emerald-400 hover:border-emerald-400 active:scale-[0.98] text-zinc-950 font-semibold px-4 py-2 rounded-md text-xs transition-all inline-flex items-center justify-center gap-2 shadow-sm cursor-pointer whitespace-nowrap"
              >
                <span>{{ t('Open API Docs (/docs/api)') }}</span>
                <ExternalLink class="w-3.5 h-3.5 shrink-0" />
              </a>
            </div>
          </div>

          <!-- 5. Infrastructure & Architecture Health — no collapse; each stack shows its own brand SVG logo -->
          <div 
            :class="[
              theme === 'dark' ? 'bg-zinc-900/70 border-zinc-800' : 'bg-white border-slate-200 shadow-sm',
              'border rounded-md p-5 space-y-3'
            ]"
          >
            <div class="flex items-center gap-2">
              <ShieldCheck class="w-4 h-4 text-emerald-500" />
              <h3 class="text-xs font-bold uppercase tracking-wider" :class="theme === 'dark' ? 'text-white' : 'text-slate-900'">
                {{ t('System & Infrastructure Health') }}
              </h3>
            </div>

            <!-- Brand-logo health grid -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs tnum">
              <div 
                :class="[
                  theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-200',
                  'p-3.5 rounded-md border flex items-center gap-3'
                ]"
              >
                <!-- Bun logo -->
                <svg viewBox="0 0 80 70" class="w-8 h-8 shrink-0" xmlns="http://www.w3.org/2000/svg" aria-label="Bun">
                  <ellipse cx="40" cy="36" rx="38" ry="30" fill="#FBF0DF" stroke="#0f172a" stroke-width="2.5"/>
                  <path d="M40 8c-3 6-9 9-15 10 5 4 11 4 15 2s10-2 15-2c-6-1-12-4-15-10z" fill="#F6DECE"/>
                  <circle cx="27" cy="38" r="4.5" fill="#0f172a"/>
                  <circle cx="53" cy="38" r="4.5" fill="#0f172a"/>
                  <circle cx="25.5" cy="36.5" r="1.5" fill="#fff"/>
                  <circle cx="51.5" cy="36.5" r="1.5" fill="#fff"/>
                  <ellipse cx="18" cy="45" rx="4" ry="2.5" fill="#FEBBD0"/>
                  <ellipse cx="62" cy="45" rx="4" ry="2.5" fill="#FEBBD0"/>
                  <path d="M35 46c1.5 2.5 8.5 2.5 10 0" fill="none" stroke="#0f172a" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <div class="min-w-0">
                  <span class="block text-[10px] uppercase font-sans font-semibold tracking-wider" :class="theme === 'dark' ? 'text-zinc-500' : 'text-slate-500'">{{ t('Runtime') }}</span>
                  <span class="font-bold text-sm" :class="theme === 'dark' ? 'text-emerald-400' : 'text-emerald-700'">Bun v1.3.14</span>
                </div>
              </div>

              <div 
                :class="[
                  theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-200',
                  'p-3.5 rounded-md border flex items-center gap-3'
                ]"
              >
                <!-- MySQL dolphin logo -->
                <svg viewBox="0 0 64 64" class="w-8 h-8 shrink-0" xmlns="http://www.w3.org/2000/svg" aria-label="MySQL">
                  <path d="M6 44c8 2 15-1 21-7 4-4 7-9 12-11 4-2 9-1 12 2-2 0-4 1-5 3 3 0 6 1 8 3-3 1-6 1-8 3 2 1 4 3 4 6-4-3-8-4-13-3-6 1-11 5-17 7-5 2-11 2-15-3z" fill="#00758F"/>
                  <path d="M6 44c4 5 10 5 15 3 2-1 4-2 6-3-5 1-10 1-14-2z" fill="#005E70"/>
                  <circle cx="46" cy="33" r="1.8" fill="#fff"/>
                  <path d="M8 47c-2 1-4 1-6 0 1-2 3-3 5-3z" fill="#F29111"/>
                </svg>
                <div class="min-w-0">
                  <span class="block text-[10px] uppercase font-sans font-semibold tracking-wider" :class="theme === 'dark' ? 'text-zinc-500' : 'text-slate-500'">{{ t('Database') }}</span>
                  <span class="font-bold text-sm" :class="theme === 'dark' ? 'text-emerald-400' : 'text-emerald-700'">MySQL 8.0</span>
                </div>
              </div>

              <div 
                :class="[
                  theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-200',
                  'p-3.5 rounded-md border flex items-center gap-3'
                ]"
              >
                <!-- Cloudflare cloud logo -->
                <svg viewBox="0 0 64 48" class="w-8 h-8 shrink-0" xmlns="http://www.w3.org/2000/svg" aria-label="Cloudflare">
                  <path d="M46 40H16c-6 0-11-5-11-11s5-11 11-11c1 0 2 0 3 .4C21 12 27 8 34 8c9 0 16 7 16 16v.5c5 .5 9 4.7 9 10 0 3-2 5.5-5 5.5z" fill="#F6821F"/>
                  <path d="M50 24.5V24c0-9-7-16-16-16-2 0-4 .3-6 1 6 1 11 6 12 13 0 1 1 2 2 2h13c-1-2-3-3-5-3.5z" fill="#FBAD41"/>
                </svg>
                <div class="min-w-0">
                  <span class="block text-[10px] uppercase font-sans font-semibold tracking-wider" :class="theme === 'dark' ? 'text-zinc-500' : 'text-slate-500'">{{ t('Ingress Tunnel') }}</span>
                  <span class="font-bold text-sm" :class="theme === 'dark' ? 'text-emerald-400' : 'text-emerald-700'">Cloudflare v2</span>
                </div>
              </div>

              <div 
                :class="[
                  theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-200',
                  'p-3.5 rounded-md border flex items-center gap-3'
                ]"
              >
                <!-- Linux/host server logo -->
                <svg viewBox="0 0 64 64" class="w-8 h-8 shrink-0" xmlns="http://www.w3.org/2000/svg" aria-label="Host">
                  <rect x="12" y="10" width="40" height="18" rx="3" fill="#334155"/>
                  <rect x="12" y="34" width="40" height="18" rx="3" fill="#334155"/>
                  <circle cx="20" cy="19" r="2.5" fill="#10b981"/>
                  <circle cx="20" cy="43" r="2.5" fill="#10b981"/>
                  <rect x="28" y="17" width="18" height="2.5" rx="1.25" fill="#64748b"/>
                  <rect x="28" y="41" width="18" height="2.5" rx="1.25" fill="#64748b"/>
                </svg>
                <div class="min-w-0">
                  <span class="block text-[10px] uppercase font-sans font-semibold tracking-wider" :class="theme === 'dark' ? 'text-zinc-500' : 'text-slate-500'">{{ t('Host Status') }}</span>
                  <span class="font-bold text-sm" :class="theme === 'dark' ? 'text-emerald-400' : 'text-emerald-700'">{{ t('Healthy (200 OK)') }}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      <!-- GLOBAL ORDER ENTRY OVERLAY (renders on any tab) -->
          <!-- ORDER ENTRY OVERLAY -->
          <Teleport to="body">
          <div v-if="showOrderEntry" @click.self="showOrderEntry = false" class="fixed inset-0 z-[70] bg-black/75 backdrop-blur-md flex items-start justify-center p-4 overflow-y-auto">
            <div :class="[theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200', 'border rounded-md w-full max-w-lg shadow-sm my-auto animate-in zoom-in-95 duration-150']">
              <div class="flex items-center justify-between p-4 border-b" :class="theme === 'dark' ? 'border-zinc-800' : 'border-slate-100'">
                <h3 class="text-sm font-bold" :class="theme === 'dark' ? 'text-white' : 'text-slate-900'">{{ t('Masukan Pesanan Hari Ini') }}</h3>
                <button type="button" @click="showOrderEntry = false" title="Close" class="modal-x">
                  <X class="w-4 h-4" />
                </button>
              </div>

              <form @submit.prevent="submitDailyStock" novalidate class="p-5 space-y-5">
                <!-- DETAIL BARANG (multi-item) -->
                <div class="space-y-3">
                  <div class="flex items-center justify-between">
                    <div class="text-[11px] font-bold uppercase tracking-wider" :class="theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'">{{ t('DETAIL BARANG') }}</div>
                    <span class="text-[10px] tnum" :class="theme === 'dark' ? 'text-zinc-500' : 'text-slate-500'">{{ stockForm.items.length }} item</span>
                  </div>

                  <div
                    v-for="(row, ri) in stockForm.items"
                    :key="ri"
                    class="rounded-md border p-3 space-y-3"
                    :class="theme === 'dark' ? 'border-zinc-800 bg-zinc-950/40' : 'border-slate-200 bg-slate-50/60'"
                  >
                    <div class="flex items-center justify-between">
                      <span class="text-[10px] font-bold uppercase tracking-wider" :class="theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'">{{ t('Item') }} {{ ri + 1 }}</span>
                      <button
                        v-if="stockForm.items.length > 1"
                        type="button"
                        @click="removeStockItem(ri)"
                        class="no-ancient text-rose-500 hover:text-rose-400 text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <X class="w-3 h-3" /> {{ t('Remove') }}
                      </button>
                    </div>

                    <div class="space-y-1">
                      <label class="text-xs font-semibold" :class="theme === 'dark' ? 'text-zinc-300' : 'text-slate-700'">{{ t('Catalog Item') }} <span class="text-rose-500">*</span></label>
                      <SmartSelect
                        v-model="row.item_id"
                        :theme="theme"
                        :invalid="!!(stockErrors.items[ri] && stockErrors.items[ri].item_id)"
                        :placeholder="t('-- Select Item (searchable) --')"
                        :options="catalogItemOptions"
                        @change="clearStockItemError(ri)"
                      />
                      <p v-if="stockErrors.items[ri] && stockErrors.items[ri].item_id" class="text-[11px] text-rose-500 font-medium mt-1">{{ stockErrors.items[ri].item_id }}</p>
                    </div>

                    <div class="space-y-1">
                      <label class="text-xs font-semibold capitalize" :class="theme === 'dark' ? 'text-zinc-300' : 'text-slate-700'">{{ t('jumlah dipesan') }} <span class="text-rose-500">*</span></label>
                      <input
                        type="number"
                        v-model.number="row.quantity"
                        min="1"
                        placeholder="0"
                        @input="clearStockItemError(ri)"
                        @keydown.up.prevent
                        @keydown.down.prevent
                        :class="[
                          (stockErrors.items[ri] && stockErrors.items[ri].quantity) ? 'border-rose-500' : (theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-slate-50 border-slate-300 text-slate-900'),
                          'w-full border rounded-md px-3 py-2 text-xs outline-none tnum transition-all hover:border-emerald-500/60'
                        ]"
                      />
                      <p v-if="stockErrors.items[ri] && stockErrors.items[ri].quantity" class="text-[11px] text-rose-500 font-medium mt-1">{{ stockErrors.items[ri].quantity }}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    @click="addStockItem"
                    class="no-ancient w-full border border-dashed rounded-md px-3 py-2 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    :class="theme === 'dark' ? 'border-zinc-700 text-zinc-300 hover:border-emerald-500/60 hover:text-emerald-400' : 'border-slate-300 text-slate-600 hover:border-emerald-500/60 hover:text-emerald-600'"
                  >
                    <Plus class="w-3.5 h-3.5" /> {{ t('Tambah Barang') }}
                  </button>

                  <div class="space-y-1">
                    <label class="text-xs font-semibold capitalize" :class="theme === 'dark' ? 'text-zinc-300' : 'text-slate-700'">{{ t('tanggal pesanan') }} <span class="text-rose-500">*</span></label>
                    <SmartDate v-model="stockForm.order_date" :theme="theme" @change="stockErrors.order_date = ''" />
                    <p v-if="stockErrors.order_date" class="text-[11px] text-rose-500 font-medium mt-1">{{ stockErrors.order_date }}</p>
                  </div>
                </div>

                <!-- DETAIL PEMBELI -->
                <div class="space-y-3 pt-1 border-t" :class="theme === 'dark' ? 'border-zinc-800' : 'border-slate-200'">
                  <div class="text-[11px] font-bold uppercase tracking-wider pt-3" :class="theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'">{{ t('DETAIL PEMBELI') }}</div>

                  <div class="space-y-1">
                    <label class="text-xs font-semibold capitalize" :class="theme === 'dark' ? 'text-zinc-300' : 'text-slate-700'">{{ t('nama pemesan') }} <span class="text-rose-500">*</span></label>
                    <input
                      type="text"
                      v-model="stockForm.buyer_name"
                      placeholder="e.g. Budi Santoso"
                      @input="stockErrors.buyer_name = ''"
                      :class="[
                        stockErrors.buyer_name ? 'border-rose-500' : (theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-slate-50 border-slate-300 text-slate-900'),
                        'w-full border rounded-md px-3 py-2 text-xs outline-none transition-all hover:border-emerald-500/60'
                      ]"
                    />
                    <p v-if="stockErrors.buyer_name" class="text-[11px] text-rose-500 font-medium mt-1">{{ stockErrors.buyer_name }}</p>
                  </div>

                  <div class="space-y-1">
                    <label class="text-xs font-semibold capitalize" :class="theme === 'dark' ? 'text-zinc-300' : 'text-slate-700'">{{ t('nomer telepon') }}</label>
                    <input
                      type="tel"
                      inputmode="numeric"
                      v-model="stockForm.buyer_phone"
                      placeholder="e.g. 628123456789"
                      @input="onOrderPhoneInput"
                      :class="[
                        theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-slate-50 border-slate-300 text-slate-900',
                        'w-full border rounded-md px-3 py-2 text-xs outline-none tnum transition-all hover:border-emerald-500/60'
                      ]"
                    />
                    <p v-if="stockErrors.buyer_phone" class="text-[11px] text-rose-500 font-medium mt-1">{{ stockErrors.buyer_phone }}</p>
                  </div>
                </div>

                <div class="flex items-center justify-end gap-2 pt-1">
                  <button type="button" @click="showOrderEntry = false" class="no-ancient px-4 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer" :class="theme === 'dark' ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'">
                    {{ t('Cancel') }}
                  </button>
                  <button type="submit" class="no-ancient bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 rounded-md text-xs transition-colors flex items-center gap-1.5 cursor-pointer">
                    <PackageCheck class="w-3.5 h-3.5" />
                    <span>{{ t('Save Order') }}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
          </Teleport>

      <!-- GLOBAL FOOTER -->
      <footer class="mt-10 pt-5 pb-6 border-t text-center" :class="theme === 'dark' ? 'border-zinc-800 text-zinc-500' : 'border-slate-200 text-slate-400'">
        <p class="text-[11px] tracking-wide">{{ t('All Rights Reserved &copy; 2026 - SkyUniverse Technology') }}</p>
      </footer>

      <!-- GLOBAL TOAST STACK (replaces browser alert) -->
      <div class="fixed bottom-5 right-5 z-[80] flex flex-col gap-2 max-w-sm w-[calc(100%-2.5rem)] sm:w-auto pointer-events-none">
        <div
          v-for="t in toasts"
          :key="t.id"
          :class="[
            'pointer-events-auto flex items-start gap-2.5 px-4 py-3 rounded-md shadow-sm border backdrop-blur-md animate-in slide-in-from-right-5 fade-in duration-200',
            t.type === 'success'
              ? (theme === 'dark' ? 'bg-emerald-950/90 border-emerald-700/60 text-emerald-200' : 'bg-emerald-50 border-emerald-300 text-emerald-800')
              : t.type === 'error'
                ? (theme === 'dark' ? 'bg-rose-950/90 border-rose-700/60 text-rose-200' : 'bg-rose-50 border-rose-300 text-rose-800')
                : (theme === 'dark' ? 'bg-zinc-900/95 border-zinc-700 text-zinc-200' : 'bg-white border-slate-300 text-slate-800')
          ]"
        >
          <CheckCircle2 v-if="t.type === 'success'" class="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
          <AlertTriangle v-else-if="t.type === 'error'" class="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
          <Bell v-else class="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
          <span class="text-xs font-medium flex-1 leading-relaxed">{{ t.message }}</span>
          <button @click="dismissToast(t.id)" class="shrink-0 opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
            <X class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <!-- GLOBAL CONFIRM OVERLAY (replaces browser confirm) -->
      <div v-if="confirmState.open" @click.self="resolveConfirm(false)" class="fixed inset-0 z-[80] bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
        <div :class="[theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200', 'border rounded-md p-6 max-w-sm w-full shadow-sm space-y-4 animate-in zoom-in-95 duration-150']">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-md flex items-center justify-center shrink-0" :class="confirmState.danger ? 'bg-rose-500/15 text-rose-500' : 'bg-emerald-500/15 text-emerald-500'">
              <AlertTriangle class="w-5 h-5" />
            </div>
            <h3 class="text-sm font-bold" :class="theme === 'dark' ? 'text-white' : 'text-slate-900'">{{ confirmState.title }}</h3>
          </div>
          <p class="text-xs leading-relaxed" :class="theme === 'dark' ? 'text-zinc-300' : 'text-slate-600'">{{ confirmState.message }}</p>
          <div class="flex gap-2">
            <button @click="resolveConfirm(false)" :class="[theme === 'dark' ? 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200', 'flex-1 rounded-md px-4 py-2 text-xs font-semibold transition-colors cursor-pointer']">
              {{ t('Batal') }}
            </button>
            <button @click="resolveConfirm(true)" :class="[confirmState.danger ? 'bg-rose-500 hover:bg-rose-600' : 'bg-emerald-500 hover:bg-emerald-600', 'flex-1 rounded-md px-4 py-2 text-xs font-semibold text-white transition-colors cursor-pointer']">
              {{ t('Ya, Lanjutkan') }}
            </button>
          </div>
        </div>
      </div>

      <!-- 3. WEB POPUP & OVERLAYS -->

      <!-- MODAL: CONFIRM REMOVE WHITELIST -->
      <div v-if="whitelistToRemove" @click.self="whitelistToRemove = null" class="fixed inset-0 z-[60] bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
        <div :class="[theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200', 'border rounded-md p-6 max-w-sm w-full shadow-sm space-y-4 animate-in zoom-in-95 duration-150']">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-md flex items-center justify-center shrink-0 bg-rose-500/15 text-rose-500">
              <AlertTriangle class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-sm font-bold" :class="theme === 'dark' ? 'text-white' : 'text-slate-900'">{{ t('Hapus Nomor Whitelist?') }}</h3>
              <p class="text-[11px]" :class="theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'">{{ t('Tindakan ini akan mencabut akses bot.') }}</p>
            </div>
          </div>
          <div :class="[theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-emerald-400' : 'bg-slate-50 border-slate-200 text-emerald-700', 'border rounded-md px-3 py-2 text-xs tnum break-all']">
            {{ whitelistToRemove }}
          </div>
          <div class="flex gap-2">
            <button @click="whitelistToRemove = null" :class="[theme === 'dark' ? 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200', 'flex-1 rounded-md px-4 py-2 text-xs font-semibold transition-colors cursor-pointer']">
              {{ t('Batal') }}
            </button>
            <button @click="removeWhitelistNumber(whitelistToRemove)" class="flex-1 rounded-md px-4 py-2 text-xs font-semibold bg-rose-500 text-white hover:bg-rose-600 transition-colors cursor-pointer">
              {{ t('Ya, Hapus') }}
            </button>
          </div>
        </div>
      </div>


      <!-- MODAL: SCAN RECEIPT (OpEx) -->
      <div v-if="showReceiptScan" @click.self="showReceiptScan = false" class="fixed inset-0 z-[70] bg-black/75 backdrop-blur-md flex items-start justify-center p-4 overflow-y-auto">
        <div :class="[theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200', 'border rounded-md w-full max-w-2xl shadow-sm my-auto animate-in zoom-in-95 duration-150']">
          <div class="flex items-center justify-between p-4 border-b" :class="theme === 'dark' ? 'border-zinc-800' : 'border-slate-100'">
            <div class="flex items-center gap-2">
              <ScanLine class="w-4 h-4 text-emerald-500" />
              <h3 class="text-sm font-bold" :class="theme === 'dark' ? 'text-white' : 'text-slate-900'">{{ t('Scan Receipt') }}</h3>
            </div>
            <button type="button" @click="showReceiptScan = false" title="Close" class="modal-x">
              <X class="w-4 h-4" />
            </button>
          </div>

          <div class="p-4 space-y-4">
            <p class="text-xs" :class="theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'">
              {{ t('Upload or snap a photo of a supermarket, minimarket, traditional market, or handwritten receipt. Items are read automatically — review, edit, then save as OpEx.') }}
            </p>

            <!-- Upload / capture — separate gallery vs camera so mobile can pick either -->
            <input ref="scanFileInput" type="file" accept="image/png,image/jpeg,image/jpg,image/webp" class="hidden" @change="onReceiptFile" />
            <input ref="scanCameraInput" type="file" accept="image/png,image/jpeg,image/jpg,image/webp" capture="environment" class="hidden" @change="onReceiptFile" />
            <div class="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                @click="scanFileInput?.click()"
                :disabled="scanning"
                class="no-ancient flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-4 py-2.5 rounded-md text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
              >
                <ImageIcon class="w-4 h-4" />
                <span>{{ scanning ? 'Scanning…' : (scanItems.length ? 'Pilih foto lain' : 'Pilih dari Galeri') }}</span>
              </button>
              <button
                type="button"
                @click="scanCameraInput?.click()"
                :disabled="scanning"
                :class="[
                  theme === 'dark' ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border-zinc-700' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300',
                  'no-ancient flex-1 font-semibold px-4 py-2.5 rounded-md text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60 border'
                ]"
              >
                <ScanLine class="w-4 h-4" />
                <span>Ambil Foto</span>
              </button>
            </div>

            <div v-if="scanning" class="text-center text-xs text-emerald-500 py-4 animate-pulse">{{ t('Reading receipt, please wait…') }}</div>

            <!-- Extracted items (editable) -->
            <div v-if="scanItems.length" class="space-y-3">
              <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
                <label class="text-[11px] font-semibold" :class="theme === 'dark' ? 'text-zinc-300' : 'text-slate-700'">{{ t('Expense Date') }}</label>
                <SmartDate v-model="scanDate" :theme="theme" width-class="w-full sm:w-52" />
              </div>

              <div class="space-y-2 max-h-72 overflow-y-auto pr-1">
                <div
                  v-for="(it, i) in scanItems"
                  :key="i"
                  :class="[theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-200', 'border rounded-md p-2.5 grid grid-cols-12 gap-2 items-center']"
                >
                  <input v-model="it.item_name" :placeholder="t('Item')" :class="[theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-slate-300 text-slate-900', 'col-span-12 sm:col-span-5 border rounded-md px-2 py-1.5 text-xs outline-none']" />
                  <input v-model.number="it.price_paid" type="number" min="0" placeholder="Rp" :class="[theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-slate-300 text-slate-900', 'col-span-5 sm:col-span-3 border rounded-md px-2 py-1.5 text-xs outline-none no-spin']" />
                  <input v-model.number="it.quantity" type="number" min="1" :placeholder="t('Qty')" :class="[theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-slate-300 text-slate-900', 'col-span-3 sm:col-span-2 border rounded-md px-2 py-1.5 text-xs outline-none no-spin']" />
                  <div class="col-span-3 sm:col-span-1">
                    <SmartSelect v-model="it.measurement" :theme="theme" :options="unitOptions" :searchable="false" width-class="w-full" />
                  </div>
                  <button type="button" @click="removeScanItem(i)" class="no-ancient col-span-1 flex justify-center text-rose-500 hover:text-rose-400 cursor-pointer">
                    <X class="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div class="flex items-center justify-between pt-2 border-t text-xs" :class="theme === 'dark' ? 'border-zinc-800' : 'border-slate-100'">
                <span class="text-zinc-400">{{ t('Total') }}</span>
                <span class="tnum font-bold text-rose-500">{{ formatCurrency(scanTotal) }}</span>
              </div>

              <button
                type="button"
                @click="saveScannedOpEx"
                :disabled="scanSaving"
                class="no-ancient w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-4 py-2.5 rounded-md text-xs transition-colors cursor-pointer disabled:opacity-60"
              >
                {{ scanSaving ? 'Saving…' : `Save ${scanItems.length} item(s) to OpEx` }}
              </button>
            </div>
          </div>
        </div>
      </div>


      <!-- MODAL: USER APPEARANCE (profile picture, display name, change password) -->
      <div v-if="showAppearanceModal" @click.self="showAppearanceModal = false" class="fixed inset-0 z-[70] bg-black/75 backdrop-blur-md flex items-start justify-center p-4 overflow-y-auto">
        <div :class="[theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200', 'border rounded-md w-full max-w-md shadow-sm my-auto animate-in zoom-in-95 duration-150']">
          <div class="flex items-center justify-between px-5 py-4 border-b" :class="theme === 'dark' ? 'border-zinc-800' : 'border-slate-100'">
            <h3 class="text-sm font-bold flex items-center gap-2" :class="theme === 'dark' ? 'text-white' : 'text-slate-900'">
              <UserCog class="w-4 h-4 text-emerald-500" />
              <span>{{ t('User Appearance') }}</span>
            </h3>
            <button type="button" @click="showAppearanceModal = false" title="Close" class="modal-x">
              <X class="w-4 h-4" />
            </button>
          </div>

          <div class="p-5 space-y-5">
            <!-- Profile picture + display name -->
            <div class="space-y-4">
              <div class="flex items-center gap-4">
                <div class="w-16 h-16 rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-emerald-500/15 ring-2" :class="theme === 'dark' ? 'ring-zinc-800' : 'ring-slate-200'">
                  <img v-if="appearanceForm.avatar_url" :src="appearanceForm.avatar_url" alt="Avatar" class="w-full h-full object-cover" />
                  <span v-else class="text-lg font-bold text-emerald-500 uppercase">{{ userInitials }}</span>
                </div>
                <div class="flex-1">
                  <input ref="avatarInput" type="file" accept="image/png,image/jpeg,image/jpg" class="hidden" @change="uploadAvatar" />
                  <button @click="($refs.avatarInput as HTMLInputElement).click()" :class="[theme === 'dark' ? 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700 border-zinc-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300', 'border rounded-md px-3 py-2 text-xs font-medium transition-colors cursor-pointer flex items-center gap-2']">
                    <Upload class="w-3.5 h-3.5" />
                    <span>{{ t('Change Profile Picture') }}</span>
                  </button>
                  <p class="text-[10px] text-zinc-500 mt-1.5">{{ t('JPG, JPEG or PNG. Max 1MB.') }}</p>
                </div>
              </div>

              <div class="space-y-1">
                <label class="text-xs font-semibold" :class="theme === 'dark' ? 'text-zinc-300' : 'text-slate-700'">{{ t('Display Name') }}</label>
                <input
                  type="text"
                  v-model="appearanceForm.display_name"
                  placeholder="e.g. Budi Santoso"
                  :class="[theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-slate-50 border-slate-300 text-slate-900', 'w-full border rounded-md px-3 py-2 text-xs outline-none transition-all hover:border-emerald-500/60']"
                />
                <p class="text-[10px] text-zinc-500">Shown instead of your username ({{ currentUser?.username }}).</p>
              </div>

              <button @click="saveProfile" :disabled="!isProfileDirty || appearanceSaving" :class="[isProfileDirty && !appearanceSaving ? 'bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer' : 'bg-zinc-700 text-zinc-400 cursor-not-allowed', 'w-full font-semibold px-4 py-2 rounded-md text-xs transition-colors']">
                {{ appearanceSaving ? 'Saving...' : 'Save Profile' }}
              </button>
              <p v-if="appearanceMsg" class="text-[11px] text-center" :class="appearanceMsg.includes('fail') || appearanceMsg.includes('Fail') ? 'text-rose-500' : 'text-emerald-500'">{{ appearanceMsg }}</p>
            </div>

            <!-- Change password -->
            <div class="pt-4 border-t space-y-3" :class="theme === 'dark' ? 'border-zinc-800' : 'border-slate-100'">
              <h4 class="text-xs font-bold uppercase tracking-wider" :class="theme === 'dark' ? 'text-zinc-300' : 'text-slate-700'">{{ t('Change Password') }}</h4>

              <div class="space-y-1">
                <label class="text-[11px] font-medium" :class="theme === 'dark' ? 'text-zinc-400' : 'text-slate-600'">{{ t('Current Password') }}</label>
                <input type="password" v-model="pwForm.current_password" autocomplete="current-password" :class="[theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-slate-50 border-slate-300 text-slate-900', 'w-full border rounded-md px-3 py-2 text-xs outline-none transition-all hover:border-emerald-500/60']" />
              </div>
              <div class="space-y-1">
                <label class="text-[11px] font-medium" :class="theme === 'dark' ? 'text-zinc-400' : 'text-slate-600'">{{ t('New Password') }}</label>
                <input type="password" v-model="pwForm.new_password" autocomplete="new-password" :class="[theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-slate-50 border-slate-300 text-slate-900', 'w-full border rounded-md px-3 py-2 text-xs outline-none transition-all hover:border-emerald-500/60']" />
              </div>
              <div class="space-y-1">
                <label class="text-[11px] font-medium" :class="theme === 'dark' ? 'text-zinc-400' : 'text-slate-600'">{{ t('Confirm New Password') }}</label>
                <input type="password" v-model="pwForm.confirm_password" autocomplete="new-password" :class="[pwForm.confirm_password && !pwMatch ? 'border-rose-500' : (theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-slate-50 border-slate-300 text-slate-900'), 'w-full border rounded-md px-3 py-2 text-xs outline-none transition-all hover:border-emerald-500/60']" />
                <p v-if="pwForm.confirm_password && !pwMatch" class="text-[10px] text-rose-500">{{ t('Passwords do not match.') }}</p>
              </div>

              <!-- Live password requirement checklist -->
              <div v-if="pwForm.new_password.length > 0" class="grid grid-cols-2 gap-x-3 gap-y-1 pt-1">
                <div v-for="req in [
                  { ok: pwChecks.length, label: 'Min. 8 characters' },
                  { ok: pwChecks.upper, label: '1 uppercase (A-Z)' },
                  { ok: pwChecks.lower, label: '1 lowercase (a-z)' },
                  { ok: pwChecks.number, label: '1 number (0-9)' },
                  { ok: pwChecks.special, label: '1 special (!@#...)' },
                ]" :key="req.label" class="flex items-center gap-1.5 text-[10px]" :class="req.ok ? 'text-emerald-500' : 'text-zinc-500'">
                  <CheckCircle2 v-if="req.ok" class="w-3 h-3 shrink-0" />
                  <X v-else class="w-3 h-3 shrink-0 opacity-50" />
                  <span>{{ req.label }}</span>
                </div>
              </div>

              <button @click="changePassword" :disabled="!canChangePassword || pwSaving" :class="[canChangePassword && !pwSaving ? 'bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer' : 'bg-zinc-700 text-zinc-400 cursor-not-allowed', 'w-full font-semibold px-4 py-2 rounded-md text-xs transition-colors']">
                {{ pwSaving ? 'Changing...' : 'Change Password' }}
              </button>
              <p v-if="pwError" class="text-[11px] text-rose-500 text-center flex items-center justify-center gap-1"><AlertTriangle class="w-3 h-3" />{{ pwError }}</p>
              <p v-if="pwSuccess" class="text-[11px] text-emerald-500 text-center flex items-center justify-center gap-1"><CheckCircle2 class="w-3 h-3" />{{ pwSuccess }}</p>
            </div>

            <!-- Kelola Tab & Tampilan (moved here from System tab; available to every user) -->
            <div class="pt-4 border-t space-y-4" :class="theme === 'dark' ? 'border-zinc-800' : 'border-slate-100'">
              <div>
                <h4 class="text-xs font-bold uppercase tracking-wider" :class="theme === 'dark' ? 'text-zinc-300' : 'text-slate-700'">{{ t('Kelola Tab & Tampilan') }}</h4>
                <p class="text-[11px] mt-0.5" :class="theme === 'dark' ? 'text-zinc-500' : 'text-slate-500'">{{ t('Atur urutan menu dan ukuran tampilan agar nyaman dibaca.') }}</p>
              </div>

              <!-- Reorder tabs -->
              <div class="space-y-2">
                <label class="text-[11px] font-semibold uppercase tracking-wide" :class="theme === 'dark' ? 'text-zinc-400' : 'text-slate-600'">{{ t('Urutan Menu') }}</label>
                <div class="space-y-1.5">
                  <div
                    v-for="(tab, idx) in tabs"
                    :key="tab.id"
                    :class="[
                      theme === 'dark' ? 'bg-zinc-950/60 border-zinc-800' : 'bg-slate-50 border-slate-200',
                      'flex items-center justify-between gap-2 border rounded-md px-3 py-2'
                    ]"
                  >
                    <div class="flex items-center gap-2.5 min-w-0">
                      <span class="tnum text-[11px] w-5 text-center shrink-0" :class="theme === 'dark' ? 'text-zinc-500' : 'text-slate-400'">{{ idx + 1 }}</span>
                      <component :is="tab.icon" class="w-4 h-4 shrink-0 text-emerald-500" />
                      <span class="text-sm font-medium truncate" :class="theme === 'dark' ? 'text-white' : 'text-slate-900'">{{ t(tab.label) }}</span>
                    </div>
                    <div class="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        @click="moveTab(tab.id, -1)"
                        :disabled="idx === 0"
                        :title="t('Naik')"
                        :class="[
                          idx === 0 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:border-emerald-500/50',
                          theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-white border-slate-200 text-slate-700',
                          'p-1.5 rounded-md border transition-all'
                        ]"
                      >
                        <ChevronUp class="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        @click="moveTab(tab.id, 1)"
                        :disabled="idx === tabs.length - 1"
                        :title="t('Turun')"
                        :class="[
                          idx === tabs.length - 1 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:border-emerald-500/50',
                          theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-white border-slate-200 text-slate-700',
                          'p-1.5 rounded-md border transition-all'
                        ]"
                      >
                        <ChevronDown class="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  @click="resetTabOrder"
                  class="no-ancient text-[11px] font-medium text-emerald-500 hover:text-emerald-400 cursor-pointer"
                >
                  {{ t('Reset') }}
                </button>
              </div>

              <!-- Display size -->
              <div class="space-y-2">
                <label class="text-[11px] font-semibold uppercase tracking-wide" :class="theme === 'dark' ? 'text-zinc-400' : 'text-slate-600'">{{ t('Ukuran Tampilan') }}</label>
                <div class="inline-flex w-full rounded-md p-1 gap-1" :class="theme === 'dark' ? 'bg-zinc-950 border border-zinc-800' : 'bg-slate-100 border border-slate-200'">
                  <button
                    v-for="opt in [{v:'sm',l:'Kecil'},{v:'md',l:'Normal'},{v:'lg',l:'Besar'}]"
                    :key="opt.v"
                    @click="setUiScale(opt.v as any)"
                    :class="[
                      'flex-1 justify-center px-4 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer',
                      uiScale === opt.v
                        ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                        : (theme === 'dark' ? 'text-zinc-400 hover:text-white' : 'text-slate-600 hover:text-slate-900')
                    ]"
                  >
                    {{ t(opt.l) }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      <!-- MODAL: EDIT USER (admin) -->
      <Teleport to="body">
      <div v-if="showEditUserModal" @click.self="showEditUserModal = false" class="fixed inset-0 z-[75] bg-black/75 backdrop-blur-md flex items-start justify-center p-4 overflow-y-auto">
        <div :class="[theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200', 'border rounded-md w-full max-w-md shadow-sm my-auto']">
          <div class="flex items-center justify-between px-5 py-4 border-b" :class="theme === 'dark' ? 'border-zinc-800' : 'border-slate-100'">
            <h3 class="text-sm font-bold flex items-center gap-2" :class="theme === 'dark' ? 'text-white' : 'text-slate-900'">
              <Pencil class="w-4 h-4 text-sky-500" />
              <span>{{ t('Edit User') }}</span>
            </h3>
            <button type="button" @click="showEditUserModal = false" title="Close" class="modal-x"><X class="w-4 h-4" /></button>
          </div>
          <div class="p-5 space-y-4">
            <div class="space-y-1">
              <label class="text-xs font-semibold" :class="theme === 'dark' ? 'text-zinc-300' : 'text-slate-700'">{{ t('Nama') }}</label>
              <input v-model="editUser.username" type="text" :class="[theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-slate-50 border-slate-300 text-slate-900', 'w-full border rounded-md px-3 py-2 text-sm outline-none transition-all hover:border-emerald-500/60']" />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-semibold" :class="theme === 'dark' ? 'text-zinc-300' : 'text-slate-700'">{{ t('Role') }}</label>
              <select v-model="editUser.role" :class="[theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-slate-50 border-slate-300 text-slate-900', 'w-full border rounded-md px-3 py-2 text-sm outline-none cursor-pointer']">
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div class="space-y-1">
              <label class="text-xs font-semibold" :class="theme === 'dark' ? 'text-zinc-300' : 'text-slate-700'">{{ t('Password Baru') }} <span class="font-normal text-zinc-500">({{ t('kosongkan jika tidak diubah') }})</span></label>
              <input v-model="editUser.password" type="password" placeholder="••••••••" :class="[theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-slate-50 border-slate-300 text-slate-900', 'w-full border rounded-md px-3 py-2 text-sm outline-none transition-all hover:border-emerald-500/60']" />
            </div>
            <p v-if="editUserMsg" class="text-xs font-medium" :class="editUserOk ? 'text-emerald-500' : 'text-rose-500'">{{ editUserMsg }}</p>
            <div class="flex gap-2 pt-1">
              <button type="button" @click="showEditUserModal = false" :class="[theme === 'dark' ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700', 'flex-1 py-2 rounded-md text-sm font-semibold transition-colors cursor-pointer']">{{ t('Batal') }}</button>
              <button type="button" @click="saveEditUser" :disabled="!editUser.username.trim() || editUserSaving" :class="[(!editUser.username.trim() || editUserSaving) ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer', 'flex-1 py-2 rounded-md text-sm font-semibold transition-colors']">{{ editUserSaving ? t('Menyimpan…') : t('Simpan') }}</button>
            </div>
          </div>
        </div>
      </div>
      </Teleport>

      <!-- MODAL: CREATE API KEY -->
      <div v-if="showCreateApiKeyModal" class="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
        <div class="bg-zinc-900 border border-zinc-800 rounded-md p-6 max-w-sm w-full shadow-sm space-y-4 animate-in zoom-in-95 duration-150">
          <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <Key class="w-4 h-4 text-emerald-400" />
              <span>{{ t('Generate Bot API Key') }}</span>
            </h3>
            <button type="button" @click="showCreateApiKeyModal = false" title="Close" class="modal-x">
              <X class="w-4 h-4" />
            </button>
          </div>

          <form @submit.prevent="generateApiKey" novalidate class="space-y-3 text-xs">
            <div class="space-y-1">
              <label class="block font-medium text-zinc-300">{{ t('Key Name / Description') }}</label>
              <input 
                type="text" 
                v-model="newKeyName" 
                placeholder="e.g. Telegram POS Bot, WhatsApp Bot" 
                class="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-md px-3 py-2 text-xs text-zinc-100 outline-none hover:border-emerald-500/60"
              />
            </div>
            <div class="flex gap-2 pt-2">
              <button 
                type="button" 
                @click="showCreateApiKeyModal = false"
                class="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer"
              >
                {{ t('Cancel') }}
              </button>
              <button 
                type="submit" 
                class="flex-1 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold py-2 rounded-md text-xs transition-colors cursor-pointer"
              >
                {{ t('Generate') }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- UNSAVED BUSINESS INFORMATION WARNING MODAL -->
      <div v-if="unsavedModal.isOpen" class="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
        <div 
          :class="[
            theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200 shadow-sm',
            'border rounded-md p-6 max-w-sm w-full space-y-4 animate-in zoom-in-95 duration-150'
          ]"
        >
          <div class="flex items-start gap-3">
            <div class="p-2 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
              <AlertTriangle class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-sm font-bold" :class="theme === 'dark' ? 'text-white' : 'text-slate-900'">
                {{ t('Unsaved Changes') }}
              </h3>
              <p class="text-xs text-zinc-400 mt-1 leading-relaxed">
                {{ t('Your Edit is not save yet, are you sure want unsave?') }}
              </p>
            </div>
          </div>

          <div class="flex gap-2.5 pt-2">
            <button 
              type="button" 
              @click="discardAndNavigate"
              class="flex-1 bg-zinc-600 hover:bg-zinc-500 text-white py-2 rounded-md text-xs font-semibold transition-all cursor-pointer shadow-sm"
            >
              {{ t('Yes, Discard Changes') }}
            </button>
            <button 
              type="button" 
              @click="saveAndStay"
              class="flex-1 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 py-2 rounded-md text-xs font-bold transition-all shadow-sm shadow-emerald-500/20 cursor-pointer"
            >
              {{ t('No, Save it') }}
            </button>
          </div>
        </div>
      </div>

      <!-- CONFIRMATION MODAL & OVERLAY -->
      <div v-if="confirmDialog.isOpen" class="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
        <div class="bg-zinc-900 border border-zinc-800 rounded-md p-6 max-w-sm w-full shadow-sm space-y-4 animate-in zoom-in-95 duration-150">
          <div class="flex items-start gap-3">
            <div class="p-2 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0">
              <AlertTriangle class="w-4 h-4" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-white">{{ confirmDialog.title }}</h3>
              <p class="text-xs text-zinc-400 mt-1 leading-relaxed">{{ confirmDialog.message }}</p>
            </div>
          </div>

          <div class="flex gap-2.5 pt-2">
            <button 
              type="button" 
              @click="closeConfirmDialog"
              class="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer"
            >
              {{ t('Cancel') }}
            </button>
            <button 
              type="button" 
              @click="executeConfirmDialog"
              class="flex-1 bg-rose-600 hover:bg-rose-500 text-white py-2 rounded-md text-xs font-semibold transition-colors shadow-sm shadow-rose-950/50 cursor-pointer"
            >
              {{ t('Confirm Remove') }}
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL: CREATE NEW GROUP POPUP -->
      <div v-if="newGroupModal.isOpen" class="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
        <div class="bg-zinc-900 border border-zinc-800 rounded-md p-6 max-w-sm w-full shadow-sm space-y-4 animate-in zoom-in-95 duration-150">
          <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <Folder class="w-4 h-4 text-emerald-400" />
              <span>{{ t('Assign New Group Type') }}</span>
            </h3>
            <button type="button" @click="newGroupModal.isOpen = false" title="Close" class="modal-x">
              <X class="w-4 h-4" />
            </button>
          </div>

          <div class="space-y-3 text-xs">
            <p class="text-zinc-400">{{ t('Enter a new group name for SKU') }} <b class="text-white">"{{ newGroupModal.targetItem?.name }}"</b>:</p>
            <input 
              type="text" 
              v-model="newGroupModal.groupName" 
              placeholder="e.g. Makanan, Minuman, Snack"
              class="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-md px-3 py-2 text-xs text-zinc-100 outline-none hover:border-emerald-500/60"
            />
            <div class="flex gap-2 pt-2">
              <button 
                type="button" 
                @click="newGroupModal.isOpen = false"
                class="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer"
              >
                {{ t('Cancel') }}
              </button>
              <button 
                type="button" 
                @click="submitNewGroupForTableItem"
                class="flex-1 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold py-2 rounded-md text-xs transition-colors cursor-pointer"
              >
                {{ t('Apply Group') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- MODAL: EDIT MASTER ITEM -->
      <div v-if="editingItem" class="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
        <div class="bg-zinc-900 border border-zinc-800 rounded-md p-6 max-w-sm w-full shadow-sm space-y-4 animate-in zoom-in-95 duration-150">
          <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <Pencil class="w-4 h-4 text-emerald-400" />
              <span>{{ t('Edit Master Item') }}</span>
            </h3>
            <button type="button" @click="editingItem = null" title="Close" class="modal-x">
              <X class="w-4 h-4" />
            </button>
          </div>

          <form @submit.prevent="updateItem" novalidate class="space-y-3 text-xs">
            <div class="space-y-1">
              <label class="block font-medium text-zinc-300">{{ t('Product Name') }}</label>
              <input 
                type="text" 
                v-model="editItemForm.name" 
                class="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-xs text-zinc-100 outline-none hover:border-emerald-500/60"
              />
            </div>

            <div class="space-y-1">
              <label class="block font-medium text-zinc-300">{{ t('Group / Category') }}</label>
              <SmartSelect
                v-model="editItemForm.group_select"
                :theme="theme"
                :placeholder="t('No Group')"
                :options="[{ value: '', label: 'No Group' }, ...existingGroups.map(g => ({ value: g, label: g })), { value: '__CUSTOM__', label: '+ New Group...' }]"
              />
              <input 
                v-if="editItemForm.group_select === '__CUSTOM__'"
                type="text" 
                v-model="editItemForm.custom_group" 
                :placeholder="t('Enter custom group name')"
                class="w-full mt-1 bg-zinc-950 border border-emerald-500/50 rounded-md px-3 py-1.5 text-xs text-zinc-100 outline-none"
              />
            </div>

            <div class="space-y-1">
              <label class="block font-medium text-zinc-300">{{ t('Selling Price (Rp)') }}</label>
              <input 
                type="number" 
                v-model.number="editItemForm.current_price" 
                min="0" 
                @keydown.up.prevent
                @keydown.down.prevent
                class="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-xs text-zinc-100 outline-none tnum hover:border-emerald-500/60"
              />
              <p class="text-[10px] text-zinc-500">{{ t('Price changes apply only to future operations.') }}</p>
            </div>

            <div class="flex gap-2 pt-2">
              <button 
                type="button" 
                @click="editingItem = null"
                class="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer"
              >
                {{ t('Cancel') }}
              </button>
              <button 
                type="submit" 
                class="flex-1 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold py-2 rounded-md text-xs transition-colors cursor-pointer"
              >
                {{ t('Save Changes') }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- MODAL: EDIT OPEX RECORD -->
      <div v-if="editingOpEx" class="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
        <div class="bg-zinc-900 border border-zinc-800 rounded-md p-6 max-w-md w-full shadow-sm space-y-4 animate-in zoom-in-95 duration-150">
          <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <Pencil class="w-4 h-4 text-emerald-400" />
              <span>{{ t('Edit OpEx Record') }}</span>
            </h3>
            <button type="button" @click="editingOpEx = null" title="Close" class="modal-x">
              <X class="w-4 h-4" />
            </button>
          </div>

          <form @submit.prevent="updateOpEx" novalidate class="space-y-3 text-xs">
            <div class="space-y-1">
              <label class="block font-medium text-zinc-300">{{ t('Expense Item Name') }}</label>
              <input 
                type="text" 
                v-model="editOpExForm.item_name" 
                class="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-xs text-zinc-100 outline-none hover:border-emerald-500/60"
              />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1">
                <label class="block font-medium text-zinc-300">{{ t('Total Cost (Rp)') }}</label>
                <input 
                  type="number" 
                  v-model.number="editOpExForm.price_paid" 
                  min="0" 
                  @keydown.up.prevent
                  @keydown.down.prevent
                  class="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-xs text-zinc-100 outline-none tnum hover:border-emerald-500/60"
                />
              </div>
              <div class="space-y-1">
                <label class="block font-medium text-zinc-300">{{ t('Quantity') }}</label>
                <input 
                  type="number" 
                  v-model.number="editOpExForm.quantity" 
                  min="0.01" 
                  step="any" 
                  @keydown.up.prevent
                  @keydown.down.prevent
                  class="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-xs text-zinc-100 outline-none tnum hover:border-emerald-500/60"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1">
                <label class="block font-medium text-zinc-300">{{ t('Measurement Unit') }}</label>
                <SmartSelect
                  v-model="editOpExForm.measurement"
                  :theme="theme"
                  :searchable="false"
                  :options="[{value:'Box',label:'Box'},{value:'Pcs',label:'Pcs'},{value:'Kilo',label:'Kilo'},{value:'Litre',label:'Litre'},{value:'Sachet',label:'Sachet'}]"
                />
              </div>
              <div class="space-y-1">
                <label class="block font-medium text-zinc-300">{{ t('Expense Date') }}</label>
                <SmartDate v-model="editOpExForm.expense_date" :theme="theme" width-class="w-full" />
              </div>
            </div>

            <div class="flex gap-2 pt-2">
              <button 
                type="button" 
                @click="editingOpEx = null"
                class="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer"
              >
                {{ t('Cancel') }}
              </button>
              <button 
                type="submit" 
                class="flex-1 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold py-2 rounded-md text-xs transition-colors cursor-pointer"
              >
                {{ t('Save OpEx') }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- MODAL: EDIT DAILY OPS TRANSACTION -->
      <div v-if="editingDailyRecord" class="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
        <div class="bg-zinc-900 border border-zinc-800 rounded-md p-6 max-w-md w-full shadow-sm space-y-4 animate-in zoom-in-95 duration-150">
          <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <Pencil class="w-4 h-4 text-emerald-400" />
              <span>{{ t('Edit Shift Transaction') }}</span>
            </h3>
            <button type="button" @click="editingDailyRecord = null" title="Close" class="modal-x">
              <X class="w-4 h-4" />
            </button>
          </div>

          <form @submit.prevent="updateDailyRecord" novalidate class="space-y-3 text-xs">
            <div class="p-3 rounded-md bg-zinc-950 border border-zinc-800 flex justify-between items-center">
              <div>
                <p class="font-bold text-white">{{ editingDailyRecord.item_name }}</p>
                <p class="text-[11px] text-zinc-500">Date: {{ formatDate(editingDailyRecord.entry_date) }}</p>
              </div>
              <span class="tnum text-emerald-400 font-semibold">{{ formatCurrency(editingDailyRecord.snapshotted_unit_price) }}/unit</span>
            </div>

            <div class="space-y-1">
              <label class="block font-medium text-zinc-300">{{ t('Buyer Name') }}</label>
              <input 
                type="text" 
                v-model="editDailyForm.buyer_name" 
                placeholder="e.g. Walk-in, Warung Bu Siti"
                class="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-xs text-zinc-100 outline-none hover:border-emerald-500/60"
              />
            </div>

            <div class="grid grid-cols-3 gap-3">
              <div class="space-y-1">
                <label class="block font-medium text-zinc-300">{{ t('Starting Stock') }}</label>
                <input 
                  type="number" 
                  v-model.number="editDailyForm.starting_stock" 
                  min="0" 
                  @keydown.up.prevent
                  @keydown.down.prevent
                  class="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-xs text-zinc-100 outline-none tnum hover:border-emerald-500/60"
                />
              </div>
              <div class="space-y-1">
                <label class="block font-medium text-zinc-300">{{ t('Restock') }}</label>
                <input 
                  type="number" 
                  v-model.number="editDailyForm.restock_quantity" 
                  min="0" 
                  @keydown.up.prevent
                  @keydown.down.prevent
                  class="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-xs text-zinc-100 outline-none tnum hover:border-emerald-500/60"
                />
              </div>
              <div class="space-y-1">
                <label class="block font-medium text-amber-300">{{ t('Leftover / Sisa') }}</label>
                <input 
                  type="number" 
                  v-model.number="editDailyForm.waste_quantity" 
                  min="0" 
                  @keydown.up.prevent
                  @keydown.down.prevent
                  class="w-full bg-zinc-950 border border-amber-900/60 rounded-md px-3 py-2 text-xs text-zinc-100 outline-none tnum hover:border-amber-500"
                />
              </div>
            </div>

            <!-- Dynamic Recomputed Preview -->
            <div class="p-3 rounded-md bg-zinc-950 border border-zinc-800 text-[11px] flex justify-between items-center">
              <div>
                <span class="text-zinc-400">{{ t('Recalculated Net Sold:') }} </span>
                <strong class="text-emerald-400 tnum text-xs">{{ editDailyPreviewSold }} pcs</strong>
              </div>
              <div>
                <span class="text-zinc-400">{{ t('New Revenue:') }} </span>
                <strong class="text-emerald-400 tnum text-xs">{{ formatCurrency(editDailyPreviewSold * Number(editingDailyRecord.snapshotted_unit_price)) }}</strong>
              </div>
            </div>

            <div class="flex gap-2 pt-2">
              <button 
                type="button" 
                @click="editingDailyRecord = null"
                class="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer"
              >
                {{ t('Cancel') }}
              </button>
              <button 
                type="submit" 
                class="flex-1 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold py-2 rounded-md text-xs transition-colors cursor-pointer"
              >
                {{ t('Save Changes') }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Mobile Floating Bottom Navigation Dock (5 clean tabs with ancient green animated line) -->
      <nav 
        :class="[
          theme === 'dark' 
            ? 'bg-zinc-900/90 border-zinc-800/90 shadow-sm' 
            : 'bg-white/90 border-slate-200/90 shadow-xl',
          'topbar-fixed md:hidden fixed bottom-3 left-3 right-3 z-40 border rounded-md backdrop-blur-lg p-1.5 flex items-center justify-around mobile-dock'
        ]"
      >
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          @click="handleTabChange(tab.id)"
          :class="[
            'nav-ancient-item flex flex-col items-center gap-1 py-1.5 px-3 transition-colors cursor-pointer select-none',
            currentTab === tab.id 
              ? 'active-ancient text-emerald-500' 
              : (theme === 'dark' ? 'text-zinc-400 hover:text-white' : 'text-slate-600 hover:text-slate-900')
          ]"
        >
          <component :is="tab.icon" class="w-4 h-4 transition-transform" />
          <span class="text-[9px] leading-none">{{ t(tab.label) }}</span>
        </button>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
import { t, lang, toggleLang } from "./i18n";
import { ref, computed, onMounted, nextTick } from 'vue'
import SmartSelect from "./components/SmartSelect.vue";
import SmartDate from "./components/SmartDate.vue";
import { 
  LayoutDashboard, 
  Boxes, 
  Receipt, 
  Calendar, 
  Trash2, 
  Plus, 
  LogOut, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PackageCheck, 
  AlertTriangle, 
  Pencil,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  ChevronUp,
  Users,
  Folder,
  User,
  X,
  Code2,
  Settings,
  Sun,
  Globe,
  Moon,
  Eye,
  EyeOff,
  Copy,
  Check,
  Key,
  ShieldCheck,
  Store,
  Upload,
  Image as ImageIcon,
  MessageSquare,
  QrCode,
  RefreshCw,
  Power,
  Sparkles,
  Lightbulb,
  AlertOctagon,
  Trophy,
  ArrowDownRight,
  Phone,
  Clock,
  Filter,
  ShoppingCart,
  Star,
  UserCog,
  CheckCircle2,
  Bell,
  ScanLine
} from "lucide-vue-next";

// 1. Theme State (Dark Mode vs White Mode)
const theme = ref<"dark" | "light">((localStorage.getItem("umkm-theme") as "dark" | "light") || "light");

function toggleTheme() {
  theme.value = theme.value === "dark" ? "light" : "dark";
  localStorage.setItem("umkm-theme", theme.value);
}

function setTheme(t: "dark" | "light") {
  theme.value = t;
  localStorage.setItem("umkm-theme", t);
}

// 2. Global Currency Formatter (e.g. Rp 702,000.00)
function formatCurrency(val: any): string {
  const num = Number(val) || 0;
  return "Rp " + num.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

async function copySnippet(text: string) {
  let ok = false;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      ok = true;
    }
  } catch { ok = false; }
  if (!ok) {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus(); ta.select();
      ok = document.execCommand("copy");
      document.body.removeChild(ta);
    } catch { ok = false; }
  }
  notify(ok ? t("Disalin ke clipboard.") : t("Gagal menyalin, salin manual."), ok ? "success" : "error");
}

const currentUser = ref<any>(null);
const isLoggingIn = ref(false);
const loginError = ref("");
const loginForm = ref({ uid: "", password: "", remember: false });
const showLoginPw = ref(false);
const editGroupId = ref<number | null>(null);

// Mask WhatsApp JID number partially for privacy in the UI
function maskJid(jid: string | null | undefined): string {
  if (!jid) return "—";
  const raw = String(jid).split("@")[0].split(":")[0];
  if (raw.length <= 6) return raw;
  return raw.slice(0, 4) + "•••••" + raw.slice(-3);
}

// Global toast notifications (replaces browser alert)
const toasts = ref<Array<{ id: number; message: string; type: "success" | "error" | "info" }>>([]);
let toastSeq = 0;
function notify(message: string, type: "success" | "error" | "info" = "success") {
  const id = ++toastSeq;
  toasts.value.push({ id, message, type });
  setTimeout(() => {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }, 4000);
}
function dismissToast(id: number) {
  toasts.value = toasts.value.filter((t) => t.id !== id);
}

// --- UI sound effects (public/Sound/*.mp3). Fire-and-forget; ignore autoplay/errors. ---
function playSound(file: string) {
  try {
    const a = new Audio(`/Sound/${file}`);
    a.volume = 0.6;
    a.play().catch(() => {});
  } catch {}
}

// Re-fetch data for whichever tab is active (per-page Refresh button).
function refreshCurrentTab() {
  playSound("Refresh.mp3");
  const tab = currentTab.value;
  if (tab === "dashboard") { loadAnalytics(); loadDailyAnalytics(); loadPesananDashboard(); loadUpcomingOrders(); }
  else if (tab === "daily") { loadDailyEntries(); loadItems(); }
  else if (tab === "items") { loadItems(); }
  else if (tab === "opex") { loadOpEx(); }
  else if (tab === "system") { loadBusinessInfo(); loadApiKeys(); fetchWAStatus(); loadUsers(); }
  notify(t("Data diperbarui."), "success");
}

// Global confirm overlay (replaces browser confirm)
const confirmState = ref<{ open: boolean; message: string; title: string; danger: boolean; resolve: ((v: boolean) => void) | null }>({
  open: false, message: "", title: "", danger: false, resolve: null,
});
function askConfirm(message: string, opts: { title?: string; danger?: boolean } = {}): Promise<boolean> {
  return new Promise((resolve) => {
    confirmState.value = { open: true, message, title: opts.title || "Konfirmasi", danger: opts.danger ?? true, resolve };
  });
}
function resolveConfirm(val: boolean) {
  confirmState.value.resolve?.(val);
  confirmState.value = { open: false, message: "", title: "", danger: false, resolve: null };
}

// Profile menu + User Appearance modal state
const showProfileMenu = ref(false);
const profileBtn = ref<HTMLElement | null>(null);
// Position the teleported dropdown right under the avatar; clamp inside the viewport.
const profileMenuStyle = ref<Record<string, string>>({});
function toggleProfileMenu() {
  showProfileMenu.value = !showProfileMenu.value;
  if (showProfileMenu.value) {
    nextTick(() => {
      const btn = profileBtn.value;
      if (!btn) return;
      const r = btn.getBoundingClientRect();
      const menuW = 240; // w-60
      const margin = 8;
      const left = Math.min(Math.max(margin, r.right - menuW), window.innerWidth - menuW - margin);
      const top = Math.min(r.bottom + margin, window.innerHeight - margin);
      profileMenuStyle.value = { top: `${Math.round(top)}px`, left: `${Math.round(left)}px` };
    });
  }
}
const showAppearanceModal = ref(false);
const appearanceForm = ref({ display_name: "", avatar_url: "" });
const appearanceSaving = ref(false);
const appearanceMsg = ref("");
const pwForm = ref({ current_password: "", new_password: "", confirm_password: "" });
const pwSaving = ref(false);
const pwError = ref("");
const pwSuccess = ref("");

const userInitials = computed(() => {
  const src = currentUser.value?.display_name || currentUser.value?.username || "?";
  const parts = src.trim().split(/\s+/);
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : src.slice(0, 2)).toUpperCase();
});

// Save Profile stays locked until display name or avatar actually changed
const isProfileDirty = computed(() =>
  appearanceForm.value.display_name !== (currentUser.value?.display_name || "") ||
  appearanceForm.value.avatar_url !== (currentUser.value?.avatar_url || "")
);

// Password requirement checks (mirror server-side auth.ts validatePasswordComplexity)
const pwChecks = computed(() => {
  const p = pwForm.value.new_password;
  return {
    length: p.length >= 8,
    upper: /[A-Z]/.test(p),
    lower: /[a-z]/.test(p),
    number: /\d/.test(p),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p),
  };
});
const pwAllValid = computed(() => Object.values(pwChecks.value).every(Boolean));
const pwMatch = computed(() => pwForm.value.new_password.length > 0 && pwForm.value.new_password === pwForm.value.confirm_password);
// Button stays locked until every field filled AND rules pass AND confirm matches
const canChangePassword = computed(() =>
  pwForm.value.current_password.length > 0 &&
  pwForm.value.new_password.length > 0 &&
  pwForm.value.confirm_password.length > 0 &&
  pwAllValid.value &&
  pwMatch.value
);

function openAppearance() {
  showProfileMenu.value = false;
  appearanceForm.value = {
    display_name: currentUser.value?.display_name || "",
    avatar_url: currentUser.value?.avatar_url || "",
  };
  appearanceMsg.value = "";
  pwForm.value = { current_password: "", new_password: "", confirm_password: "" };
  pwError.value = "";
  pwSuccess.value = "";
  showAppearanceModal.value = true;
}

async function uploadAvatar(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const fd = new FormData();
  fd.append("avatar", file);
  try {
    const res = await fetch("/api/upload/avatar", { method: "POST", body: fd });
    const data = await res.json();
    if (res.ok) {
      appearanceForm.value.avatar_url = data.avatar_url;
      if (currentUser.value) currentUser.value.avatar_url = data.avatar_url;
      appearanceMsg.value = "Avatar updated.";
    } else {
      appearanceMsg.value = data.error || "Upload failed.";
    }
  } catch {
    appearanceMsg.value = "Upload failed.";
  }
}

async function saveProfile() {
  appearanceSaving.value = true;
  appearanceMsg.value = "";
  try {
    const res = await fetch("/api/auth/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ display_name: appearanceForm.value.display_name }),
    });
    const data = await res.json();
    if (res.ok) {
      currentUser.value = data.user;
      appearanceMsg.value = "Profile saved.";
    } else {
      appearanceMsg.value = data.error || "Save failed.";
    }
  } catch {
    appearanceMsg.value = "Save failed.";
  } finally {
    appearanceSaving.value = false;
  }
}

async function changePassword() {
  if (!canChangePassword.value) return;
  pwSaving.value = true;
  pwError.value = "";
  pwSuccess.value = "";
  try {
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pwForm.value),
    });
    const data = await res.json();
    if (res.ok) {
      pwSuccess.value = data.message || "Password changed.";
      pwForm.value = { current_password: "", new_password: "", confirm_password: "" };
    } else {
      pwError.value = data.error || "Change failed.";
    }
  } catch {
    pwError.value = "Change failed.";
  } finally {
    pwSaving.value = false;
  }
}
const loginErrors = ref({ username: "", password: "" });

// Password Complexity Check (Upper, Lower, Number, Special Character, Min 8 chars)
function validatePassword(pwd: string): string | null {
  if (!pwd) return "Please enter your password.";
  if (pwd.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(pwd)) return "Must contain at least one uppercase letter (A-Z).";
  if (!/[a-z]/.test(pwd)) return "Must contain at least one lowercase letter (a-z).";
  if (!/\d/.test(pwd)) return "Must contain at least one number (0-9).";
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) return "Must contain at least one special character (!@#$%^&*).";
  return null;
}

function onPasswordInput() {
  if (!loginForm.value.password) {
    loginErrors.value.password = "";
    return;
  }
  const err = validatePassword(loginForm.value.password);
  loginErrors.value.password = err || "";
}

// Lock login button until user enters valid credentials satisfying complexity
const isLoginFormValid = computed(() => {
  return loginForm.value.uid.trim().length > 0 && 
         validatePassword(loginForm.value.password) === null;
});

// Navigation Tabs (5 sections, boomer/gen-x/millennial friendly Indonesian labels)
const TAB_DEFS: Record<string, { label: string; icon: any }> = {
  dashboard: { label: "Utama", icon: LayoutDashboard },
  daily: { label: "Pendapatan", icon: Calendar },
  items: { label: "Produk Katalog", icon: Boxes },
  opex: { label: "Pengeluaran", icon: Receipt },
  system: { label: "Sistem", icon: Settings },
};
const DEFAULT_TAB_ORDER = ["dashboard", "daily", "items", "opex", "system"];
const tabOrder = ref<string[]>((() => {
  try {
    const saved = JSON.parse(localStorage.getItem("umkm-tab-order") || "null");
    if (Array.isArray(saved) && saved.length === DEFAULT_TAB_ORDER.length && DEFAULT_TAB_ORDER.every((id) => saved.includes(id))) return saved;
  } catch {}
  return [...DEFAULT_TAB_ORDER];
})());
const isAdmin = computed(() => currentUser.value?.role === "admin");
// System tab (navbar Sistem) is admin-only; users never see it.
const tabs = computed(() =>
  tabOrder.value
    .filter((id) => id !== "system" || isAdmin.value)
    .map((id) => ({ id, ...TAB_DEFS[id] }))
);

function moveTab(id: string, dir: -1 | 1) {
  const arr = [...tabOrder.value];
  const i = arr.indexOf(id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= arr.length) return;
  [arr[i], arr[j]] = [arr[j], arr[i]];
  tabOrder.value = arr;
  localStorage.setItem("umkm-tab-order", JSON.stringify(arr));
}
function resetTabOrder() {
  tabOrder.value = [...DEFAULT_TAB_ORDER];
  localStorage.setItem("umkm-tab-order", JSON.stringify(tabOrder.value));
}

// Display size (accessibility: boomers/gen-x). Applied as a root class scaling base font.
const uiScale = ref<"sm" | "md" | "lg">((localStorage.getItem("umkm-ui-scale") as any) || "md");
function setUiScale(s: "sm" | "md" | "lg") {
  uiScale.value = s;
  localStorage.setItem("umkm-ui-scale", s);
  applyUiScale();
}
function applyUiScale() {
  const root = document.documentElement;
  root.classList.remove("ui-scale-sm", "ui-scale-md", "ui-scale-lg");
  root.classList.add(`ui-scale-${uiScale.value}`);
}
applyUiScale();
// Persist the active tab across refresh (F5) instead of always resetting to dashboard.
const VALID_TABS = ["dashboard", "daily", "items", "opex", "system"];
const currentTab = ref((() => {
  try {
    const saved = localStorage.getItem("umkm-active-tab");
    if (saved && VALID_TABS.includes(saved)) return saved;
  } catch {}
  return "dashboard";
})());
const selectedDate = ref(new Date().toLocaleDateString("en-CA"));
const dailyFilterDate = ref(new Date().toLocaleDateString("en-CA"));

// Dashboard view switcher (finance vs pesanan) + favorite persistence
const dashboardView = ref<"finance" | "pesanan">((localStorage.getItem("umkm-fav-dashboard") as "finance" | "pesanan") || "finance");
const favoriteDashboard = ref<string>(localStorage.getItem("umkm-fav-dashboard") || "");
function toggleFavoriteDashboard() {
  if (favoriteDashboard.value === dashboardView.value) {
    favoriteDashboard.value = "";
    localStorage.removeItem("umkm-fav-dashboard");
  } else {
    favoriteDashboard.value = dashboardView.value;
    localStorage.setItem("umkm-fav-dashboard", dashboardView.value);
  }
}

// Pesanan dashboard state
const pesananDate = ref(new Date().toLocaleDateString("en-CA"));
const pesananEntries = ref<any[]>([]);
const orderDates = ref<string[]>([]);
const selectedPesananBuyer = ref("");

// Upcoming orders overlay state
const showUpcomingOverlay = ref(false);
const upcomingRows = ref<any[]>([]);
const expandedUpcoming = ref<Record<string, boolean>>({});

const upcomingByDate = computed(() => {
  const map = new Map<string, { date: string; totalQty: number; buyers: Map<string, Array<{ name: string; qty: number }>> }>();
  for (const e of upcomingRows.value) {
    const date = e.entry_date;
    const buyer = e.buyer_name || "Walk-in Customer";
    const qty = Number(e.sold_quantity) || Number(e.starting_stock) || 0;
    if (qty <= 0) continue;
    if (!map.has(date)) map.set(date, { date, totalQty: 0, buyers: new Map() });
    const d = map.get(date)!;
    d.totalQty += qty;
    if (!d.buyers.has(buyer)) d.buyers.set(buyer, []);
    const items = d.buyers.get(buyer)!;
    const ex = items.find((it) => it.name === e.item_name);
    if (ex) ex.qty += qty;
    else items.push({ name: e.item_name, qty });
  }
  return Array.from(map.values()).map((d) => ({
    date: d.date,
    totalQty: d.totalQty,
    buyers: Array.from(d.buyers.entries()).map(([name, items]) => ({
      name,
      totalQty: items.reduce((a, b) => a + b.qty, 0),
      items,
    })),
  }));
});
const upcomingDates = computed(() => upcomingByDate.value.map((d) => d.date));
const upcomingTotalQty = computed(() => upcomingByDate.value.reduce((a, d) => a + d.totalQty, 0));

// Dynamic label: if the earliest order date in the set is today, it's "orders today";
// otherwise it's genuinely upcoming (future) orders.
const upcomingHasToday = computed(() => {
  const today = new Date().toLocaleDateString("en-CA");
  return upcomingByDate.value.some((d) => d.date === today);
});
const upcomingLabelKey = computed(() => (upcomingHasToday.value ? "Total Pesanan Hari Ini" : "Total Pesanan Yang Akan Datang"));

async function loadUpcomingOrders() {
  try {
    const res = await fetch("/api/upcoming-orders");
    if (res.ok) upcomingRows.value = await res.json();
  } catch {}
}

// --- KPI detail overlays (Omset / Pengeluaran / Untung Bersih / Barang Terbuang) ---
const kpiOverlay = ref<null | "revenue" | "opex" | "profit" | "waste">(null);
const kpiRows = ref<any[]>([]);
const kpiLoading = ref(false);
const kpiMeta = computed(() => {
  switch (kpiOverlay.value) {
    case "revenue": return { title: "Rincian Omset 30 Hari", icon: DollarSign, badge: "bg-emerald-500/20 text-emerald-500" };
    case "opex": return { title: "Rincian Pengeluaran 30 Hari", icon: Receipt, badge: "bg-rose-500/20 text-rose-500" };
    case "profit": return { title: "Kalkulasi Untung Bersih", icon: TrendingUp, badge: "bg-sky-500/20 text-sky-500" };
    case "waste": return { title: "Rincian Barang Terbuang", icon: PackageCheck, badge: "bg-amber-500/20 text-amber-500" };
    default: return { title: "", icon: DollarSign, badge: "" };
  }
});
async function openKpiOverlay(kind: "revenue" | "opex" | "profit" | "waste") {
  kpiOverlay.value = kind;
  kpiRows.value = [];
  if (kind === "profit") return; // formula view uses existing analytics, no fetch
  kpiLoading.value = true;
  try {
    const res = await fetch(`/api/analytics/breakdown/${kind}`);
    if (res.ok) kpiRows.value = await res.json();
  } catch {} finally {
    kpiLoading.value = false;
  }
}
function exportKpiCsv() {
  const kind = kpiOverlay.value;
  if (!kind || kind === "profit") return;
  let headers: string[] = [];
  let rows: string[][] = [];
  const esc = (v: any) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  if (kind === "revenue") {
    headers = ["Tanggal", "Pembeli", "Barang", "Jumlah", "Harga Satuan", "Total"];
    rows = kpiRows.value.map((r) => [r.entry_date, r.buyer_name || "Walk-in", r.item_name, r.sold_quantity, r.snapshotted_unit_price, r.line_total]);
  } else if (kind === "opex") {
    headers = ["Tanggal", "Barang", "Jumlah", "Satuan", "Harga Satuan", "Harga Dibayar"];
    rows = kpiRows.value.map((r) => [r.expense_date, r.item_name, r.quantity, r.measurement, Math.round(Number(r.unit_cost)), r.price_paid]);
  } else if (kind === "waste") {
    headers = ["Tanggal", "Barang", "Pembeli", "Jumlah Terbuang"];
    rows = kpiRows.value.map((r) => [r.entry_date, r.item_name, r.buyer_name || "Walk-in", r.waste_quantity]);
  }
  const csv = [headers, ...rows].map((row) => row.map(esc).join(",")).join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const month = new Date().toLocaleDateString("en-CA").slice(0, 7);
  a.href = url;
  a.download = `umkm-${kind}-${month}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
function openUpcomingOverlay() {
  showUpcomingOverlay.value = true;
  loadUpcomingOrders();
}

// --- User Management (admin) ---
const userList = ref<any[]>([]);
const newUser = ref<{ username: string; password: string; role: "user" | "admin" }>({ username: "", password: "", role: "user" });
const userSaving = ref(false);
const userFormMsg = ref("");
const userFormOk = ref(false);
const lastCreatedUid = ref("");
async function loadUsers() {
  if (currentUser.value?.role !== "admin") return;
  try {
    const res = await fetch("/api/users");
    if (res.ok) userList.value = await res.json();
  } catch {}
}
async function createUser() {
  if (!newUser.value.username.trim() || !newUser.value.password) return;
  userSaving.value = true;
  userFormMsg.value = "";
  try {
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser.value),
    });
    const data = await res.json();
    if (res.ok) {
      userFormOk.value = true;
      userFormMsg.value = data.message || "User dibuat.";
      lastCreatedUid.value = data.user?.wa_uid || "";
      newUser.value = { username: "", password: "", role: "user" };
      await loadUsers();
    } else {
      userFormOk.value = false;
      userFormMsg.value = data.error || "Gagal membuat user.";
    }
  } catch {
    userFormOk.value = false;
    userFormMsg.value = "Kesalahan jaringan.";
  } finally {
    userSaving.value = false;
  }
}
async function deleteUser(u: any) {
  const ok = await askConfirm(`Hapus user "${u.display_name || u.username}"? Tindakan ini tidak bisa dibatalkan.`, { title: "Hapus User", danger: true });
  if (!ok) return;
  try {
    const res = await fetch(`/api/users?id=${u.id}`, { method: "DELETE" });
    const data = await res.json();
    if (res.ok) { await loadUsers(); notify(t("User dihapus."), "success"); }
    else notify(data.error || "Gagal menghapus.", "error");
  } catch { notify("Kesalahan jaringan.", "error"); }
}
async function regenerateUid(u: any) {
  const ok = await askConfirm(`Reset UID untuk "${u.display_name || u.username}"? Nomor WA yang terhubung akan dilepas.`, { title: "Reset UID", danger: true });
  if (!ok) return;
  try {
    const res = await fetch("/api/users/regenerate-uid", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: u.id }),
    });
    const data = await res.json();
    if (res.ok) { lastCreatedUid.value = data.wa_uid; await loadUsers(); notify(t("UID diperbarui."), "success"); }
    else notify(data.error || "Gagal reset UID.", "error");
  } catch { notify("Kesalahan jaringan.", "error"); }
}
async function copyUid(uid: string) {
  let ok = false;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(uid);
      ok = true;
    }
  } catch { ok = false; }
  if (!ok) {
    // Fallback for mobile / non-secure contexts where navigator.clipboard is blocked.
    try {
      const ta = document.createElement("textarea");
      ta.value = uid;
      ta.style.position = "fixed";
      ta.style.top = "0";
      ta.style.left = "0";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      ta.setSelectionRange(0, uid.length);
      ok = document.execCommand("copy");
      document.body.removeChild(ta);
    } catch { ok = false; }
  }
  notify(ok ? t("UID disalin.") : t("Gagal menyalin, salin manual."), ok ? "success" : "error");
}
// Edit user modal
const showEditUserModal = ref(false);
const editUser = ref<{ id: number; username: string; role: "user" | "admin"; password: string }>({ id: 0, username: "", role: "user", password: "" });
const editUserSaving = ref(false);
const editUserMsg = ref("");
const editUserOk = ref(false);
function openEditUser(u: any) {
  editUser.value = { id: u.id, username: u.username, role: u.role, password: "" };
  editUserMsg.value = "";
  showEditUserModal.value = true;
}
async function saveEditUser() {
  if (!editUser.value.username.trim()) return;
  editUserSaving.value = true;
  editUserMsg.value = "";
  try {
    const res = await fetch("/api/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editUser.value),
    });
    const data = await res.json();
    if (res.ok) {
      editUserOk.value = true;
      editUserMsg.value = data.message || "Tersimpan.";
      await loadUsers();
      setTimeout(() => { showEditUserModal.value = false; }, 600);
    } else {
      editUserOk.value = false;
      editUserMsg.value = data.error || "Gagal menyimpan.";
    }
  } catch {
    editUserOk.value = false;
    editUserMsg.value = "Kesalahan jaringan.";
  } finally {
    editUserSaving.value = false;
  }
}
function toggleUpcomingDate(date: string) {
  expandedUpcoming.value[date] = !expandedUpcoming.value[date];
}

// Custom calendar popover state
const showPesananCalendar = ref(false);
const calCursor = ref(new Date()); // month currently displayed

function todayLocalISO(): string {
  return new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD in local tz
}
function dateStatus(d: string): "past" | "today" | "future" {
  const today = todayLocalISO();
  if (d === today) return "today";
  return d < today ? "past" : "future";
}

const pesananBuyers = computed(() => {
  const map = new Map<string, { name: string; totalQty: number; items: Array<{ name: string; qty: number }> }>();
  for (const e of pesananEntries.value) {
    const buyer = e.buyer_name || "Walk-in Customer";
    const qty = Number(e.sold_quantity) || Number(e.starting_stock) || 0;
    if (qty <= 0) continue;
    if (!map.has(buyer)) map.set(buyer, { name: buyer, totalQty: 0, items: [] });
    const b = map.get(buyer)!;
    b.totalQty += qty;
    const existing = b.items.find((it) => it.name === e.item_name);
    if (existing) existing.qty += qty;
    else b.items.push({ name: e.item_name, qty });
  }
  return Array.from(map.values()).sort((a, b) => b.totalQty - a.totalQty);
});
const displayedPesananBuyers = computed(() => {
  if (!selectedPesananBuyer.value) return pesananBuyers.value;
  return pesananBuyers.value.filter((b) => b.name === selectedPesananBuyer.value);
});
const pesananTotalQty = computed(() => pesananBuyers.value.reduce((acc, b) => acc + b.totalQty, 0));

async function loadOrderDates() {
  try {
    const res = await fetch("/api/order-dates");
    if (res.ok) orderDates.value = await res.json();
  } catch {}
}
async function loadPesananDashboard() {
  selectedPesananBuyer.value = "";
  try {
    const res = await fetch(`/api/daily-sales?date=${pesananDate.value}`);
    if (res.ok) pesananEntries.value = await res.json();
  } catch {}
}

const analytics = ref<{
  rolling_revenue: number;
  rolling_opex: number;
  rolling_waste_qty: number;
  gross_profit: number;
  health_status?: "bad" | "unhealthy" | "healthy";
  health_suggestion?: string;
  data_mining?: {
    best_sku: any;
    worst_sku: any;
    advice: string;
    all_performance: any[];
  };
}>({ rolling_revenue: 0, rolling_opex: 0, rolling_waste_qty: 0, gross_profit: 0 });
const dailyView = ref({ total_items_sold: 0, total_waste: 0, daily_revenue: 0 });
const hasGeneratedReport = ref(false);
const isGeneratingReport = ref(false);

async function generateDataMiningReport() {
  playSound("Data Mining.mp3");
  isGeneratingReport.value = true;
  try {
    await loadAnalytics();
    hasGeneratedReport.value = true;
  } finally {
    isGeneratingReport.value = false;
  }
}
const items = ref<any[]>([]);
const opexList = ref<any[]>([]);
const dailyEntries = ref<any[]>([]);
const apiKeys = ref<any[]>([]);

// Business Info State
const businessInfo = ref({
  business_name: "UMKM Enterprise",
  business_address: "",
  business_logo: "/logo.png",
  business_email: "",
  business_telephone: "",
});
const originalBusinessInfo = ref({
  business_name: "UMKM Enterprise",
  business_address: "",
  business_logo: "/logo.png",
  business_email: "",
  business_telephone: "",
});
const businessSaveMsg = ref("");
const businessErrors = ref({ business_name: "" });

// Business section collapse
// Smart accordion: only ONE section open system-wide. Expanding one collapses others.
const openSection = ref<string>((() => { try { return localStorage.getItem("umkm-open-section") || ""; } catch { return ""; } })());
function isOpen(key: string) { return openSection.value === key; }
function toggleSection(key: string) {
  openSection.value = openSection.value === key ? "" : key;
  try { localStorage.setItem("umkm-open-section", openSection.value); } catch {}
}

// Indonesia address dropdowns state
const addr = ref({
  province_id: "", province_name: "",
  regency_id: "", regency_name: "",
  district_id: "", district_name: "",
  village_id: "", village_name: "",
  detail: "",
});
const provinceOptions = ref<Array<{ value: string; label: string }>>([]);
const regencyOptions = ref<Array<{ value: string; label: string }>>([]);
const districtOptions = ref<Array<{ value: string; label: string }>>([]);
const villageOptions = ref<Array<{ value: string; label: string }>>([]);

const composedAddress = computed(() =>
  [addr.value.detail, addr.value.village_name, addr.value.district_name, addr.value.regency_name, addr.value.province_name]
    .filter(Boolean).join(", ")
);

async function fetchWilayah(level: string, id = "") {
  try {
    const res = await fetch(`/api/wilayah?level=${level}${id ? `&id=${id}` : ""}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data || []).map((r: any) => ({ value: r.id, label: r.name }));
  } catch { return []; }
}
async function loadProvinces() {
  provinceOptions.value = await fetchWilayah("provinces");
}
function labelFor(opts: Array<{ value: string; label: string }>, id: string) {
  return opts.find((o) => o.value === id)?.label || "";
}
async function onProvinceChange(id: string) {
  addr.value.province_name = labelFor(provinceOptions.value, id);
  addr.value.regency_id = ""; addr.value.regency_name = "";
  addr.value.district_id = ""; addr.value.district_name = "";
  addr.value.village_id = ""; addr.value.village_name = "";
  regencyOptions.value = []; districtOptions.value = []; villageOptions.value = [];
  if (id) regencyOptions.value = await fetchWilayah("regencies", id);
}
async function onRegencyChange(id: string) {
  addr.value.regency_name = labelFor(regencyOptions.value, id);
  addr.value.district_id = ""; addr.value.district_name = "";
  addr.value.village_id = ""; addr.value.village_name = "";
  districtOptions.value = []; villageOptions.value = [];
  if (id) districtOptions.value = await fetchWilayah("districts", id);
}
async function onDistrictChange(id: string) {
  addr.value.district_name = labelFor(districtOptions.value, id);
  addr.value.village_id = ""; addr.value.village_name = "";
  villageOptions.value = [];
  if (id) villageOptions.value = await fetchWilayah("villages", id);
}
function onVillageChange(id: string) {
  addr.value.village_name = labelFor(villageOptions.value, id);
}

// Indonesia phone validation + provider detection
const phoneError = ref("");
const phoneProvider = ref("");
function detectProvider(digits: string): string {
  // digits normalized to 08xxxx
  const p4 = digits.slice(0, 4);
  const map: Record<string, string> = {};
  const groups: Record<string, string[]> = {
    "Telkomsel": ["0811","0812","0813","0821","0822","0823","0851","0852","0853"],
    "Indosat": ["0814","0815","0816","0855","0856","0857","0858"],
    "XL": ["0817","0818","0819","0859","0877","0878"],
    "Tri (3)": ["0895","0896","0897","0898","0899"],
    "Smartfren": ["0881","0882","0883","0884","0885","0886","0887","0888","0889"],
    "AXIS": ["0831","0832","0833","0838"],
  };
  for (const [prov, prefixes] of Object.entries(groups)) for (const pre of prefixes) map[pre] = prov;
  return map[p4] || "";
}
function onPhoneInput() {
  let raw = businessInfo.value.business_telephone || "";
  // Strip any letter immediately so it never renders in the field
  if (/[a-zA-Z]/.test(raw)) {
    businessInfo.value.business_telephone = raw.replace(/[a-zA-Z]/g, "");
    raw = businessInfo.value.business_telephone;
    phoneError.value = "Nomer telepon hanya boleh angka!";
    phoneProvider.value = "";
    notify("Nomer telepon hanya boleh angka!", "error");
    return;
  }
  if (!raw.trim()) { phoneError.value = ""; phoneProvider.value = ""; return; }
  const digits = raw.replace(/[^0-9]/g, "").replace(/^62/, "0");
  if (!/^08[1-9][0-9]{7,10}$/.test(digits)) {
    phoneError.value = "Nomor tidak valid. Gunakan format Indonesia: +62 812-3456-7890.";
    phoneProvider.value = "";
    return;
  }
  const prov = detectProvider(digits);
  if (!prov) {
    phoneError.value = "Prefix provider tidak dikenali (Telkomsel, Indosat, XL, Tri, Smartfren, AXIS).";
    phoneProvider.value = "";
    return;
  }
  phoneError.value = "";
  phoneProvider.value = prov;
}

// Detect if Business Information form has unsaved edits
const isBusinessInfoDirty = computed(() => {
  return (
    businessInfo.value.business_name !== originalBusinessInfo.value.business_name ||
    businessInfo.value.business_address !== originalBusinessInfo.value.business_address ||
    businessInfo.value.business_logo !== originalBusinessInfo.value.business_logo ||
    businessInfo.value.business_email !== originalBusinessInfo.value.business_email ||
    businessInfo.value.business_telephone !== originalBusinessInfo.value.business_telephone
  );
});

// Unsaved changes navigation modal state
const unsavedModal = ref({
  isOpen: false,
  pendingTab: "",
});

function handleTabChange(targetTab: string) {
  if (currentTab.value === targetTab) return;
  // Guard: role=user can never reach the admin-only system tab.
  if (targetTab === "system" && currentUser.value?.role !== "admin") return;
  // If moving away from 'system' tab with unsaved business info
  if (currentTab.value === "system" && isBusinessInfoDirty.value) {
    unsavedModal.value = {
      isOpen: true,
      pendingTab: targetTab,
    };
    return;
  }
  currentTab.value = targetTab;
  try { localStorage.setItem("umkm-active-tab", targetTab); } catch {}
}

function discardAndNavigate() {
  // Revert back to original loaded data
  businessInfo.value = JSON.parse(JSON.stringify(originalBusinessInfo.value));
  const next = unsavedModal.value.pendingTab;
  unsavedModal.value.isOpen = false;
  unsavedModal.value.pendingTab = "";
  if (next) { currentTab.value = next; try { localStorage.setItem("umkm-active-tab", next); } catch {} }
}

async function saveAndStay() {
  unsavedModal.value.isOpen = false;
  unsavedModal.value.pendingTab = "";
  await saveBusinessInfo();
}

// Distinct existing groups derived from catalog
const existingGroups = computed(() => {
  const set = new Set<string>();
  for (const it of items.value) {
    if (it.group_name && it.group_name.trim()) {
      set.add(it.group_name.trim());
    }
  }
  return Array.from(set).sort();
});

const activeItems = computed(() => items.value.filter(it => it.is_active));

// Master Sales Items filter state
const itemFilterGroup = ref("");
const itemFilterPrice = ref<number | null>(null);
const filteredItems = computed(() => {
  let result = items.value;
  if (itemFilterGroup.value) {
    result = result.filter(it => (it.group_name || '') === itemFilterGroup.value);
  }
  if (itemFilterPrice.value !== null && itemFilterPrice.value > 0) {
    result = result.filter(it => Number(it.current_price) <= itemFilterPrice.value!);
  }
  return result;
});

// Group active items by category for optgroup in dropdown
const groupedActiveCatalog = computed(() => {
  const map = new Map<string, any[]>();
  for (const it of activeItems.value) {
    const grp = it.group_name?.trim() || "Uncategorized";
    if (!map.has(grp)) map.set(grp, []);
    map.get(grp)!.push(it);
  }
  return Array.from(map.entries()).map(([name, its]) => ({
    name,
    items: its,
  }));
});

// Flattened options for SmartSelect (searchable catalog dropdown, grouped)
const catalogItemOptions = computed(() =>
  activeItems.value.map((it: any) => ({
    value: it.id,
    label: `${it.name} (${formatCurrency(it.current_price)})`,
    group: it.group_name?.trim() || "Uncategorized",
  }))
);

// Group daily entries by SKU (Item ID) for collapsible view
// Default: COLLAPSED (false) per user request
const expandedSkus = ref<Record<number, boolean>>({});

const groupedDailyEntries = computed(() => {
  const map = new Map<number, any>();
  for (const entry of dailyEntries.value) {
    if (!map.has(entry.item_id)) {
      map.set(entry.item_id, {
        itemId: entry.item_id,
        itemName: entry.item_name,
        groupName: entry.group_name || null,
        snapshottedUnitPrice: Number(entry.snapshotted_unit_price),
        totalAvailable: 0,
        totalLeftover: 0,
        totalWaste: 0,
        totalSold: 0,
        totalRevenue: 0,
        entries: [],
      });
      // Default: FALSE (Collapsed)
      if (expandedSkus.value[entry.item_id] === undefined) {
        expandedSkus.value[entry.item_id] = false;
      }
    }

    const group = map.get(entry.item_id)!;
    const avail = Number(entry.starting_stock) + Number(entry.restock_quantity);
    const wasteCount = Number(entry.waste_quantity || entry.leftover_quantity || 0);

    group.totalAvailable += avail;
    group.totalWaste += wasteCount;
    group.totalSold += Number(entry.sold_quantity);
    group.totalRevenue += Number(entry.total_revenue);
    group.entries.push({
      ...entry,
      waste_quantity: wasteCount,
    });
  }
  return Array.from(map.values());
});

const areAllExpanded = computed(() => {
  return groupedDailyEntries.value.length > 0 && 
    groupedDailyEntries.value.every(sku => expandedSkus.value[sku.itemId]);
});

function toggleSku(itemId: number) {
  expandedSkus.value[itemId] = !expandedSkus.value[itemId];
}

function toggleAllSkus() {
  const target = !areAllExpanded.value;
  for (const sku of groupedDailyEntries.value) {
    expandedSkus.value[sku.itemId] = target;
  }
}

const opexTotalSum = computed(() => opexList.value.reduce((acc, curr) => acc + Number(curr.price_paid || 0), 0));

function formatDate(d: any): string {
  if (!d) return "";
  return d.toString().split("T")[0];
}

// Stage 1: Stock Input (Unified Leftover / Waste) — multiple items per buyer
const stockForm = ref({
  buyer_name: "",
  buyer_phone: "",
  order_date: new Date().toISOString().split("T")[0],
  items: [{ item_id: null as number | null, quantity: null as number | null }],
});
const stockErrors = ref({
  order_date: "",
  buyer_name: "",
  buyer_phone: "",
  items: [{ item_id: "", quantity: "" }] as Array<{ item_id: string; quantity: string }>,
});
const showOrderEntry = ref(false);

function blankStockForm() {
  return {
    buyer_name: "",
    buyer_phone: "",
    order_date: dailyFilterDate.value || new Date().toISOString().split("T")[0],
    items: [{ item_id: null as number | null, quantity: null as number | null }],
  };
}
function blankStockErrors() {
  return { order_date: "", buyer_name: "", buyer_phone: "", items: [{ item_id: "", quantity: "" }] };
}
function addStockItem() {
  stockForm.value.items.push({ item_id: null, quantity: null });
  stockErrors.value.items.push({ item_id: "", quantity: "" });
}
function removeStockItem(i: number) {
  stockForm.value.items.splice(i, 1);
  stockErrors.value.items.splice(i, 1);
}
function clearStockItemError(i: number) {
  if (stockErrors.value.items[i]) stockErrors.value.items[i] = { item_id: "", quantity: "" };
}

function openOrderEntry() {
  stockForm.value = blankStockForm();
  stockErrors.value = blankStockErrors();
  showOrderEntry.value = true;
}
function onOrderPhoneInput() {
  // strip non-numeric instantly
  stockForm.value.buyer_phone = String(stockForm.value.buyer_phone || "").replace(/[^0-9]/g, "");
  stockErrors.value.buyer_phone = "";
}

// Edit Master Item State
const editingItem = ref<any>(null);
const editItemForm = ref({ id: 0, name: "", group_select: "", custom_group: "", current_price: 0, is_active: true });

// New Group Inline Modal for Master Items table
const newGroupModal = ref({
  isOpen: false,
  targetItem: null as any,
  groupName: "",
});

// Edit OpEx State
const editingOpEx = ref<any>(null);
const editOpExForm = ref({ id: 0, item_name: "", price_paid: 0, quantity: 1, measurement: "Pcs", expense_date: "" });

// Edit Daily Ops State
const editingDailyRecord = ref<any>(null);
const editDailyForm = ref({ id: 0, buyer_name: "", starting_stock: 0, restock_quantity: 0, leftover_quantity: 0, waste_quantity: 0 });

// Web Popup & Overlay Confirm Dialog
const confirmDialog = ref({
  isOpen: false,
  title: "",
  message: "",
  action: async () => {},
});

function openConfirmDialog(title: string, message: string, action: () => Promise<void>) {
  confirmDialog.value = {
    isOpen: true,
    title,
    message,
    action,
  };
}

function closeConfirmDialog() {
  confirmDialog.value.isOpen = false;
}

async function executeConfirmDialog() {
  confirmDialog.value.isOpen = false;
  await confirmDialog.value.action();
}

const showAddItemModal = ref(false);
const newItem = ref({ name: "", group_select: "", custom_group: "", current_price: 0 });
const itemErrors = ref({ name: "", current_price: "" });

const newOpEx = ref({ item_name: "", price_paid: 0, quantity: 1, measurement: "Pcs" });
const opexErrors = ref({ item_name: "", price_paid: "" });

// Receipt scanning state
const showReceiptScan = ref(false);
const scanFileInput = ref<HTMLInputElement | null>(null);
const scanCameraInput = ref<HTMLInputElement | null>(null);
const scanning = ref(false);
const scanDate = ref("");
const scanItems = ref<Array<{ item_name: string; price_paid: number; quantity: number; measurement: string }>>([]);
const scanSaving = ref(false);
const unitOptions = [
  { value: "Box", label: "Box" }, { value: "Pcs", label: "Pcs" },
  { value: "Kilo", label: "Kilo" }, { value: "Litre", label: "Litre" }, { value: "Sachet", label: "Sachet" },
];
const scanTotal = computed(() => scanItems.value.reduce((a, it) => a + (Number(it.price_paid) || 0), 0));

function openReceiptScan() {
  scanItems.value = [];
  scanDate.value = new Date().toLocaleDateString("en-CA");
  showReceiptScan.value = true;
}
async function onReceiptFile(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  if (!["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(file.type)) {
    notify("Only PNG, JPG or WEBP images are supported.", "error");
    input.value = "";
    return;
  }
  scanning.value = true;
  scanItems.value = [];
  try {
    const fd = new FormData();
    fd.append("receipt", file);
    const res = await fetch("/api/opex/scan", { method: "POST", body: fd });
    const data = await res.json();
    if (res.ok) {
      scanDate.value = data.expense_date || scanDate.value;
      scanItems.value = data.items || [];
      if (scanItems.value.length === 0) notify("No items detected. Try a clearer photo.", "error");
      else notify(`Detected ${scanItems.value.length} item(s). Review then save.`, "success");
    } else {
      notify(data.error || "Failed to scan receipt.", "error");
    }
  } catch {
    notify("Network error while scanning receipt.", "error");
  } finally {
    scanning.value = false;
    input.value = "";
  }
}
function removeScanItem(i: number) {
  scanItems.value.splice(i, 1);
}
async function saveScannedOpEx() {
  const valid = scanItems.value.filter((it) => it.item_name.trim() && Number(it.price_paid) > 0);
  if (valid.length === 0) { notify("Nothing to save — add at least one valid item.", "error"); return; }
  scanSaving.value = true;
  let ok = 0;
  try {
    for (const it of valid) {
      const res = await fetch("/api/opex", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_name: it.item_name.trim(),
          price_paid: Number(it.price_paid),
          quantity: Number(it.quantity) || 1,
          measurement: it.measurement,
          expense_date: scanDate.value,
          notes: "Scanned receipt",
        }),
      });
      if (res.ok) ok++;
    }
    await loadOpEx();
    await loadAnalytics();
    notify(`${ok} expense record(s) saved from receipt.`, "success");
    showReceiptScan.value = false;
  } catch {
    notify("Error while saving scanned items.", "error");
  } finally {
    scanSaving.value = false;
  }
}

// API Keys Management State
const showCreateApiKeyModal = ref(false);
const newKeyName = ref("");

const previewInitialSold = computed(() => {
  return stockForm.value.items.reduce((a, r) => a + (Number(r.quantity) || 0), 0);
});

const editDailyPreviewSold = computed(() => {
  const total = (editDailyForm.value.starting_stock || 0) + (editDailyForm.value.restock_quantity || 0);
  const remaining = editDailyForm.value.waste_quantity || 0;
  return Math.max(0, total - remaining);
});

async function checkAuth() {
  try {
    const res = await fetch("/api/auth/me");
    if (res.ok) {
      const data = await res.json();
      currentUser.value = data.user;
      showProfileMenu.value = false;
      // Guard: a non-admin restoring a persisted 'system' tab falls back to dashboard.
      if (currentTab.value === "system" && currentUser.value?.role !== "admin") {
        currentTab.value = "dashboard";
        try { localStorage.setItem("umkm-active-tab", "dashboard"); } catch {}
      }
      loadAllData();
    }
  } catch {}
}

async function login() {
  loginErrors.value = { username: "", password: "" };
  if (!loginForm.value.uid.trim()) {
    loginErrors.value.username = "Masukan UID kamu.";
    return;
  }
  const pwdErr = validatePassword(loginForm.value.password);
  if (pwdErr) {
    loginErrors.value.password = pwdErr;
    return;
  }

  loginError.value = "";
  isLoggingIn.value = true;
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid: loginForm.value.uid.trim(), password: loginForm.value.password, remember: loginForm.value.remember === true }),
    });
    if (res.ok) {
      const data = await res.json();
      currentUser.value = data.user;
      showProfileMenu.value = false;
      // On login, always land on the dashboard.
      currentTab.value = "dashboard";
      try { localStorage.setItem("umkm-active-tab", "dashboard"); } catch {}
      loadAllData();
    } else {
      const err = await res.json();
      loginError.value = err.error || "Login failed. Check your credentials.";
    }
  } catch {
    loginError.value = "Network error. Please try again.";
  } finally {
    isLoggingIn.value = false;
  }
}

async function logout() {
  await fetch("/api/auth/logout", { method: "POST" });
  currentUser.value = null;
}

async function loadAnalytics() {
  const res = await fetch("/api/analytics/rolling-30");
  if (res.ok) analytics.value = await res.json();
}

async function loadDailyAnalytics() {
  const res = await fetch(`/api/analytics/daily?date=${selectedDate.value}`);
  if (res.ok) dailyView.value = await res.json();
}

async function loadDailyEntries() {
  const res = await fetch(`/api/daily-sales?date=${dailyFilterDate.value}`);
  if (res.ok) dailyEntries.value = await res.json();
}

async function loadItems() {
  const res = await fetch("/api/items");
  if (res.ok) items.value = await res.json();
}

async function loadOpEx() {
  const res = await fetch("/api/opex");
  if (res.ok) opexList.value = await res.json();
}

async function loadApiKeys() {
  const res = await fetch("/api/api-keys");
  if (res.ok) apiKeys.value = await res.json();
}

async function loadBusinessInfo() {
  const res = await fetch("/api/business-info");
  if (res.ok) {
    const data = await res.json();
    const info = {
      business_name: data.business_name || "UMKM Enterprise",
      business_address: data.business_address || "",
      business_logo: data.business_logo || "/logo.png",
      business_email: data.business_email || "",
      business_telephone: data.business_telephone || "",
    };
    businessInfo.value = { ...info };
    originalBusinessInfo.value = { ...info };
    // Restore Indonesia address parts (names only; ids re-selected on demand)
    addr.value.province_name = data.business_province || "";
    addr.value.regency_name = data.business_regency || "";
    addr.value.district_name = data.business_district || "";
    addr.value.village_name = data.business_village || "";
    addr.value.detail = data.business_address_detail || "";
    if (phoneRawValue()) onPhoneInput();
  }
}
function phoneRawValue() { return (businessInfo.value.business_telephone || "").trim(); }

async function saveBusinessInfo() {
  businessErrors.value = { business_name: "" };
  if (!businessInfo.value.business_name?.trim()) {
    businessErrors.value.business_name = "Please enter your business name.";
    return;
  }
  if (phoneError.value) {
    notify(phoneError.value, "error");
    return;
  }

  const payload = {
    ...businessInfo.value,
    business_province: addr.value.province_name,
    business_regency: addr.value.regency_name,
    business_district: addr.value.district_name,
    business_village: addr.value.village_name,
    business_address_detail: addr.value.detail,
  };
  const res = await fetch("/api/business-info", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (res.ok) {
    businessSaveMsg.value = "Saved successfully!";
    notify("Business information saved.", "success");
    setTimeout(() => { businessSaveMsg.value = ""; }, 3000);
    loadBusinessInfo();
  } else {
    const err = await res.json();
    notify(err.error || "Failed to save business info", "error");
  }
}

// Logo file upload handler
const isUploadingLogo = ref(false);
const logoFileInput = ref<HTMLInputElement | null>(null);

function triggerLogoUpload() {
  logoFileInput.value?.click();
}

async function handleLogoUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  isUploadingLogo.value = true;
  try {
    const formData = new FormData();
    formData.append("logo", file);

    const res = await fetch("/api/upload/logo", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      businessInfo.value.business_logo = data.url;
      businessSaveMsg.value = "Logo uploaded & saved to UMKM/public/images/!";
      setTimeout(() => { businessSaveMsg.value = ""; }, 3500);
      await loadBusinessInfo();
    } else {
      const err = await res.json();
      notify(err.error || "Failed to upload logo", "error");
    }
  } catch {
    notify("Network error while uploading logo", "error");
  } finally {
    isUploadingLogo.value = false;
    if (target) target.value = "";
  }
}

// WhatsApp Integrator Bot State
const waStatus = ref<{
  status: "disconnected" | "connecting" | "connected";
  qr: string | null;
  user: string | null;
  last_error: string | null;
}>({
  status: "disconnected",
  qr: null,
  user: null,
  last_error: null,
});
const isConnectingWA = ref(false);
const qrRequested = ref(false); // Only show QR if user clicked "Connect to WhatsApp and Generate QR"
let waPollTimer: any = null;

// Whitelist management state
const waWhitelist = ref<string[]>([]);
const newWhitelistNumber = ref("");

async function loadWAWhitelist() {
  try {
    const res = await fetch("/api/wa-bot/whitelist");
    if (res.ok) {
      waWhitelist.value = await res.json();
    }
  } catch {}
}

async function addWhitelistNumber() {
  const raw = newWhitelistNumber.value.trim();
  if (!raw) return;
  const digits = raw.replace(/[^0-9]/g, "");
  if (!digits) {
    notify("Please enter a valid phone number.", "error");
    return;
  }
  const formattedJid = `${digits}@s.whatsapp.net`;
  if (!waWhitelist.value.includes(formattedJid)) {
    const updated = [...waWhitelist.value, formattedJid];
    try {
      const res = await fetch("/api/wa-bot/whitelist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numbers: updated }),
      });
      if (res.ok) {
        waWhitelist.value = updated;
        newWhitelistNumber.value = "";
      }
    } catch {}
  } else {
    newWhitelistNumber.value = "";
  }
}

const whitelistToRemove = ref<string | null>(null);
function confirmRemoveWhitelist(targetJid: string) {
  whitelistToRemove.value = targetJid;
}
async function removeWhitelistNumber(targetJid: string) {
  const updated = waWhitelist.value.filter((j) => j !== targetJid);
  try {
    const res = await fetch("/api/wa-bot/whitelist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ numbers: updated }),
    });
    if (res.ok) {
      waWhitelist.value = updated;
      whitelistToRemove.value = null;
    }
  } catch {}
}

async function fetchWAStatus() {
  try {
    const res = await fetch("/api/wa-bot/status");
    if (res.ok) {
      waStatus.value = await res.json();
      if (waStatus.value.status === "connected") {
        qrRequested.value = false;
      }
    }
  } catch {}
}

async function connectToWhatsAppBot() {
  isConnectingWA.value = true;
  qrRequested.value = true;
  try {
    const res = await fetch("/api/wa-bot/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ force: true }),
    });
    if (res.ok) {
      startWAPolling();
    } else {
      notify("Failed to initiate WhatsApp connection. Ensure bot daemon is running.", "error");
      qrRequested.value = false;
    }
  } catch {
    notify("Network error connecting to WhatsApp Bot service", "error");
    qrRequested.value = false;
  } finally {
    isConnectingWA.value = false;
  }
}

async function disconnectWhatsAppBot() {
  const ok = await askConfirm("Are you sure you want to disconnect WhatsApp and remove active session?", { title: "Disconnect WhatsApp", danger: true });
  if (!ok) return;
  try {
    await fetch("/api/wa-bot/disconnect", { method: "POST" });
    qrRequested.value = false;
    fetchWAStatus();
  } catch {
    notify("Failed to disconnect", "error");
  }
}

function startWAPolling() {
  if (waPollTimer) clearInterval(waPollTimer);
  fetchWAStatus();
  waPollTimer = setInterval(() => {
    fetchWAStatus();
    if (waStatus.value.status === "connected") {
      clearInterval(waPollTimer);
      waPollTimer = null;
    }
  }, 2500);
}

// WhatsApp Order Reminder Schedule State
const waReminder = ref({
  enabled: true,
  evening_hour: 21,
  evening_minute: 0,
  morning_hour: 2,
  morning_minute: 0,
});
const isSavingReminder = ref(false);
const isTestingReminder = ref(false);
const reminderStatusMsg = ref("");

// Bridge clock selector (HH:MM string) <-> hour/minute numbers
const eveningTime = computed({
  get: () => `${String(waReminder.value.evening_hour).padStart(2, "0")}:${String(waReminder.value.evening_minute).padStart(2, "0")}`,
  set: (v: string) => {
    const [h, m] = v.split(":").map(Number);
    waReminder.value.evening_hour = h || 0;
    waReminder.value.evening_minute = m || 0;
  },
});
const morningTime = computed({
  get: () => `${String(waReminder.value.morning_hour).padStart(2, "0")}:${String(waReminder.value.morning_minute).padStart(2, "0")}`,
  set: (v: string) => {
    const [h, m] = v.split(":").map(Number);
    waReminder.value.morning_hour = h || 0;
    waReminder.value.morning_minute = m || 0;
  },
});

async function fetchReminderSettings() {
  try {
    const res = await fetch("/api/wa-bot/reminder-settings");
    if (res.ok) {
      const data = await res.json();
      waReminder.value = { ...waReminder.value, ...data };
    }
  } catch {}
}

async function saveReminderSettings() {
  isSavingReminder.value = true;
  try {
    const res = await fetch("/api/wa-bot/reminder-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(waReminder.value),
    });
    if (res.ok) {
      reminderStatusMsg.value = "Saved successfully";
      setTimeout(() => { reminderStatusMsg.value = ""; }, 3000);
    } else {
      notify("Failed to save reminder schedule", "error");
    }
  } catch {
    notify("Network error saving reminder schedule", "error");
  } finally {
    isSavingReminder.value = false;
  }
}

async function triggerTestReminder() {
  if (waStatus.value.status !== "connected") {
    notify("WhatsApp Bot is not connected. Please pair bot first.", "error");
    return;
  }
  isTestingReminder.value = true;
  try {
    const today = new Date().toISOString().split("T")[0];
    const res = await fetch("/api/wa-bot/reminder-trigger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_date: today, type: "evening" }),
    });
    const data = await res.json();
    notify(data.message || (data.success ? "Test reminder sent!" : "Failed to send"), data.success === false ? "error" : "success");
  } catch {
    notify("Network error triggering test reminder", "error");
  } finally {
    isTestingReminder.value = false;
  }
}

function loadAllData() {
  loadItems();
  loadOpEx();
  loadDailyEntries();
  loadAnalytics();
  loadDailyAnalytics();
  loadApiKeys();
  loadBusinessInfo();
  fetchWAStatus();
  loadWAWhitelist();
  fetchReminderSettings();
  loadOrderDates();
  loadPesananDashboard();
  loadUpcomingOrders();
  loadProvinces();
  loadUsers();
}

// 1. Daily Operations Handlers
async function submitDailyStock() {
  stockErrors.value = blankStockErrors();
  // Ensure per-row error slots match the current item count.
  stockErrors.value.items = stockForm.value.items.map(() => ({ item_id: "", quantity: "" }));
  let hasError = false;

  if (!stockForm.value.order_date) {
    stockErrors.value.order_date = t("Select the order date.");
    hasError = true;
  }
  if (!stockForm.value.buyer_name.trim()) {
    stockErrors.value.buyer_name = t("Enter the buyer name.");
    hasError = true;
  }
  stockForm.value.items.forEach((row, i) => {
    if (!row.item_id) {
      stockErrors.value.items[i].item_id = t("Select a catalog item.");
      hasError = true;
    }
    if (!row.quantity || Number(row.quantity) <= 0) {
      stockErrors.value.items[i].quantity = t("Enter the ordered quantity.");
      hasError = true;
    }
  });
  if (hasError) return;

  const buyerName = stockForm.value.buyer_name.trim() || null;
  const buyerPhone = stockForm.value.buyer_phone.trim() || null;
  const entryDate = stockForm.value.order_date;

  // One daily-sales record per item, all sharing the same buyer + date.
  const results = await Promise.all(
    stockForm.value.items.map((row) =>
      fetch("/api/daily-sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entry_date: entryDate,
          item_id: row.item_id,
          buyer_name: buyerName,
          buyer_phone: buyerPhone,
          starting_stock: Number(row.quantity),
          restock_quantity: 0,
          waste_quantity: 0,
        }),
      }).then(async (res) => ({ ok: res.ok, err: res.ok ? null : (await res.json().catch(() => ({}))).error }))
    )
  );

  const failed = results.filter((r) => !r.ok);
  if (failed.length === 0) {
    playSound("IN-OUT.mp3");
    await loadDailyEntries();
    await loadDailyAnalytics();
    await loadAnalytics();
    await loadUpcomingOrders?.();
    await loadPesananDashboard?.();
    showOrderEntry.value = false;
    notify(t("Order saved."), "success");
    stockForm.value = blankStockForm();
    stockErrors.value = blankStockErrors();
  } else {
    notify(failed[0].err || `Failed to save ${failed.length} of ${results.length} items`, "error");
    // Refresh what did save so the ledger stays accurate.
    await loadDailyEntries();
    await loadDailyAnalytics();
  }
}

function openEditDailyModal(entry: any) {
  editingDailyRecord.value = entry;
  editDailyForm.value = {
    id: entry.id,
    buyer_name: entry.buyer_name || "",
    starting_stock: Number(entry.starting_stock),
    restock_quantity: Number(entry.restock_quantity),
    leftover_quantity: 0,
    waste_quantity: Number(entry.waste_quantity),
  };
}

async function updateDailyRecord() {
  if (!editingDailyRecord.value) return;

  const res = await fetch("/api/daily-sales", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: editDailyForm.value.id,
      buyer_name: editDailyForm.value.buyer_name,
      starting_stock: editDailyForm.value.starting_stock,
      restock_quantity: editDailyForm.value.restock_quantity,
      waste_quantity: editDailyForm.value.waste_quantity,
    }),
  });

  if (res.ok) {
    editingDailyRecord.value = null;
    await loadDailyEntries();
    await loadDailyAnalytics();
    await loadAnalytics();
  } else {
    const err = await res.json();
    notify(err.error || "Failed to update daily operation", "error");
  }
}

function promptDeleteDailyEntry(entry: any) {
  openConfirmDialog(
    "Remove Transaction",
    `Are you sure you want to remove the shift entry for '${entry.item_name}' (Buyer: ${entry.buyer_name || 'Walk-in'})?`,
    async () => {
      const res = await fetch(`/api/daily-sales?id=${entry.id}`, { method: "DELETE" });
      if (res.ok) {
        await loadDailyEntries();
        await loadDailyAnalytics();
        await loadAnalytics();
      }
    }
  );
}

// 2. Master Items & Grouping Handlers
async function createItem() {
  itemErrors.value = { name: "", current_price: "" };
  if (!newItem.value.name.trim()) {
    itemErrors.value.name = "Please enter the product name.";
    return;
  }
  if (newItem.value.current_price === undefined || newItem.value.current_price === null || newItem.value.current_price < 0) {
    itemErrors.value.current_price = "Please enter a valid selling price.";
    return;
  }

  const finalGroup = newItem.value.group_select === "__CUSTOM__" 
    ? newItem.value.custom_group.trim() 
    : newItem.value.group_select;

  const res = await fetch("/api/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: newItem.value.name,
      group_name: finalGroup || null,
      current_price: newItem.value.current_price,
    }),
  });
  if (res.ok) {
    playSound("IN-OUT.mp3");
    newItem.value = { name: "", group_select: "", custom_group: "", current_price: 0 };
    showAddItemModal.value = false;
    await loadItems();
    notify(t("Produk disimpan."), "success");
  }
}

async function onTableGroupChange(item: any, event: Event) {
  const select = event.target as HTMLSelectElement;
  const val = select.value;
  await onTableGroupChangeVal(item, val);
}

async function onTableGroupChangeVal(item: any, val: string) {
  if (val === "__NEW__") {
    newGroupModal.value = {
      isOpen: true,
      targetItem: item,
      groupName: "",
    };
    return;
  }

  const res = await fetch("/api/items", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: item.id,
      name: item.name,
      group_name: val || null,
      current_price: item.current_price,
      is_active: item.is_active,
    }),
  });
  if (res.ok) {
    await loadItems();
    await loadDailyEntries();
  }
}

async function submitNewGroupForTableItem() {
  const name = newGroupModal.value.groupName.trim();
  if (!name || !newGroupModal.value.targetItem) return;

  const item = newGroupModal.value.targetItem;
  const res = await fetch("/api/items", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: item.id,
      name: item.name,
      group_name: name,
      current_price: item.current_price,
      is_active: item.is_active,
    }),
  });
  if (res.ok) {
    newGroupModal.value.isOpen = false;
    await loadItems();
    await loadDailyEntries();
  }
}

function openEditItemModal(item: any) {
  editingItem.value = item;
  editItemForm.value = {
    id: item.id,
    name: item.name,
    group_select: item.group_name || "",
    custom_group: "",
    current_price: Number(item.current_price),
    is_active: Boolean(item.is_active),
  };
}

async function updateItem() {
  const finalGroup = editItemForm.value.group_select === "__CUSTOM__"
    ? editItemForm.value.custom_group.trim()
    : editItemForm.value.group_select;

  const res = await fetch("/api/items", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: editItemForm.value.id,
      name: editItemForm.value.name,
      group_name: finalGroup || null,
      current_price: editItemForm.value.current_price,
      is_active: editItemForm.value.is_active,
    }),
  });
  if (res.ok) {
    editingItem.value = null;
    await loadItems();
    await loadDailyEntries();
  } else {
    const err = await res.json();
    notify(err.error || "Failed to update item", "error");
  }
}

function promptDeleteItem(item: any) {
  openConfirmDialog(
    "Remove Catalog Item",
    `Are you sure you want to remove '${item.name}' from the master catalog? Past historical transactions will remain permanently protected.`,
    async () => {
      const res = await fetch(`/api/items?id=${item.id}`, { method: "DELETE" });
      if (res.ok) {
        await loadItems();
      }
    }
  );
}

// 3. OpEx Handlers
async function createOpEx() {
  opexErrors.value = { item_name: "", price_paid: "" };
  if (!newOpEx.value.item_name.trim()) {
    opexErrors.value.item_name = "Please enter expense item name.";
    return;
  }
  if (newOpEx.value.price_paid === undefined || newOpEx.value.price_paid === null || newOpEx.value.price_paid < 0) {
    opexErrors.value.price_paid = "Please enter a valid price paid.";
    return;
  }

  const res = await fetch("/api/opex", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newOpEx.value),
  });
  if (res.ok) {
    playSound("IN-OUT.mp3");
    newOpEx.value = { item_name: "", price_paid: 0, quantity: 1, measurement: "Pcs" };
    await loadOpEx();
    await loadAnalytics();
    notify(t("Pengeluaran disimpan."), "success");
  } else {
    const err = await res.json().catch(() => ({}));
    notify(err.error || "Gagal menyimpan pengeluaran.", "error");
  }
}

function openEditOpExModal(op: any) {
  editingOpEx.value = op;
  editOpExForm.value = {
    id: op.id,
    item_name: op.item_name,
    price_paid: Number(op.price_paid),
    quantity: Number(op.quantity),
    measurement: op.measurement,
    expense_date: formatDate(op.expense_date),
  };
}

async function updateOpEx() {
  if (!editingOpEx.value) return;

  const res = await fetch("/api/opex", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(editOpExForm.value),
  });
  if (res.ok) {
    editingOpEx.value = null;
    await loadOpEx();
    await loadAnalytics();
  } else {
    const err = await res.json();
    notify(err.error || "Failed to update OpEx record", "error");
  }
}

function promptDeleteOpEx(op: any) {
  openConfirmDialog(
    "Remove OpEx Record",
    `Are you sure you want to remove expense '${op.item_name}' (Cost: ${formatCurrency(op.price_paid)})?`,
    async () => {
      const res = await fetch(`/api/opex?id=${op.id}`, { method: "DELETE" });
      if (res.ok) {
        await loadOpEx();
        await loadAnalytics();
      }
    }
  );
}

// 4. API Keys Handlers
async function generateApiKey() {
  const name = newKeyName.value.trim() || "Bot Integration";
  const res = await fetch("/api/api-keys", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key_name: name }),
  });
  if (res.ok) {
    newKeyName.value = "";
    showCreateApiKeyModal.value = false;
    await loadApiKeys();
  } else {
    const err = await res.json();
    notify(err.error || "Failed to generate API Key", "error");
  }
}

function promptRevokeApiKey(key: any) {
  openConfirmDialog(
    "Revoke API Key",
    `Are you sure you want to revoke key '${key.key_name}' (${key.api_key.substring(0, 16)}...)? External bots using this key will immediately lose access.`,
    async () => {
      const res = await fetch(`/api/api-keys?id=${key.id}`, { method: "DELETE" });
      if (res.ok) {
        await loadApiKeys();
      }
    }
  );
}

onMounted(() => {
  checkAuth();
});
</script>
