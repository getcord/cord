import type {
  ProjectData,
  ServerCreateProject,
  ServerDeleteProject,
  ServerUpdateProject,
} from './project.js';

/**
 * @deprecated use ProjectData instead
 */
export interface ApplicationData extends ProjectData {}

/**
 * @deprecated use ServerCreateProject instead
 */
export interface ServerCreateApplication extends ServerCreateProject {}

/**
 * @deprecated use ServerUpdateProject instead
 */
export interface ServerUpdateApplication extends ServerUpdateProject {}

/**
 * @deprecated use ServerDeleteProject instead
 */
export interface ServerDeleteApplication extends ServerDeleteProject {}
