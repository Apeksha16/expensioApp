import {
  appModules,
  isKnownAppModuleRoute,
  type AppModule,
  type AppModuleRoute,
} from '../data/modules';

export interface ModuleRegistryService {
  getModules(): AppModule[];
  getAvailableModules(): AppModule[];
  getModuleById(id: string): AppModule | undefined;
  getModuleByRoute(route: string): AppModule | undefined;
  isKnownRoute(route: string): route is AppModuleRoute;
}

export const moduleRegistryService: ModuleRegistryService = {
  getModules: () => [...appModules].sort((a, b) => a.displayOrder - b.displayOrder),
  getAvailableModules: () => moduleRegistryService.getModules().filter((module) => module.available),
  getModuleById: (id) => appModules.find((module) => module.id === id),
  getModuleByRoute: (route) => appModules.find((module) => module.route === route),
  isKnownRoute: isKnownAppModuleRoute,
};
