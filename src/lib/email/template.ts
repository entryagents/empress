export interface EmailTemplateOptions {
  customerName: string;
  orderReference?: string;
  headline: string;
  subheadline?: string;
  bodyHtml: string;
  ctaText?: string;
  ctaUrl?: string;
  detailsTable?: { label: string; value: string }[];
}

export function renderBrandedEmailTemplate({
  customerName,
  orderReference,
  headline,
  subheadline,
  bodyHtml,
  ctaText,
  ctaUrl,
  detailsTable,
}: EmailTemplateOptions): string {
  const brandDark = "#200510"; // Wine 950
  const brandGold = "#d4b377"; // Champagne Gold
  const brandBg = "#fbf7ef"; // Ivory 50

  const detailsRows = detailsTable
    ? detailsTable
        .map(
          (row) => `
        <tr>
          <td style="padding: 10px 14px; font-size: 13px; color: #5a2033; font-weight: 600; border-bottom: 1px solid rgba(32,5,16,0.08);">${row.label}</td>
          <td style="padding: 10px 14px; font-size: 13px; color: #200510; text-align: right; border-bottom: 1px solid rgba(32,5,16,0.08); font-family: monospace;">${row.value}</td>
        </tr>`
        )
        .join("")
    : "";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${headline}</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${brandBg}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: ${brandDark};">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: ${brandBg}; padding: 32px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 6px; overflow: hidden; box-shadow: 0 4px 20px rgba(32,5,16,0.06); border: 1px solid rgba(212,179,119,0.3);">
          <!-- Header Banner -->
          <tr>
            <td style="background-color: ${brandDark}; padding: 36px 32px; text-align: center;">
              <span style="font-family: Georgia, serif; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: ${brandGold}; text-transform: uppercase;">
                EMPRESS
              </span>
              <p style="margin: 6px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #fbf7ef; opacity: 0.8;">
                Delicacies · Delta State
              </p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 36px 32px;">
              <h1 style="margin: 0 0 8px 0; font-family: Georgia, serif; font-size: 22px; font-weight: normal; color: ${brandDark};">
                ${headline}
              </h1>
              ${
                subheadline
                  ? `<p style="margin: 0 0 20px 0; font-size: 14px; color: #722f46; font-weight: 500;">${subheadline}</p>`
                  : ""
              }
              <div style="font-size: 14px; line-height: 1.6; color: #3b0d1e;">
                ${bodyHtml}
              </div>

              ${
                detailsRows
                  ? `
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 24px 0; border: 1px solid rgba(32,5,16,0.08); border-radius: 4px; background-color: #faf5ec;">
                  ${detailsRows}
                </table>`
                  : ""
              }

              ${
                ctaText && ctaUrl
                  ? `
                <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 30px 0 10px 0;">
                  <tr>
                    <td align="center" style="border-radius: 4px; background-color: ${brandDark};">
                      <a href="${ctaUrl}" target="_blank" style="display: inline-block; padding: 13px 28px; font-size: 13px; font-weight: bold; color: ${brandGold}; text-decoration: none; text-transform: uppercase; letter-spacing: 1px;">
                        ${ctaText}
                      </a>
                    </td>
                  </tr>
                </table>`
                  : ""
              }

              <p style="margin: 28px 0 0 0; font-size: 13px; color: #722f46; font-style: italic;">
                Warm regards,<br>
                <strong>The Empress Delicacies Team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #faf5ec; padding: 20px 32px; border-top: 1px solid rgba(32,5,16,0.08); text-align: center; font-size: 11px; color: #722f46;">
              <p style="margin: 0;">
                Empress Delicacies · Warri · Asaba · Ughelli · Benin · Abraka
              </p>
              <p style="margin: 4px 0 0 0; opacity: 0.7;">
                Fresh Nigerian Culinary Specialties · Contact: +234 800 000 0000
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
