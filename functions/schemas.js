const { z } = require("zod");

// Aligned with Frontend types
const receptionSchema = z.object({
    attendee: z.object({
        name: z.string().min(1, "Name is required"),
        furigana: z.string().optional(),
        school: z.string().optional(),
        grade: z.string().optional(), // accepted as string "grade1" etc.
        companions: z.number().int().min(0).default(0),
        reserved: z.boolean().optional(),
    }),
    selections: z.array(z.object({
        id: z.string(),
        title: z.string().optional(),
    })).max(3),
    notes: z.string().optional(),
    status: z.enum(["waiting", "completed", "canceled"]).default("waiting"),
});

const translateSchema = z.object({
    text: z.string().min(1),
    targetLang: z.string().min(2),
});

module.exports = {
    receptionSchema,
    translateSchema,
};
