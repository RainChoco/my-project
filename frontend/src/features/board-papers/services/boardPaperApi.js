import apiClient from "../../../lib/apiClient";

// Used by the other (unused-in-app) functions below, which still call the
// backend directly via fetch(). generateBoardPaper/downloadBoardPaperPDF go
// through apiClient instead (see those functions) - a bare axios/fetch call
// against a hardcoded relative "/api/boardpapers" path bypasses apiClient's
// baseURL/auth-header handling entirely, and in production resolves against
// the Vercel frontend's own origin instead of the Render backend. There's no
// Vercel rewrite for that path, so a POST there hits Vercel's static-file
// routing, which rejects non-GET methods with a 405 - exactly the error this
// was breaking generateBoardPaper with.
const API_BASE_URL = "/api/boardpapers";
/*
==========================================
Generate AI Board Paper
POST /boardpapers/generate
==========================================
*/

export const generateBoardPaper = async (boardPaperData) => {

    const { data } = await apiClient.post("/boardpapers/generate", boardPaperData);

    return data;

};

/*
==========================================
Get Board Paper by ID
GET /api/boardpaper/:id
==========================================
*/

export async function getBoardPaper(id) {

    try {

        const response = await fetch(
            `${API_BASE_URL}/${id}`,
            {
                credentials: "include"
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to retrieve board paper.");
        }

        return data;

    }
    catch (error) {

        console.error(error);

        throw error;

    }

}

/*
==========================================
Save Board Paper
POST /api/boardpapers/generate
==========================================
*/

export async function saveBoardPaper(reportData) {

    try {

        const response = await fetch(
            `${API_BASE_URL}/generate`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify(reportData)
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to save board paper.");
        }

        return data;

    }
    catch (error) {

        console.error(error);

        throw error;

    }

}

/*
==========================================
Update Board Paper
PUT /api/boardpaper/:id
==========================================
*/

export async function updateBoardPaper(id, reportData) {

    try {

        const response = await fetch(
            `${API_BASE_URL}/${id}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify(reportData)
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to update board paper.");
        }

        return data;

    }
    catch (error) {

        console.error(error);

        throw error;

    }

}

/*
==========================================
Download PDF
GET /boardpapers/pdf/:id
==========================================
*/

export async function downloadBoardPaperPDF(id, metadata = {}) {

    try {

        const params = {};

        Object.entries(metadata).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== "") {
                params[key] = String(value);
            }
        });

        const { data } = await apiClient.get(`/boardpapers/pdf/${id}`, {
            params,
            responseType: "blob",
        });

        return data;

    }
    catch (error) {

        console.error(error);

        throw new Error("Unable to download PDF.");

    }

}

/*
==========================================
Delete Board Paper
DELETE /api/boardpaper/:id
==========================================
*/

export async function deleteBoardPaper(id) {

    try {

        const response = await fetch(
            `${API_BASE_URL}/${id}`,
            {
                method: "DELETE",
                credentials: "include"
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to delete board paper.");
        }

        return data;

    }
    catch (error) {

        console.error(error);

        throw error;

    }

}

/*
==========================================
Board Paper History
GET /api/boardpapers
==========================================
*/

export async function getBoardPaperHistory() {

    try {

        const response = await fetch(
            `${API_BASE_URL}`,
            {
                credentials: "include"
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to retrieve history.");
        }

        return data;

    }
    catch (error) {

        console.error(error);

        throw error;

    }

}