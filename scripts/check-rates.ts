import https from 'https';

const QBCC_URL = 'https://www.qbcc.qld.gov.au/running-your-business/home-warranty-insurance-obligations/calculating-premium';
// Known current PDF identifiers - if these change, the table might have updated
const KNOWN_PDF_PATTERNS = [
  'hwi-premium-table-2701-new-home-construction.pdf',
  'hwi-premium-table-2701-alterations.pdf'
];

const QLEAVE_URL = 'https://www.qleave.qld.gov.au/building-and-construction/levy-payers/levy-rates';
const KNOWN_QLEAVE_RATE = '0.575';

function fetchUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function checkRates() {
  console.log('🔍 Checking QBCC and QLeave rates...');
  let hasChanges = false;

  try {
    // 1. Check QBCC PDFs
    console.log(`Checking QBCC URL: ${QBCC_URL}`);
    const qbccHtml = await fetchUrl(QBCC_URL);
    
    for (const pdf of KNOWN_PDF_PATTERNS) {
      if (!qbccHtml.includes(pdf)) {
        console.error(`⚠️  WARNING: Could not find PDF link for ${pdf}. The file name may have changed (indicating a rate update).`);
        hasChanges = true;
      } else {
        console.log(`✅  Confirmed PDF link exists: ${pdf}`);
      }
    }

    // 2. Check QLeave Rate
    console.log(`Checking QLeave URL: ${QLEAVE_URL}`);
    const qleaveHtml = await fetchUrl(QLEAVE_URL);
    
    if (!qleaveHtml.includes(KNOWN_QLEAVE_RATE)) {
      console.error(`⚠️  WARNING: Could not find the rate "${KNOWN_QLEAVE_RATE}%" on the QLeave page. The levy rate may have changed.`);
      hasChanges = true;
    } else {
      console.log(`✅  Confirmed QLeave rate is still ${KNOWN_QLEAVE_RATE}%`);
    }

    if (hasChanges) {
      console.log('\n🚨 POTENTIAL RATE CHANGE DETECTED');
      console.log('Please review the official websites and update the calculator if necessary.');
      process.exit(1); // Fail the script to trigger notification
    } else {
      console.log('\n✨ All checks passed. No changes detected.');
      process.exit(0);
    }

  } catch (error) {
    console.error('Error running checks:', error);
    process.exit(1);
  }
}

checkRates();
