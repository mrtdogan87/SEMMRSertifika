import { prisma } from "../src/lib/prisma";
import { ensureBootstrapAdmin } from "../src/lib/admin-user";
import { getDefaultTemplateSeeds } from "../src/lib/templates";

async function main() {
  await ensureBootstrapAdmin();

  for (const template of getDefaultTemplateSeeds()) {
    await prisma.certificateTemplate.upsert({
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
    });
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
