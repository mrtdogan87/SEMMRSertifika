import type { CertificateType } from "@prisma/client";

export type CertificateLayout = {
  pageWidth: number;
  pageHeight: number;
  backgroundInset: number;
  name: { x: number; y: number; size: number };
  message: { x: number; y: number; size: number; width: number; lineHeight: number };
  event: { x: number; y: number; size: number };
  date: { x: number; y: number; size: number };
  organizer: { x: number; y: number; size: number };
};

const baseLayout: CertificateLayout = {
  pageWidth: 842,
  pageHeight: 595,
  backgroundInset: 0,
  name: { x: 421, y: 340, size: 30 },
  message: { x: 421, y: 287, size: 14, width: 460, lineHeight: 19 },
  event: { x: 421, y: 228, size: 20 },
  date: { x: 421, y: 120, size: 15 },
  organizer: { x: 421, y: 96, size: 14 },
};

export function getDefaultLayout(type: CertificateType): CertificateLayout {
  switch (type) {
    case "HAKEMLIK":
      return {
        ...baseLayout,
        name: { ...baseLayout.name, size: 31 },
      };
    case "REKTORLUK":
      return {
        ...baseLayout,
        message: { ...baseLayout.message, width: 500 },
      };
    case "YAZARLIK":
      return {
        ...baseLayout,
        event: { ...baseLayout.event, size: 18 },
      };
  }
}
