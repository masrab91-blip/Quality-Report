import { z } from "zod";

export const DEFECT_TYPE_LABELS = {
  CHIPPED_CRACKED: "Chipped / Cracked",
  WRONG_COLOR_SHADE: "Wrong Color / Shade",
  WRONG_PRODUCT_SHIPPED: "Wrong Product Shipped",
  SHORT_OVER_SHIPMENT: "Short / Over Shipment",
  DAMAGED_IN_TRANSIT: "Damaged in Transit",
  EFFLORESCENCE_STAINING: "Efflorescence / Staining",
  DIMENSIONAL_SIZE_ISSUE: "Dimensional / Size Issue",
  OTHER: "Other",
} as const;

export const PRIORITY_LABELS = {
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
} as const;

export const STAGE_LABELS = {
  SUBMITTED: "Submitted",
  REVIEWED: "Reviewed",
  RESOLVED: "Resolved",
} as const;

export const STAGE_ORDER = ["SUBMITTED", "REVIEWED", "RESOLVED"] as const;

type DefectTypeKey = keyof typeof DEFECT_TYPE_LABELS;
type PriorityKey = keyof typeof PRIORITY_LABELS;

const defectTypeValues = Object.keys(DEFECT_TYPE_LABELS) as [DefectTypeKey, ...DefectTypeKey[]];
const priorityValues = Object.keys(PRIORITY_LABELS) as [PriorityKey, ...PriorityKey[]];

const MAX_PHOTOS = 10;
const MAX_PHOTO_BYTES = 10 * 1024 * 1024; // 10MB
const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

export const intakeSchema = z.object({
  customer: z.string().trim().min(1, "Customer is required"),
  jobsite: z.string().trim().optional(),
  po: z.string().trim().optional(),
  vendor: z.string().trim().optional(),
  product: z.string().trim().optional(),
  colorLot: z.string().trim().optional(),
  qty: z.coerce.number().int().positive().optional(),
  defectType: z.enum(defectTypeValues),
  priority: z.enum(priorityValues),
  jobStopped: z.coerce.boolean().default(false),
  description: z.string().trim().min(1, "Description is required"),
});

export type IntakeInput = z.infer<typeof intakeSchema>;

export const reportEditSchema = z.object({
  customer: z.string().trim().min(1, "Customer is required"),
  jobsite: z.string().trim().optional(),
  po: z.string().trim().optional(),
  vendor: z.string().trim().optional(),
  product: z.string().trim().optional(),
  colorLot: z.string().trim().optional(),
  qty: z.coerce.number().int().positive().optional(),
  defectType: z.enum(defectTypeValues),
  priority: z.enum(priorityValues),
  jobStopped: z.coerce.boolean().default(false),
  description: z.string().trim().min(1, "Description is required"),
  reportedBy: z.string().trim().optional(),
  dateReported: z.string().trim().optional(),
  deliveryDate: z.string().trim().optional(),
  bolNumber: z.string().trim().optional(),
  rootCause: z.string().trim().optional(),
  investigatedBy: z.string().trim().optional(),
  resolution: z.string().trim().optional(),
  vendorClaimFiled: z.coerce.boolean().default(false),
  claimRmaNumber: z.string().trim().optional(),
  creditAmount: z.coerce.number().nonnegative().optional(),
  closedBy: z.string().trim().optional(),
  dateClosed: z.string().trim().optional(),
});

export type ReportEditInput = z.infer<typeof reportEditSchema>;

export function validatePhotoFiles(files: File[]): string | null {
  if (files.length > MAX_PHOTOS) {
    return `You can attach at most ${MAX_PHOTOS} photos.`;
  }
  for (const file of files) {
    if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
      return `"${file.name}" isn't a supported image type.`;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      return `"${file.name}" is larger than the 10MB limit.`;
    }
  }
  return null;
}
