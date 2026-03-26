import { prisma } from "../src/lib/prisma";
import { ensureBootstrapAdmin } from "../src/lib/admin-user";
import { getDefaultTemplateSeeds } from "../src/lib/templates";

async function main() {
  const admin = await ensureBootstrapAdmin();

  for (const template of getDefaultTemplateSeeds()) {
    await prisma.certificateTemplate.upsert({
      where: { type: template.type },
      update: template,
      create: template,
    });
  }

  console.log("Bootstrap tamamlandı.", admin?.email ?? "Admin oluşturulmadı.");
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
