import { createHmac, timingSafeEqual } from 'crypto'

export function verifySlackSignature(
  rawBody: string,
  timestamp: string,
  signature: string,
  signingSecret: string
): boolean {
  const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 300
  if (parseInt(timestamp, 10) < fiveMinutesAgo) return false

  const baseString = `v0:${timestamp}:${rawBody}`
  const hmac = createHmac('sha256', signingSecret).update(baseString).digest('hex')
  const expected = `v0=${hmac}`

  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  } catch {
    return false
  }
}

export function extractUrls(text: string): string[] {
  const matches = text.match(/https?:\/\/[^\s<>"]+/gi) || []
  return [...new Set(matches)]
}

export function buildDetectionBlocks(url: string) {
  const hostname = new URL(url).hostname
  return {
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `🔗 *Lien détecté :* \`${hostname}\`\nVeux-tu l'ajouter à la ressourcerie ?`,
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: '+ Ajouter à la BDD outils', emoji: true },
            style: 'primary',
            action_id: 'add_tool',
            value: url,
          },
        ],
      },
    ],
  }
}
