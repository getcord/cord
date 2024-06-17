import type http from 'http';
import type https from 'https';

declare function manageConnection(url: string): http.Agent | https.Agent;
