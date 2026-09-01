export const WHATSAPP_FIRST_CONTACT_TEMPLATE_NAME = "primeiro_contato_site_v2";
export const WHATSAPP_FIRST_CONTACT_TEMPLATE_NAME_EN = "first_contact_website_v2";
export const WHATSAPP_FIRST_CONTACT_CUSTOM_TEXT_MAX_LENGTH = 240;

export const WHATSAPP_FIRST_CONTACT_TEMPLATE_BODY = `Olá! Sou {{1}}, desenvolvedor web.

Eu desenvolvi uma ferramenta de análise avançada para avaliar a presença online de empresas de diversos nichos. Ao analisar a {{2}}, do segmento de {{3}} em {{4}}, identifiquei uma oportunidade relacionada a {{5}}: {{6}}.

Desenvolvo websites, landing pages, sistemas personalizados e automações de atendimento para ajudar seus novos clientes a encontrarem sua empresa no Google, entenderem melhor seus serviços e entrarem em contato com mais facilidade.

Sites e landing pages começam em {{7}}, com primeira versão em cerca de {{8}} e parcelamento em até {{9}}. O valor varia conforme o escopo. Se preferirem validar a ideia antes, também posso preparar um protótipo de baixo custo.

Se essa proposta fizer sentido para vocês, ficarei feliz em marcar uma breve conversa para conhecer melhor o momento da empresa e discutirmos a solução mais adequada.

Atenciosamente,
{{1}}
{{10}}

Obrigado pela atenção.`;

export const WHATSAPP_FIRST_CONTACT_TEMPLATE_BODY_EN = `Hello! I'm {{1}}, a web developer.

I developed an advanced analysis tool to assess the online presence of businesses across different industries. After analyzing {{2}}, a {{3}} business in {{4}}, I identified an opportunity related to {{5}}: {{6}}.

I build websites, landing pages, custom business systems, and customer-service automations to help your potential customers find your business on Google, better understand your services, and contact you more easily.

Websites and landing pages start at {{7}}, with an initial version in about {{8}}. {{9}}. Pricing varies depending on the scope. If you would prefer to validate the idea first, I can also prepare a low-cost prototype.

If this proposal makes sense for you, I would be happy to arrange a brief conversation to better understand your business's current situation and discuss the most suitable solution.

Kind regards,
{{1}}
{{10}}

Thank you for your time.`;

export const WHATSAPP_FIRST_CONTACT_VARIABLES = [
  ["1", "Nome do desenvolvedor"],
  ["2", "Nome da empresa"],
  ["3", "Nicho da campanha"],
  ["4", "Cidade ou região"],
  ["5", "Categoria predefinida do serviço"],
  ["6", "Diagnóstico específico do lead"],
  ["7", "Preço inicial"],
  ["8", "Prazo estimado"],
  ["9", "Condição de pagamento"],
  ["10", "Website ou portfólio"]
] as const;
