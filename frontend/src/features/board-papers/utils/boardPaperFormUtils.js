export const buildBoardPaperTitle = (tender) => {
    if (!tender?.tender_ref_no) {
        return "Board Paper";
    }

    return `Board Paper - ${tender.tender_ref_no}`;
};

export const getSelectedTenderDetails = (tenders, tenderId) => {
    if (!tenderId) {
        return null;
    }

    return tenders.find((tender) => String(tender.id) === String(tenderId)) || null;
};
