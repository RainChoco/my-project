const API_URL = import.meta.env.VITE_API_URL;

/*
-----------------------------------------
Generate AI Proposal
POST /api/proposal/generate
-----------------------------------------
*/

export async function generateProposal(data) {

    const response = await fetch(
        `${API_URL}/api/proposal/generate`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        }
    );

    if (!response.ok) {
        throw new Error("Failed to generate proposal.");
    }

    return await response.json();

}

/*
-----------------------------------------
Get Proposal By ID
GET /api/proposal/:id
-----------------------------------------
*/

export async function getProposal(id) {

    const response = await fetch(
        `${API_URL}/api/proposal/${id}`
    );

    if (!response.ok) {
        throw new Error("Proposal not found.");
    }

    return await response.json();

}

/*
-----------------------------------------
Update Proposal
PUT /api/proposal/:id
-----------------------------------------
*/

export async function updateProposal(id, data) {

    const response = await fetch(
        `${API_URL}/api/proposal/${id}`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        }
    );

    if (!response.ok) {
        throw new Error("Unable to update proposal.");
    }

    return await response.json();

}

/*
-----------------------------------------
Delete Proposal
DELETE /api/proposal/:id
-----------------------------------------
*/

export async function deleteProposal(id) {

    const response = await fetch(
        `${API_URL}/api/proposal/${id}`,
        {
            method: "DELETE"
        }
    );

    if (!response.ok) {
        throw new Error("Unable to delete proposal.");
    }

    return await response.json();

}

/*
-----------------------------------------
Get Proposal History
GET /api/proposal
-----------------------------------------
*/

export async function getProposalHistory() {

    const response = await fetch(
        `${API_URL}/api/proposal`
    );

    if (!response.ok) {
        throw new Error("Unable to retrieve proposal history.");
    }

    return await response.json();

}

/*
-----------------------------------------
Export Proposal PDF
GET /api/proposal/pdf/:id
-----------------------------------------
*/

export async function downloadProposalPDF(id) {

    const response = await fetch(
        `${API_URL}/api/proposal/pdf/${id}`
    );

    if (!response.ok) {
        throw new Error("Unable to download PDF.");
    }

    return await response.blob();

}

/*
-----------------------------------------
Export Proposal DOCX
GET /api/proposal/docx/:id
-----------------------------------------
*/

export async function downloadProposalDOCX(id) {

    const response = await fetch(
        `${API_URL}/api/proposal/docx/${id}`
    );

    if (!response.ok) {
        throw new Error("Unable to download DOCX.");
    }

    return await response.blob();

}