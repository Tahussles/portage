import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { DocExtraction, DocType } from "@/lib/engine/types";
import { anthropicModel, ExtractionError, getAnthropicClient } from "./anthropic";

// Server only. Reads one uploaded document; findings are produced by docRules, never by the model.

export const DOC_TYPES: DocType[] = [
  "education_transcript",
  "diploma",
  "nursing_licence",
  "employment_letter",
  "registration_verification",
  "criminal_record_check",
  "language_test_report",
  "identity_document",
  "other",
];

export type DocMediaType = "application/pdf" | "image/png" | "image/jpeg";

export const DOCUMENT_SYSTEM_PROMPT = `You read one document uploaded by a nurse preparing a registration application. Extract only what is visible.
Return: docType, nameOnDocument (the person's full name exactly as printed), issueDate (ISO YYYY-MM-DD, or YYYY-MM if only the month is printed, or null), documentLanguage (ISO 639-1 code of the main language), issuer, and a one-sentence description in English.
Never infer values that are not printed on the document. Call extract_document exactly once.`;

export const extractDocumentTool: Anthropic.Tool = {
  name: "extract_document",
  description: "Record the fields printed on the uploaded document.",
  input_schema: {
    type: "object",
    properties: {
      docType: { type: "string", enum: DOC_TYPES },
      nameOnDocument: { type: ["string", "null"] },
      issueDate: { type: ["string", "null"], description: "YYYY-MM-DD or YYYY-MM" },
      documentLanguage: { type: ["string", "null"], description: "ISO 639-1" },
      issuer: { type: ["string", "null"] },
      description: { type: "string" },
    },
    required: ["docType", "description"],
  },
};

const opt = <T extends z.ZodType>(schema: T) => schema.nullable().optional().catch(null);

export const docExtractionSchema = z.object({
  docType: z.enum(DOC_TYPES as [DocType, ...DocType[]]).catch("other"),
  nameOnDocument: opt(z.string().trim().min(1).max(200)),
  issueDate: opt(z.string().regex(/^\d{4}-(0[1-9]|1[0-2])(-(0[1-9]|[12]\d|3[01]))?$/)),
  documentLanguage: opt(z.string().regex(/^[A-Za-z]{2}$/).transform((s) => s.toLowerCase())),
  issuer: opt(z.string().trim().min(1).max(300)),
  description: z.string().max(500).catch(""),
});

export function toDocExtraction(input: z.infer<typeof docExtractionSchema>): DocExtraction {
  return {
    docType: input.docType,
    nameOnDocument: input.nameOnDocument ?? null,
    issueDate: input.issueDate ?? null,
    documentLanguage: input.documentLanguage ?? null,
    issuer: input.issuer ?? null,
    description: input.description,
  };
}

export async function extractDocumentWithClaude(
  file: { data: Uint8Array; mediaType: DocMediaType },
  deps: { client?: Pick<Anthropic, "messages"> } = {},
): Promise<DocExtraction> {
  const data = Buffer.from(file.data).toString("base64");
  const block: Anthropic.ContentBlockParam =
    file.mediaType === "application/pdf"
      ? { type: "document", source: { type: "base64", media_type: "application/pdf", data } }
      : { type: "image", source: { type: "base64", media_type: file.mediaType, data } };

  const response = await (deps.client ?? getAnthropicClient()).messages.create({
    model: anthropicModel(),
    max_tokens: 1000,
    thinking: { type: "disabled" },
    system: DOCUMENT_SYSTEM_PROMPT,
    tools: [extractDocumentTool],
    tool_choice: { type: "tool", name: extractDocumentTool.name },
    messages: [{ role: "user", content: [block, { type: "text", text: "Extract the fields from this document." }] }],
  });

  if (response.stop_reason === "refusal") throw new ExtractionError("Model declined the request");
  const call = response.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === extractDocumentTool.name,
  );
  if (!call) throw new ExtractionError(`No extract_document call (stop_reason: ${response.stop_reason})`);
  const parsed = docExtractionSchema.safeParse(call.input);
  if (!parsed.success) throw new ExtractionError("Document extraction failed validation");
  return toDocExtraction(parsed.data);
}
