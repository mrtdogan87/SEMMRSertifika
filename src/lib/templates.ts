import type { CertificateType, Prisma } from "@prisma/client";
import { getDefaultLayout } from "@/lib/certificate-layouts";

export function getDefaultTemplateSeeds(): Array<Prisma.CertificateTemplateCreateInput> {
  return [
    {
      type: "HAKEMLIK",
      name: "Hakemlik Sertifikası",
      isActive: true,
      backgroundPath: "/certificate-backgrounds/hakemlik.png",
      subjectTemplate: "Hakemlik Sertifikanız - {{ETKINLIK}}",
      bodyTemplate:
        "Sayın {{AD}},\n\n{{ETKINLIK}} etkinliğine verdiğiniz hakemlik katkısı için sertifikanız ekte/ekranınızda hazırdır.\n\n{{DUZENLEYICI}}",
      certificateTextTemplate:
        "{{DUZENLEYICI}} tarafından düzenlenen {{ETKINLIK}} kapsamında hakemlik katkılarınız için bu sertifika takdim edilmiştir.",
      layoutConfigJson: getDefaultLayout("HAKEMLIK"),
    },
    {
      type: "REKTORLUK",
      name: "Rektörlük Sertifikası",
      isActive: true,
      backgroundPath: "/certificate-backgrounds/rektorluk.png",
      subjectTemplate: "Rektörlük Sertifikanız - {{ETKINLIK}}",
      bodyTemplate:
        "Sayın {{AD}},\n\n{{ETKINLIK}} etkinliğindeki katkınız için sertifikanız hazırlanmıştır.\n\n{{DUZENLEYICI}}",
      certificateTextTemplate:
        "{{DUZENLEYICI}} tarafından {{ETKINLIK}} etkinliği kapsamında göstermiş olduğunuz katkı için bu sertifika takdim edilmiştir.",
      layoutConfigJson: getDefaultLayout("REKTORLUK"),
    },
    {
      type: "YAZARLIK",
      name: "Yazarlık Sertifikası",
      isActive: true,
      backgroundPath: "/certificate-backgrounds/yazarlik.png",
      subjectTemplate: "Yazarlık Sertifikanız - {{ETKINLIK}}",
      bodyTemplate:
        "Sayın {{AD}},\n\n{{ETKINLIK}} etkinliği için yazarlık sertifikanız hazırlanmıştır.\n\n{{DUZENLEYICI}}",
      certificateTextTemplate:
        "{{ETKINLIK}} kapsamında sunduğunuz yazarlık katkısı nedeniyle bu sertifika {{DUZENLEYICI}} tarafından takdim edilmiştir.",
      layoutConfigJson: getDefaultLayout("YAZARLIK"),
    },
  ];
}

export function getCertificateTypeLabel(type: CertificateType) {
  switch (type) {
    case "HAKEMLIK":
      return "Hakemlik";
    case "REKTORLUK":
      return "Rektörlük";
    case "YAZARLIK":
      return "Yazarlık";
  }
}
