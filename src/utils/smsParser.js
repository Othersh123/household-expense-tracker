/**
 * Regex-based parser for Indian bank SMS formats.
 * Supports HDFC, ICICI, Axis, SBI, Kotak, RBL, Yes Bank, IndusInd, IDFC First.
 */

const PATTERNS = [
  // HDFC Debit/Credit
  // "Rs.500.00 debited from a/c xx1234 on 17-Apr-25 trf to AMAZON. UPI:123456789"
  {
    bank: 'HDFC',
    regex: /(?:Rs\.?|INR\s?)(\d+(?:\.\d{1,2})?)\s+(?:debited|credited)\s+(?:from|to)\s+(?:a\/c\s*(?:xx|XX)?(\w+))?.*?(?:trf\s+to|at|UPI[:\s])\s*([A-Za-z0-9\s&.-]+?)(?:\.|UPI:|Ref|$)/i,
    map: (m) => ({
      amount: parseFloat(m[1]),
      account: m[2] ? `xx${m[2]}` : '',
      merchant: m[3]?.trim() || '',
      paymentMethod: /UPI/i.test(m[0]) ? 'UPI' : 'Debit Card',
    }),
  },
  // HDFC Credit Card
  // "HDFC Bank Credit Card ending 1234 has been used for Rs.1,500.00 at SWIGGY on 2025-04-17"
  {
    bank: 'HDFC',
    regex: /Credit Card ending (\d+) has been used for (?:Rs\.?|INR\s?)([\d,]+(?:\.\d{1,2})?) at ([A-Za-z0-9\s&.-]+?) on ([\d-]+)/i,
    map: (m) => ({
      amount: parseFloat(m[2].replace(',', '')),
      account: `xx${m[1]}`,
      merchant: m[3]?.trim() || '',
      date: m[4],
      paymentMethod: 'Credit Card',
    }),
  },
  // HDFC UPI Card (Txn RS. format)
  // "Txn RS.310.00 On HDFC Bank Card 2098 At q835453666@ybl by UPI 121773764333 On 18-04 ..."
  {
    bank: 'HDFC',
    regex: /Txn\s+RS?\.(\d+(?:\.\d{1,2})?)\s+On\s+(HDFC\s+Bank\s+(?:(?:Credit|Debit)\s+)?Card)\s+(\d+)\s+At\s+(\S+)\s+by\s+(UPI)\s+\d+\s+On\s+(\d{1,2}-\d{1,2})/i,
    map: (m) => ({
      amount: parseFloat(m[1]),
      account: `${m[2]} ${m[3]}`,
      merchant: m[4],
      date: m[6],
      paymentMethod: 'UPI',
    }),
  },
  // ICICI
  // "ICICI Bank Acct XX123 debited for Rs 250.00 on 17-Apr-25; Info: UPI/ZOMATO/ref123"
  {
    bank: 'ICICI',
    regex: /ICICI Bank Acct (?:XX)?(\w+) debited for (?:Rs\.?|INR\s?)([\d,]+(?:\.\d{1,2})?) on ([\d\w-]+);?\s*Info:\s*(?:UPI\/)?([A-Za-z0-9\s&.-]+?)(?:\/|$)/i,
    map: (m) => ({
      amount: parseFloat(m[2].replace(',', '')),
      account: `XX${m[1]}`,
      merchant: m[4]?.trim() || '',
      date: m[3],
      paymentMethod: 'UPI',
    }),
  },
  // ICICI Credit Card
  // "ICICI Bank Credit Card XX1234 used for Rs.5000.00 at BigBasket on Apr 17, 2025"
  {
    bank: 'ICICI',
    regex: /ICICI Bank Credit Card (?:XX)?(\w+) used for (?:Rs\.?|INR\s?)([\d,]+(?:\.\d{1,2})?) at ([A-Za-z0-9\s&.-]+?) on ([\w\s,]+\d{4})/i,
    map: (m) => ({
      amount: parseFloat(m[2].replace(',', '')),
      account: `XX${m[1]}`,
      merchant: m[3]?.trim() || '',
      date: m[4],
      paymentMethod: 'Credit Card',
    }),
  },
  // Axis Bank
  // "Axis Bank: Rs.300.00 debited from Account ending 5678 for UPI txn. Merchant: UBER"
  {
    bank: 'Axis',
    regex: /Axis Bank:?\s*(?:Rs\.?|INR\s?)([\d,]+(?:\.\d{1,2})?) debited from Account ending (\d+).*?(?:Merchant:|at)\s*([A-Za-z0-9\s&.-]+?)(?:\.|$)/i,
    map: (m) => ({
      amount: parseFloat(m[1].replace(',', '')),
      account: `xx${m[2]}`,
      merchant: m[3]?.trim() || '',
      paymentMethod: /UPI/i.test(m[0]) ? 'UPI' : 'Debit Card',
    }),
  },
  // SBI
  // "Your A/c No. XX1234 is debited for Rs.750.00 on 17/04/25 transfer to FLIPKART UPI Ref:123456"
  {
    bank: 'SBI',
    regex: /A\/c No\.?\s*(?:XX)?(\w+) is debited for (?:Rs\.?|INR\s?)([\d,]+(?:\.\d{1,2})?) on ([\d\/]+) transfer to ([A-Za-z0-9\s&.-]+?)(?:\s+UPI|\s+Ref|$)/i,
    map: (m) => ({
      amount: parseFloat(m[2].replace(',', '')),
      account: `XX${m[1]}`,
      merchant: m[4]?.trim() || '',
      date: m[3],
      paymentMethod: 'UPI',
    }),
  },
  // SBI Credit Card
  // "SBI Card ending 1234: Rs 2000.00 spent at AMAZON on 17-04-2025"
  {
    bank: 'SBI',
    regex: /SBI Card ending (\d+):?\s*(?:Rs\.?|INR\s?)([\d,]+(?:\.\d{1,2})?) spent at ([A-Za-z0-9\s&.-]+?) on ([\d-]+)/i,
    map: (m) => ({
      amount: parseFloat(m[2].replace(',', '')),
      account: `xx${m[1]}`,
      merchant: m[3]?.trim() || '',
      date: m[4],
      paymentMethod: 'Credit Card',
    }),
  },
  // Kotak
  // "Kotak Bank: INR 500.00 debited from a/c xx5678 on 17-Apr-25. Info: UPI/MYNTRA"
  {
    bank: 'Kotak',
    regex: /Kotak Bank:?\s*(?:INR|Rs\.?)\s*([\d,]+(?:\.\d{1,2})?) debited from a\/c (?:xx|XX)?(\w+) on ([\d\w-]+)\.? Info:\s*(?:UPI\/)?([A-Za-z0-9\s&.-]+?)(?:\/|$)/i,
    map: (m) => ({
      amount: parseFloat(m[1].replace(',', '')),
      account: `xx${m[2]}`,
      merchant: m[4]?.trim() || '',
      date: m[3],
      paymentMethod: 'UPI',
    }),
  },
  // RBL Bank Credit Card — "INR242.00 spent at SWIGGY on RBL Bank credit card (2611) on 15-04-2026"
  {
    bank: 'RBL',
    regex: /INR([\d,]+(?:\.\d{1,2})?)\s+spent\s+at\s+([A-Za-z0-9\s&./-]+?)\s+on\s+RBL\s+Bank\s+credit\s+card\s+\((\d+)\)\s+on\s+([\d-]+)/i,
    map: (m) => ({
      amount: parseFloat(m[1].replace(',', '')),
      merchant: m[2]?.trim() || '',
      account: `RBL Bank credit card ${m[3]}`,
      date: m[4],
      paymentMethod: 'Credit Card',
    }),
  },
  // RBL Bank Credit Card alt — "INR500.00 spent on RBL Bank Credit Card XX1234 at MERCHANT on 15-04-2026"
  {
    bank: 'RBL',
    regex: /INR([\d,]+(?:\.\d{1,2})?)\s+spent\s+on\s+(?:your\s+)?RBL\s+Bank\s+Credit\s+Card\s+(?:XX)?(\w+)\s+at\s+([A-Za-z0-9\s&./-]+?)\s+on\s+([\d\w-]+)/i,
    map: (m) => ({
      amount: parseFloat(m[1].replace(',', '')),
      account: `XX${m[2]}`,
      merchant: m[3]?.trim() || '',
      date: m[4],
      paymentMethod: 'Credit Card',
    }),
  },
  // RBL Bank Debit — "INR500.00 debited from your RBL Bank account ending 1234 on 15-04-2026 at MERCHANT"
  {
    bank: 'RBL',
    regex: /INR([\d,]+(?:\.\d{1,2})?)\s+debited\s+from\s+(?:your\s+)?RBL\s+Bank\s+(?:account\s+)?(?:ending\s+|no\.?\s*(?:XX)?)?(\w+).*?(?:at|to)\s+([A-Za-z0-9\s&./-]+?)\s+on\s+([\d\w-]+)/i,
    map: (m) => ({
      amount: parseFloat(m[1].replace(',', '')),
      account: `XX${m[2]}`,
      merchant: m[3]?.trim() || '',
      date: m[4],
      paymentMethod: /UPI/i.test(m[0]) ? 'UPI' : 'Debit Card',
    }),
  },
  // Yes Bank Debit/UPI — "INR 500.00 debited from a/c **1234 on 15-Apr-26. Info: UPI/MERCHANT/ref"
  {
    bank: 'YesBank',
    regex: /Yes(?:\s+Bank)?.*?INR\s*([\d,]+(?:\.\d{1,2})?)\s+debited\s+from\s+(?:a\/c|A\/c no\.?)\s*(?:\*+|XX)?(\w+)\s+on\s+([\d\w/-]+)[.\s]+Info:\s*(?:UPI\/)?([A-Za-z0-9\s&.-]+?)(?:\/|\.|\s+Avl|$)/i,
    map: (m) => ({
      amount: parseFloat(m[1].replace(',', '')),
      account: `XX${m[2]}`,
      merchant: m[4]?.trim() || '',
      date: m[3],
      paymentMethod: /UPI/i.test(m[0]) ? 'UPI' : 'Debit Card',
    }),
  },
  // Yes Bank Credit Card — "YES BANK Credit Card 1234 used for INR 500.00 at MERCHANT on 15-Apr-2026"
  {
    bank: 'YesBank',
    regex: /YES\s+BANK\s+Credit\s+Card\s+(?:XX)?(\w+)\s+used\s+for\s+INR\s*([\d,]+(?:\.\d{1,2})?)\s+at\s+([A-Za-z0-9\s&.-]+?)\s+on\s+([\d\w-,]+)/i,
    map: (m) => ({
      amount: parseFloat(m[2].replace(',', '')),
      account: `XX${m[1]}`,
      merchant: m[3]?.trim() || '',
      date: m[4],
      paymentMethod: 'Credit Card',
    }),
  },
  // IndusInd Bank Credit Card — "Your IndusInd Bank Credit Card ending 1234 has been used for Rs.500.00 at MERCHANT on 15-Apr-26"
  {
    bank: 'IndusInd',
    regex: /IndusInd\s+Bank\s+Credit\s+Card\s+(?:ending\s+)?(?:XX)?(\w+)\s+(?:has been |was )?used\s+for\s+(?:Rs\.?|INR\s?)([\d,]+(?:\.\d{1,2})?)\s+at\s+([A-Za-z0-9\s&.-]+?)\s+on\s+([\d\w-,]+)/i,
    map: (m) => ({
      amount: parseFloat(m[2].replace(',', '')),
      account: `XX${m[1]}`,
      merchant: m[3]?.trim() || '',
      date: m[4],
      paymentMethod: 'Credit Card',
    }),
  },
  // IndusInd Bank Debit/UPI — "Rs.500.00 has been debited from IndusInd Bank Account XX1234 on 15/04/26 towards UPI Transfer to MERCHANT"
  {
    bank: 'IndusInd',
    regex: /(?:Rs\.?|INR\s?)([\d,]+(?:\.\d{1,2})?)\s+(?:has been )?debited\s+from\s+(?:your\s+)?IndusInd\s+Bank\s+(?:Account|a\/c)\s*(?:XX)?(\w+)\s+on\s+([\d\w/-]+)\s+(?:towards|via|for).*?(?:to|at)\s+([A-Za-z0-9\s&.-]+?)(?:\.|$)/i,
    map: (m) => ({
      amount: parseFloat(m[1].replace(',', '')),
      account: `XX${m[2]}`,
      date: m[3],
      merchant: m[4]?.trim() || '',
      paymentMethod: /UPI/i.test(m[0]) ? 'UPI' : 'Debit Card',
    }),
  },
  // IDFC First Bank Credit Card — "Your IDFC FIRST Bank Credit Card ending 1234 has been used for INR 500.00 at MERCHANT on 15-Apr-26"
  {
    bank: 'IDFC',
    regex: /IDFC\s+FIRST?\s+Bank\s+Credit\s+Card\s+(?:ending\s+(?:in\s+)?)?(?:XX)?(\w+)\s+has\s+been\s+used\s+for\s+(?:INR|Rs\.?)\s*([\d,]+(?:\.\d{1,2})?)\s+at\s+([A-Za-z0-9\s&.-]+?)\s+on\s+([\d\w-,]+)/i,
    map: (m) => ({
      amount: parseFloat(m[2].replace(',', '')),
      account: `XX${m[1]}`,
      merchant: m[3]?.trim() || '',
      date: m[4],
      paymentMethod: 'Credit Card',
    }),
  },
  // IDFC First Bank Credit Card alt — "INR500 spent on IDFC FIRST Bank Credit Card XX1234 at MERCHANT on 15/04/2026"
  {
    bank: 'IDFC',
    regex: /INR\s*([\d,]+(?:\.\d{1,2})?)\s+(?:spent|used)\s+on\s+IDFC\s+FIRST?\s+Bank\s+Credit\s+Card\s+(?:XX)?(\w+)\s+at\s+([A-Za-z0-9\s&.-]+?)\s+on\s+([\d\w/,-]+)/i,
    map: (m) => ({
      amount: parseFloat(m[1].replace(',', '')),
      account: `XX${m[2]}`,
      merchant: m[3]?.trim() || '',
      date: m[4],
      paymentMethod: 'Credit Card',
    }),
  },
  // IDFC First Bank Debit/UPI — "INR 500.00 has been debited from your IDFC FIRST Bank account XX1234 on 15-Apr-26 via UPI. Info: MERCHANT/ref"
  {
    bank: 'IDFC',
    regex: /INR\s*([\d,]+(?:\.\d{1,2})?)\s+(?:has been )?debited\s+from\s+(?:your\s+)?IDFC\s+FIRST?\s+Bank\s+(?:account|a\/c)\s*(?:XX)?(\w+)\s+on\s+([\d\w-]+).*?Info:\s*([A-Za-z0-9\s&.-]+?)(?:\/|\.|\s+Avl|$)/i,
    map: (m) => ({
      amount: parseFloat(m[1].replace(',', '')),
      account: `XX${m[2]}`,
      date: m[3],
      merchant: m[4]?.trim() || '',
      paymentMethod: /UPI/i.test(m[0]) ? 'UPI' : 'Debit Card',
    }),
  },
  // Generic "a/c XX#### debited for Rs.xxx on date trf to MERCHANT"
  // Covers Karnataka Bank, Federal Bank, UCO Bank, and other banks using this structure
  {
    bank: 'Generic',
    regex: /a\/c\s+(?:XX)?(\w+)\s+debited\s+for\s+(?:Rs\.?|INR\s?)([\d,]+(?:\.\d{1,2})?)\s+on\s+([\d\w/-]+)\s+trf\s+to\s+([A-Za-z0-9\s&.-]+?)(?:\.|UPI:|Ref|$)/i,
    map: (m) => ({
      amount: parseFloat(m[2].replace(/,/g, '')),
      account: `XX${m[1]}`,
      date: m[3],
      merchant: m[4]?.trim() || '',
      paymentMethod: /UPI/i.test(m[0]) ? 'UPI' : 'Debit Card',
    }),
  },
  // Robust generic fallback — extracts each field independently, any order, any bank
  // Handles any SMS not matched by specific patterns above
  {
    bank: 'Generic',
    regex: /[\s\S]+/,
    map: (m) => {
      const txt = m[0]

      // Amount: INR/Rs followed by digits (with optional commas)
      const amtM = txt.match(/(?:INR|Rs\.?)\s*([\d,]+(?:\.\d{1,2})?)/i)
      const amount = amtM ? parseFloat(amtM[1].replace(/,/g, '')) : 0

      // Merchant: text after a transfer/payment keyword, up to a stop boundary
      // Ordered from most-specific to least-specific to avoid false matches
      const merchantM = txt.match(
        /(?:trf\s+to|spent\s+at|paid\s+(?:to|at)|Info:\s*(?:UPI\/)?)([A-Za-z][A-Za-z0-9\s&./-]{1,40}?)(?=\s*[.,]|\s+on\s+\d|\s*UPI[:\s]|\s+Avl|\s+Bal|\s+Ref|\s+-\s|$)/i
      ) || txt.match(
        /\bat\s+([A-Za-z][A-Za-z0-9\s&./-]{1,40}?)(?=\s*[.,]|\s+on\s+\d|\s*UPI[:\s]|\s+Avl|\s+Bal|\s+Ref|$)/i
      )
      const merchant = merchantM ? merchantM[1].trim() : ''

      // Date: DD-MM-YY(YY) or DD/MM/YY(YY) — checked before YYYY-MM-DD to avoid false positives
      const dateM = txt.match(/\b(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})\b/)
                 || txt.match(/\b(\d{4}-\d{2}-\d{2})\b/)
      const date = dateM ? dateM[1] : undefined

      // Account: XX/xx/stars + alphanumeric, or a/c keyword + digits
      const acctM = txt.match(/\b(?:XX|xx|\*{2,})([A-Za-z0-9]{3,})/i)
                 || txt.match(/(?:a\/c|acct|account)\s*(?:no\.?)?\s*([A-Za-z0-9]{4,})/i)
      const account = acctM ? `XX${acctM[1]}` : ''

      const paymentMethod = /credit\s*card/i.test(txt) ? 'Credit Card'
                          : /debit\s*card/i.test(txt) ? 'Debit Card'
                          : /\bUPI\b/.test(txt) ? 'UPI'
                          : 'Debit Card'

      return { amount, merchant, date, account, paymentMethod }
    },
  },
]

