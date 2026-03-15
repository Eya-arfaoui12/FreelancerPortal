// Import with `import * as Sentry from "@sentry/node"` if you are using ESM
import * as Sentry from "@sentry/node"

Sentry.init({
  dsn: "https://9e5de800db27412798577f3b69a9e1c0@o4509966724759552.ingest.de.sentry.io/4509966731640912",
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  integrations: [
    Sentry.prismaIntegration()
  ],
  sendDefaultPii: true,
});