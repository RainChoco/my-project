// Auto-generates the next "TC-<year>-<seq>" reference number from whatever tenders
// already exist for the current year - shared by TenderFormPage (create mode default)
// and TenderRecordLookupPage (direct submission of an extracted past record), so both
// entry points can't drift into colliding ref numbers.
export function computeNextTenderRefNo(existingTenders) {
  const year = new Date().getFullYear();
  const pattern = new RegExp(`^TC-${year}-(\\d+)$`);
  let maxSeq = 0;
  existingTenders.forEach((t) => {
    const match = pattern.exec(t.tender_ref_no || '');
    if (match) maxSeq = Math.max(maxSeq, parseInt(match[1], 10));
  });
  return `TC-${year}-${String(maxSeq + 1).padStart(3, '0')}`;
}
