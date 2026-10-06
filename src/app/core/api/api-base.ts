import { isDevMode } from '@angular/core';

// `ng serve` talks to a local API; production builds talk to the deployed college instance.
export const API_BASE = isDevMode()
  ? 'http://localhost:5000/api'
  : 'https://college-a.178-104-255-148.sslip.io/api';
