import type { CertificateType, Prisma } from "@prisma/client";
import {
  getCertificatePreset,
  getDefaultEvaluationLabel,
  getDefaultTemplateName,
} from "@/lib/certificate-presets";
import { getDefaultLayout } from "@/lib/certificate-layouts";

export { getCertificateTypeLabel } from "@/lib/certificate-presets";

export function getDefaultTemplateSeed(type: CertificateType): Prisma.CertificateTemplateCreateInput {
  const seed = getDefaultTemplateSeeds().find((item) => item.type === type);
  if (!seed) {
    throw new Error(`Varsayılan şablon bulunamadı: ${type}`);
  }

  return seed;
}

export function getSpecialFieldGuidance(type: CertificateType) {
  const preset = getCertificatePreset(type);

  if (preset.isCustom) {
    return ["Diğer şablonunda başlık, metinler ve etiketler tamamen serbest bırakılır."];
  }

  switch (type) {
    case "HAKEMLIK":
      return ["Makale Adı, Makale ID ve Değerlendirme Tarihi alanları hakemlik şablonlarında kullanılabilir."];
    case "EDITORLUK":
      return ["Makale Adı, Makale ID ve Yayın Basım Tarihi alanları editörlük şablonlarında kullanılabilir."];
    case "YAZARLIK":
      return ["Makale Adı, Makale ID ve Yayın Basım Tarihi alanları yazarlık şablonlarında kullanılabilir."];
    case "DIGER":
      return ["Diğer şablonu ihtiyaç duyulan tüm özel sertifika senaryoları için serbest bırakılır."];
  }
}

export function getDefaultTemplateSeeds(): Array<Prisma.CertificateTemplateCreateInput> {
  return [
    {
      type: "HAKEMLIK",
      name: getDefaultTemplateName("HAKEMLIK"),
      isActive: true,
      backgroundPath: "/certificate-backgrounds/hakemlik.png",
      subjectTemplate: "Hakemlik Sertifikanız - {{MAKALE_ADI}}",
      bodyTemplate:
        "Sayın {{AD}},\n\n{{MAKALE_ADI}} başlıklı çalışma için hazırlanan {{SERTIFIKA_BASLIGI}} kaydınız hazırdır.\n\nSertifika Tarihi: {{TARIH}}\nMakale ID: {{MAKALE_ID}}\nDeğerlendirme Tarihi: {{DEGERLENDIRME_TARIHI}}",
      certificateTextTemplate:
        "{{SERTIFIKA_BASLIGI}} kapsamında {{MAKALE_ADI}} başlıklı çalışma için sağladığınız katkı nedeniyle bu sertifika takdim edilmiştir.",
      layoutConfigJson: JSON.stringify(getDefaultLayout("HAKEMLIK")),
    },
    {
      type: "EDITORLUK",
      name: getDefaultTemplateName("EDITORLUK"),
      isActive: true,
      backgroundPath: "/certificate-backgrounds/editorluk.png",
      subjectTemplate: "Editörlük Sertifikanız - {{MAKALE_ADI}}",
      bodyTemplate:
        "Sayın {{AD}},\n\n{{SERTIFIKA_BASLIGI}} kapsamında {{MAKALE_ADI}} kaydınız için sertifikanız hazırlanmıştır.\n\nSertifika Tarihi: {{TARIH}}\nMakale ID: {{MAKALE_ID}}\nYayın Basım Tarihi: {{DEGERLENDIRME_TARIHI}}",
      certificateTextTemplate:
        "{{SERTIFIKA_BASLIGI}} kapsamında {{MAKALE_ADI}} için göstermiş olduğunuz editöryel katkı nedeniyle bu sertifika takdim edilmiştir.",
      layoutConfigJson: JSON.stringify(getDefaultLayout("EDITORLUK")),
    },
    {
      type: "YAZARLIK",
      name: getDefaultTemplateName("YAZARLIK"),
      isActive: true,
      backgroundPath: "/certificate-backgrounds/yazarlik.png",
      subjectTemplate: "Yazarlık Sertifikanız - {{MAKALE_ADI}}",
      bodyTemplate:
        "Sayın {{AD}},\n\n{{MAKALE_ADI}} başlıklı çalışma için yazarlık sertifikanız hazırlanmıştır.\n\nSertifika Tarihi: {{TARIH}}\nMakale ID: {{MAKALE_ID}}\nYayın Basım Tarihi: {{DEGERLENDIRME_TARIHI}}",
      certificateTextTemplate:
        "{{SERTIFIKA_BASLIGI}} kapsamında {{MAKALE_ADI}} başlıklı çalışmanız nedeniyle bu sertifika takdim edilmiştir.",
      layoutConfigJson: JSON.stringify(getDefaultLayout("YAZARLIK")),
    },
    {
      type: "DIGER",
      name: getDefaultTemplateName("DIGER"),
      isActive: true,
      backgroundPath: "/certificate-backgrounds/editorluk.png",
      subjectTemplate: "Sertifikanız Hazır - {{SERTIFIKA_BASLIGI}}",
      bodyTemplate:
        `Sayın {{AD}},\n\n{{SERTIFIKA_BASLIGI}} kaydınız hazırlanmıştır.\n\nSertifika Tarihi: {{TARIH}}\nMakale ID: {{MAKALE_ID}}\n${getDefaultEvaluationLabel("DIGER")}: {{DEGERLENDIRME_TARIHI}}`,
      certificateTextTemplate:
        "{{SERTIFIKA_BASLIGI}} kapsamında {{MAKALE_ADI}} için sunduğunuz katkı nedeniyle bu sertifika takdim edilmiştir.",
      layoutConfigJson: JSON.stringify(getDefaultLayout("DIGER")),
    },
  ];
}
