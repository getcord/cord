// This is for important URLs to all kinds of services

export const TOP_SERVER_HOST = process.env.TOP_SERVER_HOST!;
export const APP_SERVER_HOST = process.env.APP_SERVER_HOST!;
export const API_SERVER_HOST = process.env.API_SERVER_HOST!;
export const API_SERVER_HOST_PRODUCTION =
  process.env.API_SERVER_HOST_PRODUCTION!;
export const ADMIN_SERVER_HOST = process.env.ADMIN_SERVER_HOST!;
export const CONSOLE_SERVER_HOST = process.env.CONSOLE_SERVER_HOST!;
export const MARKETING_SERVER_HOST = process.env.MARKETING_SERVER_HOST!;
export const CORD_TO_HOST = process.env.CORD_TO_HOST!;
export const AUTH0_CUSTOM_LOGIN_DOMAIN = process.env.AUTH0_CUSTOM_LOGIN_DOMAIN!;
export const DOCS_SERVER_HOST = process.env.DOCS_SERVER_HOST!;
export const SLACK_APP_REDIRECT_HOST = process.env.SLACK_APP_REDIRECT_HOST;

export const TOP_ORIGIN = 'https://' + process.env.TOP_SERVER_HOST;
export const APP_ORIGIN = 'https://' + process.env.APP_SERVER_HOST;
export const API_ORIGIN = 'https://' + process.env.API_SERVER_HOST;
export const ADMIN_ORIGIN = 'https://' + process.env.ADMIN_SERVER_HOST;
export const CONSOLE_ORIGIN = 'https://' + process.env.CONSOLE_SERVER_HOST;
export const MARKETING_ORIGIN = 'https://' + process.env.MARKETING_SERVER_HOST;
export const CORD_TO_ORIGIN = 'https://' + process.env.CORD_TO_HOST;
export const AUTH0_ORIGIN = 'https://' + process.env.AUTH0_CUSTOM_LOGIN_DOMAIN;
export const DOCS_ORIGIN = 'https://' + process.env.DOCS_SERVER_HOST;
export const DOCS_AI_CHATBOT_SERVER_HOST =
  process.env.DOCS_AI_CHATBOT_SERVER_HOST;
export const COMMUNITY_ORIGIN = 'https://' + process.env.COMMUNITY_SERVER_HOST;

// See https://github.com/getcord/interactive-demos
export const DEMO_APPS_WEBHOOK_URL =
  'https://cord-interactive-demos.vercel.app/events';
