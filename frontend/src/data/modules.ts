export type AppModuleId =
  | 'dashboard'
  | 'expenses'
  | 'splits'
  | 'ledger'
  | 'budgets'
  | 'reports'
  | 'goals'
  | 'upcoming-payments'
  | 'analytics'
  | 'additional-modules';

export type AppModuleRoute =
  | 'Home'
  | 'Add'
  | 'Split'
  | 'Activity'
  | 'Budgets'
  | 'Reports'
  | 'Goals'
  | 'UpcomingPayments'
  | 'Analytics'
  | 'AdditionalModules';

export const APP_MODULE_ROUTES: readonly AppModuleRoute[] = [
  'Home',
  'Add',
  'Split',
  'Activity',
  'Budgets',
  'Reports',
  'Goals',
  'UpcomingPayments',
  'Analytics',
  'AdditionalModules',
];

export interface AppModule {
  id: AppModuleId;
  name: string;
  description: string;
  icon: string;
  activeIcon: string;
  route: AppModuleRoute;
  navLabel: string;
  displayOrder: number;
  available: boolean;
  navigationVisible: boolean;
}

export const appModules: readonly AppModule[] = [
  { id: 'dashboard', name: 'Dashboard', description: 'Your personal money space', icon: 'home-outline', activeIcon: 'home', route: 'Home', navLabel: 'Home', displayOrder: 0, available: true, navigationVisible: true },
  { id: 'expenses', name: 'Expenses', description: 'Record and review expenses', icon: 'receipt-outline', activeIcon: 'receipt', route: 'Add', navLabel: 'Expenses', displayOrder: 1, available: true, navigationVisible: true },
  { id: 'splits', name: 'Splits', description: 'Share expenses with friends', icon: 'people-outline', activeIcon: 'people', route: 'Split', navLabel: 'Splits', displayOrder: 2, available: true, navigationVisible: true },
  { id: 'ledger', name: 'Ledger', description: 'Your saved transactions', icon: 'time-outline', activeIcon: 'time', route: 'Activity', navLabel: 'Ledger', displayOrder: 3, available: true, navigationVisible: true },
  { id: 'budgets', name: 'Budgets', description: 'Plan spending categories', icon: 'pie-chart-outline', activeIcon: 'pie-chart', route: 'Budgets', navLabel: 'Budgets', displayOrder: 4, available: true, navigationVisible: true },
  { id: 'reports', name: 'Reports', description: 'Review your financial reports', icon: 'document-text-outline', activeIcon: 'document-text', route: 'Reports', navLabel: 'Reports', displayOrder: 5, available: true, navigationVisible: true },
  { id: 'goals', name: 'Goals', description: 'Track goals you set', icon: 'flag-outline', activeIcon: 'flag', route: 'Goals', navLabel: 'Goals', displayOrder: 6, available: true, navigationVisible: true },
  { id: 'upcoming-payments', name: 'Upcoming Payments', description: 'Keep upcoming payments together', icon: 'calendar-outline', activeIcon: 'calendar', route: 'UpcomingPayments', navLabel: 'Upcoming', displayOrder: 7, available: true, navigationVisible: true },
  { id: 'analytics', name: 'Analytics', description: 'Explore insights from your data', icon: 'analytics-outline', activeIcon: 'analytics', route: 'Analytics', navLabel: 'Analytics', displayOrder: 8, available: true, navigationVisible: true },
  { id: 'additional-modules', name: 'Additional Modules', description: 'Browse every available module', icon: 'grid-outline', activeIcon: 'grid', route: 'AdditionalModules', navLabel: 'More', displayOrder: 9, available: true, navigationVisible: true },
];

export const DEFAULT_PREFERRED_MODULE_IDS: readonly AppModuleId[] = [
  'dashboard',
  'expenses',
  'splits',
  'ledger',
  'budgets',
];

export const PREFERRED_MODULE_LIMIT = 5;

export function getModuleById(id: string): AppModule | undefined {
  return appModules.find((module) => module.id === id);
}

export function getModuleByRoute(route: string): AppModule | undefined {
  return appModules.find((module) => module.route === route);
}

export function isKnownAppModuleRoute(route: string): route is AppModuleRoute {
  return APP_MODULE_ROUTES.includes(route as AppModuleRoute);
}

export function normalizePreferredModuleIds(value: unknown): AppModuleId[] {
  const requested = Array.isArray(value) ? value : [];
  const unique = requested.filter((id, index): id is AppModuleId =>
    typeof id === 'string'
    && appModules.some((module) => module.id === id && module.available && module.navigationVisible)
    && requested.indexOf(id) === index,
  );
  const normalized = unique.slice(0, PREFERRED_MODULE_LIMIT);
  for (const id of DEFAULT_PREFERRED_MODULE_IDS) {
    if (normalized.length === PREFERRED_MODULE_LIMIT) break;
    if (!normalized.includes(id)) normalized.push(id);
  }
  for (const module of appModules) {
    if (normalized.length === PREFERRED_MODULE_LIMIT) break;
    if (module.available && module.navigationVisible && !normalized.includes(module.id)) {
      normalized.push(module.id);
    }
  }
  return normalized;
}
