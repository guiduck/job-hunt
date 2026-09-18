export const WHATSAPP_FIRST_CONTACT_TEMPLATE_NAME = "primeiro_contato_site_portfolio_v2";
export const WHATSAPP_FIRST_CONTACT_TEMPLATE_NAME_EN = "first_contact_website_portfolio_v2";
export const TWILIO_WHATSAPP_MESSAGE_MAX_LENGTH = 1600;
export const WHATSAPP_FIRST_CONTACT_CUSTOM_TEXT_MAX_LENGTH = 240;

export const WHATSAPP_FIRST_CONTACT_TEMPLATE_BODY = `Olá! Sou {{1}}, desenvolvedor web.

Eu desenvolvi uma ferramenta de análise avançada para avaliar a presença online de empresas de diversos nichos. Ao analisar a {{2}}, do segmento de {{3}} em {{4}}, identifiquei uma oportunidade relacionada a {{5}}: {{6}}.

Desenvolvo websites, landing pages, sistemas personalizados e automações de atendimento para ajudar seus novos clientes a encontrarem sua empresa no Google, entenderem melhor seus serviços e entrarem em contato com mais facilidade.

Sites e landing pages começam em {{7}}, com primeira versão em cerca de {{8}} e parcelamento em até {{9}}. O valor varia conforme o escopo. Se preferirem validar a ideia antes, também posso preparar um protótipo de baixo custo.

Também preparei um exemplo de projeto para este segmento, que vocês podem visualizar aqui: {{10}}

Se essa proposta fizer sentido para vocês, ficarei feliz em marcar uma breve conversa para conhecer melhor o momento da empresa e discutirmos a solução mais adequada.

Atenciosamente,
{{1}}
{{11}}

Obrigado pela atenção.`;

export const WHATSAPP_FIRST_CONTACT_TEMPLATE_BODY_EN = `Hello! I'm {{1}}, a web developer.

I developed an advanced analysis tool to assess the online presence of businesses across different industries. After analyzing {{2}}, a {{3}} business in {{4}}, I identified an opportunity related to {{5}}: {{6}}.

I develop websites, landing pages, custom business systems, and customer-service automations to help new customers find your business on Google, better understand your services, and contact you more easily.

Websites and landing pages start at {{7}}, with an initial version in about {{8}}. Payment terms are {{9}}. Pricing varies depending on the scope. If you would prefer to validate the idea first, I can also prepare a low-cost prototype.

I also prepared a project example for this industry, which you can view here: {{10}}

If this proposal makes sense for you, I would be happy to arrange a brief conversation to better understand your business's current situation and discuss the most suitable solution.

Kind regards,
{{1}}
{{11}}

Thank you for your time.`;

export const WHATSAPP_FIRST_CONTACT_VARIABLES_PT = [
  ["1", "Seu nome"],
  ["2", "Nome da empresa"],
  ["3", "Nicho"],
  ["4", "Cidade"],
  ["5", "Área da oportunidade"],
  ["6", "Observação personalizada pela IA"],
  ["7", "Preço inicial"],
  ["8", "Prazo estimado"],
  ["9", "Condição de pagamento"],
  ["10", "Link da demo do nicho"],
  ["11", "Links e contatos do vendedor"]
] as const;

export const WHATSAPP_FIRST_CONTACT_VARIABLES_EN = [
  ["1", "Seu nome"],
  ["2", "Nome da empresa"],
  ["3", "Nicho"],
  ["4", "Cidade"],
  ["5", "Área da oportunidade"],
  ["6", "Observação personalizada pela IA"],
  ["7", "Preço inicial"],
  ["8", "Prazo estimado"],
  ["9", "Condição de pagamento"],
  ["10", "Link da demo do nicho"],
  ["11", "Links e contatos do vendedor"]
] as const;

export const WHATSAPP_FIRST_CONTACT_VARIABLES = WHATSAPP_FIRST_CONTACT_VARIABLES_PT;

type WhatsAppFirstContactLanguage = "pt-BR" | "en";

function normalizeTemplateVariable(value: string) {
  return value
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncateTemplateVariable(value: string, maxLength: number) {
  const normalized = normalizeTemplateVariable(value);
  if (normalized.length <= maxLength) return normalized;
  if (maxLength <= 3) return normalized.slice(0, Math.max(0, maxLength));

  const available = maxLength - 3;
  const slice = normalized.slice(0, available).trimEnd();
  const lastSpace = slice.lastIndexOf(" ");
  const text = lastSpace >= Math.floor(available * 0.6) ? slice.slice(0, lastSpace) : slice;
  return `${text.trimEnd()}...`;
}

export function renderWhatsAppFirstContactTemplate(
  language: WhatsAppFirstContactLanguage,
  variables: Record<string, string>
) {
  let message = language === "en"
    ? WHATSAPP_FIRST_CONTACT_TEMPLATE_BODY_EN
    : WHATSAPP_FIRST_CONTACT_TEMPLATE_BODY;

  for (const [key, value] of Object.entries(variables)) {
    message = message.replaceAll(`{{${key}}}`, value);
  }

  return message;
}

export function fitWhatsAppFirstContactTemplateVariables(
  language: WhatsAppFirstContactLanguage,
  variables: Record<string, string>
) {
  const fitted = Object.fromEntries(
    Object.entries(variables).map(([key, value]) => [key, normalizeTemplateVariable(value)])
  );
  fitted["6"] = truncateTemplateVariable(
    fitted["6"] ?? "",
    WHATSAPP_FIRST_CONTACT_CUSTOM_TEXT_MAX_LENGTH
  );

  let message = renderWhatsAppFirstContactTemplate(language, fitted);
  if (message.length > TWILIO_WHATSAPP_MESSAGE_MAX_LENGTH) {
    fitted["11"] = language === "en" ? "You can reply here." : "Pode responder por aqui.";
    message = renderWhatsAppFirstContactTemplate(language, fitted);
  }

  const shrinkOrder: Array<[string, number]> = [
    ["6", 32],
    ["2", 12],
    ["3", 8],
    ["4", 8],
    ["5", 12],
    ["9", 8],
    ["1", 4]
  ];
  for (const [key, minimumLength] of shrinkOrder) {
    const overflow = message.length - TWILIO_WHATSAPP_MESSAGE_MAX_LENGTH;
    if (overflow <= 0) break;
    const current = fitted[key] ?? "";
    const nextLength = Math.max(minimumLength, current.length - overflow);
    fitted[key] = truncateTemplateVariable(current, nextLength);
    message = renderWhatsAppFirstContactTemplate(language, fitted);
  }

  return {
    variables: fitted,
    message,
    length: message.length,
    fits: message.length <= TWILIO_WHATSAPP_MESSAGE_MAX_LENGTH
  };
}
