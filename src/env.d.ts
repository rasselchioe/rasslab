/// <reference types="astro/client" />

interface Window {
  /** Set once the preloader has finished (or was skipped). */
  __rlBooted?: boolean;
}
