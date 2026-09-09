import {
  WHATSAPP_FIRST_CONTACT_TEMPLATE_BODY,
  WHATSAPP_FIRST_CONTACT_TEMPLATE_BODY_EN,
  WHATSAPP_FIRST_CONTACT_TEMPLATE_NAME,
  WHATSAPP_FIRST_CONTACT_TEMPLATE_NAME_EN
} from "../lib/freelance/whatsapp-template-definition";
import { loadLocalEnv } from "./env";

loadLocalEnv();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const submitForApproval = process.argv.includes("--submit");
const checkStatus = process.argv.includes("--status");

if (!accountSid || !authToken) {
  throw new Error("TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are required.");
}

const templates = [
  {
    envName: "TWILIO_WHATSAPP_TEMPLATE_CONTENT_SID",
    friendlyName: WHATSAPP_FIRST_CONTACT_TEMPLATE_NAME,
    language: "pt_BR",
    body: WHATSAPP_FIRST_CONTACT_TEMPLATE_BODY,
    variables: {
      "1": "Guilherme",
      "2": "Clínica Exemplo",
      "3": "clínica de estética",
      "4": "Brasília",
      "5": "presença online e conversão",
      "6": "o caminho para solicitar um orçamento pode ficar mais claro no celular",
      "7": "R$ 1.800",
      "8": "15 dias",
      "9": "6x sem juros",
      "10": "https://demo.example.com",
      "11": "https://portfolio.example.com"
    }
  },
  {
    envName: "TWILIO_WHATSAPP_TEMPLATE_CONTENT_SID_EN",
    friendlyName: WHATSAPP_FIRST_CONTACT_TEMPLATE_NAME_EN,
    language: "en",
    body: WHATSAPP_FIRST_CONTACT_TEMPLATE_BODY_EN,
    variables: {
      "1": "Guilherme",
      "2": "Example Clinic",
      "3": "healthcare",
      "4": "Austin",
      "5": "online presence and conversion",
      "6": "the booking path could be clearer for visitors using a mobile device",
      "7": "US$ 1,000",
      "8": "15 days",
      "9": "defined after scope review",
      "10": "https://demo.example.com",
      "11": "https://portfolio.example.com"
    }
  }
] as const;

const authorization = `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`;

async function readApprovalStatus(contentSid: string) {
  const response = await fetch(
    `https://content.twilio.com/v1/Content/${contentSid}/ApprovalRequests`,
    { headers: { Authorization: authorization } }
  );
  const result = (await response.json()) as {
    whatsapp?: { status?: string; category?: string; rejection_reason?: string };
    message?: string;
  };
  if (!response.ok) {
    throw new Error(`Twilio status check failed (${response.status}): ${result.message ?? "unknown error"}`);
  }

  return {
    contentSid,
    approvalStatus: result.whatsapp?.status ?? "unsubmitted",
    approvalCategory: result.whatsapp?.category,
    rejectionReason: result.whatsapp?.rejection_reason || undefined
  };
}

async function createAndSubmit(template: (typeof templates)[number]) {
  const createResponse = await fetch("https://content.twilio.com/v1/Content", {
    method: "POST",
    headers: {
      Authorization: authorization,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      friendly_name: template.friendlyName,
      language: template.language,
      variables: template.variables,
      types: { "twilio/text": { body: template.body } }
    })
  });
  const created = (await createResponse.json()) as { sid?: string; code?: number; message?: string };
  if (!createResponse.ok || !created.sid) {
    throw new Error(
      `Twilio template creation failed for ${template.language} (${createResponse.status}): ${created.message ?? created.code ?? "unknown error"}`
    );
  }

  const approvalResponse = await fetch(
    `https://content.twilio.com/v1/Content/${created.sid}/ApprovalRequests/whatsapp`,
    {
      method: "POST",
      headers: {
        Authorization: authorization,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name: template.friendlyName, category: "MARKETING" })
    }
  );
  const approval = (await approvalResponse.json()) as {
    status?: string;
    category?: string;
    rejection_reason?: string;
    message?: string;
  };
  if (!approvalResponse.ok) {
    throw new Error(
      `Template ${created.sid} was created, but approval submission failed (${approvalResponse.status}): ${approval.message ?? approval.rejection_reason ?? "unknown error"}`
    );
  }

  return {
    envName: template.envName,
    contentSid: created.sid,
    friendlyName: template.friendlyName,
    language: template.language,
    approvalStatus: approval.status ?? "received",
    approvalCategory: approval.category ?? "MARKETING"
  };
}

async function main() {
  if (checkStatus) {
    const statuses = [];
    for (const template of templates) {
      const contentSid = process.env[template.envName];
      if (!contentSid) {
        statuses.push({ envName: template.envName, configured: false });
        continue;
      }
      statuses.push({
        envName: template.envName,
        configured: true,
        ...(await readApprovalStatus(contentSid))
      });
    }
    console.log(JSON.stringify(statuses));
    return;
  }

  if (!submitForApproval) {
    console.log(
      JSON.stringify({
        dryRun: true,
        templates: templates.map((template) => ({
          friendlyName: template.friendlyName,
          language: template.language,
          category: "MARKETING",
          variableCount: Object.keys(template.variables).length
        })),
        nextCommand: "npm run twilio:register-portfolio-template -- --submit"
      })
    );
    return;
  }

  for (const template of templates) {
    console.log(JSON.stringify(await createAndSubmit(template)));
  }
}

await main();
