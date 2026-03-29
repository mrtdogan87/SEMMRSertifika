import { prisma } from "../src/lib/prisma";
import { ensureBootstrapAdmin } from "../src/lib/admin-user";
import { getDefaultTemplateSeeds } from "../src/lib/templates";

async function retry<T>(fn: () => Promise<T>, attempts = 3, delayMs = 1200): Promise<T> {
  let lastError: unknown;

  for (let index = 0; index < attempts; index += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (index === attempts - 1) {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs * (index + 1)));
    }
  }

  throw lastError;
}

async function main() {
  await retry(() => ensureBootstrapAdmin());

  for (const template of getDefaultTemplateSeeds()) {
    await retry(() =>
      prisma.certificateTemplate.upsert({
        where: { type: template.type },
        update: {
          name: template.name,
          isActive: template.isActive,
          backgroundPath: template.backgroundPath,
          subjectTemplate: template.subjectTemplate,
          bodyTemplate: template.bodyTemplate,
          certificateTextTemplate: template.certificateTextTemplate,
          layoutConfigJson: template.layoutConfigJson,
        },
        create: template,
      }),
    );
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
