export type NoxeCompanyProfile = {
  companyName: string;
  starterStory: string;
  differentiators: string[];
  voice: string[];
  brochureGuidance: string[];
  commercialGuidance: string[];
  neverInvent: string[];
};

export const noxeCompanyProfile: NoxeCompanyProfile = {
  companyName: "Noxe",
  starterStory:
    "Noxe helps clients turn technical scope into clear, executable commercial projects through disciplined proposals, practical coordination, and delivery-oriented communication.",
  differentiators: [
    "Keep proposals commercially clear without losing technical detail.",
    "Translate workbook/field scope into a quote structure the client can approve quickly.",
    "Balance equipment, cabling, labor, and execution context in one proposal.",
    "Write in a tone that feels premium, concise, and grounded in execution.",
  ],
  voice: [
    "Confident and technically credible, but never bloated or theatrical.",
    "Commercially clear: explain scope, exclusions, and totals plainly.",
    "Use short paragraphs and direct language in brochure-style pages.",
    "When the user writes in French, produce polished business French by default.",
  ],
  brochureGuidance: [
    "Use the starter story as brand framing, not as a source of hard facts.",
    "For About Us, focus on clarity, rigor, responsiveness, and coordination.",
    "For Culture, emphasize working style and client experience rather than slogans.",
    "For Leadership Note, keep it short, credible, and tied to project outcomes.",
    "For Team or Partners, ask for names, roles, logos, or credentials unless already stored.",
  ],
  commercialGuidance: [
    "Every production-ready quote must include payment terms and explicit exclusions.",
    "Default toward a deposit at signature; the preferred payment structures are 35/15/40/10 or 35/65 according to project cadence.",
    "Be strict on exclusions: anything supplied, installed, programmed, coordinated, or paid by others should be stated plainly.",
    "Do not create filler notes or special conditions; include those sections only when the documents or user provide meaningful content.",
  ],
  neverInvent: [
    "Founding year, company size, certifications, office locations, or headcount.",
    "Named team members, titles, signatures, or biographies.",
    "Partner logos, manufacturer relationships, or badges not explicitly provided.",
    "Warranty or legal commitments that the user did not confirm.",
    "Payment commitments beyond Noxe's approved default schedules or explicit user confirmation.",
  ],
};
