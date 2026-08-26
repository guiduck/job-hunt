export const WHATSAPP_FIRST_CONTACT_TEMPLATE_NAME = "primeiro_contato_site_v1";
export const WHATSAPP_FIRST_CONTACT_TEMPLATE_NAME_EN = "first_contact_website_v1";
export const WHATSAPP_FIRST_CONTACT_CUSTOM_TEXT_MAX_LENGTH = 600;

export const WHATSAPP_FIRST_CONTACT_TEMPLATE_BODY = `Ola {{1}}, tudo bem? Sou {{2}}, desenvolvedor web.

Encontrei a {{3}} em {{4}} e percebi alguns pontos que podem estar reduzindo contatos pelo site e pelo WhatsApp. Trabalho criando {{5}} para negocios locais, com foco em presenca online mais clara e mais pedidos de orcamento.

Para uma primeira versao, o investimento fica {{6}}, com prazo estimado de {{7}} e possibilidade de parcelar em ate {{8}}.

Sobre o caso de voces: {{9}}

Obrigado pela atencao. Se fizer sentido, posso te mandar uma ideia rapida de melhoria por aqui?`;

export const WHATSAPP_FIRST_CONTACT_TEMPLATE_BODY_EN = `Hi {{1}}, how are you? I'm {{2}}, a web developer.

I found {{3}} in {{4}} and noticed a few points that may be reducing contacts through the website and WhatsApp. I create {{5}} for local businesses, focused on clearer online presence and more quote requests.

For a first version, the investment is {{6}}, with an estimated timeline of {{7}} and {{8}}.

About your case: {{9}}

Thanks for your attention. If this makes sense, can I send you a quick improvement idea here?`;

export const WHATSAPP_FIRST_CONTACT_VARIABLES = [
  ["1", "Saudacao do contato"],
  ["2", "Seu nome"],
  ["3", "Nome da empresa"],
  ["4", "Nicho e cidade"],
  ["5", "Servico oferecido"],
  ["6", "Preco inicial"],
  ["7", "Prazo estimado"],
  ["8", "Condicao de pagamento"],
  ["9", "Observacao personalizada pela IA"]
] as const;
