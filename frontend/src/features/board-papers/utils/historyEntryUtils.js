export function getHistoryEntryTargetId(item) {
    if (!item) {
        return null;
    }

    return (
        item.entryData?.boardPaperId
        ?? item.entryData?.report?.boardPaperId
        ?? item.entryData?.proposalId
        ?? item.entryData?.proposal?.id
        ?? item.report?.id
        ?? item.report?.boardPaperId
        ?? item.proposal?.id
        ?? item.id
        ?? null
    );
}
