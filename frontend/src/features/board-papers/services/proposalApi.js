import apiClient, { API_BASE_URL as API_URL } from "../../../lib/apiClient";

// Used by the other (unused-in-app) functions below, which still call the
// backend directly via fetch(). generateProposal goes through apiClient
// instead (see below) - a bare fetch() call with no Authorization header
// against a route gated by `authenticate` always 401'd, which is what was
// actually producing "Unable to generate proposal" / "Failed to generate
// proposal" - not a bad request body or wrong URL.

/*
-----------------------------------------
Generate AI Proposal
POST /proposals/generate
-----------------------------------------
*/

export async function generateProposal(data) {

    const { data: result } = await apiClient.post("/proposals/generate", data);
    return result;

}

/*
-----------------------------------------
Get Proposal By ID
GET /api/proposal/:id
-----------------------------------------
*/

export async function getProposal(id) {

    const response = await fetch(
        `${API_URL}/proposals/${id}`
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
        `${API_URL}/proposals/${id}`,
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
        `${API_URL}/proposals/${id}`,
        {
            method: "DELETE",
            credentials: "include"
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
        `${API_URL}/proposals`
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
        `${API_URL}/proposals/pdf/${id}`
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
        `${API_URL}/proposals/docx/${id}`
    );

    if (!response.ok) {
        throw new Error("Unable to download DOCX.");
    }

    return await response.blob();

}