function parseDate(raw) {
  if (!raw) return new Date().toISOString().slice(0, 10)
  // dd-Mon-yy  →  dd-Mon-20yy
  const monMatch = raw.match(/(\d{1,2})[/-]([A-Za-z]{3})[/-](\d{2,4})/)
  if (monMatch) {
    const year = monMatch[3].length === 2 ? `20${monMatch[3]}` : monMatch[3]
    return new Date(`${monMatch[1]} ${monMatch[2]} ${year}`).toISOString().slice(0, 10)
  }
  // dd/mm/yy or dd-mm-yyyy (with year)
  const numMatch = raw.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/)
  if (numMatch) {
    const year = numMatch[3].length === 2 ? `20${numMatch[3]}` : numMatch[3]
    return new Date(`${year}-${numMatch[2].padStart(2, '0')}-${numMatch[1].padStart(2, '0')}`).toISOString().slice(0, 10)
  }
  // dd-mm (no year) → assume current year
  const dmMatch = raw.match(/^(\d{1,2})-(\d{1,2})$/)
  if (dmMatch) {
    const year = new Date().getFullYear()
    return `${year}-${dmMatch[2].padStart(2, '0')}-${dmMatch[1].padStart(2, '0')}`
  }
  return new Date().toISOString().slice(0, 10)
}

export function parseSMS(text) {
  for (const pattern of PATTERNS) {
    const match = text.match(pattern.regex)
    if (!match) continue
    const fields = pattern.map(match)
    // Skip if the match produced no usable data (guards against over-eager generic patterns)
    if (!fields.amount && !fields.merchant) continue
    return {
      date: parseDate(fields.date),
      amount: fields.amount || '',
      merchant: fields.merchant || '',
      category: 'Other',
      paymentMethod: fields.paymentMethod || 'UPI',
      person: '',
      account: fields.account || '',
      notes: '',
      _parsed: true,
      _bank: pattern.bank,
    }
  }
  return null
}
