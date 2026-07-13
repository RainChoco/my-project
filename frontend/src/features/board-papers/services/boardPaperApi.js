import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api/boardpaper";
/*
==========================================
Generate AI Board Paper
POST /api/boardpaper/generate
==========================================
*/

export const generateBoardPaper = async (boardPaperData) => {

    const { data } = await axios.post(
        `${API_BASE_URL}/generate`,
        boardPaperData
    );

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
            `${API_URL}/boardpaper/${id}`,
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
POST /api/boardpaper
==========================================
*/

export async function saveBoardPaper(reportData) {

    try {

        const response = await fetch(
            `${API_URL}/boardpaper/generate`,
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
            `${API_URL}/boardpaper/generate/${id}`,
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
GET /api/boardpaper/pdf/:id
==========================================
*/

export async function downloadBoardPaperPDF(id) {

    try {

        const response = await fetch(
            `${API_URL}/boardpaper/generate/pdf/${id}`,
            {
                credentials: "include"
            }
        );

        if (!response.ok) {
            throw new Error("Unable to download PDF.");
        }

        return await response.blob();

    }
    catch (error) {

        console.error(error);

        throw error;

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
            `${API_URL}/boardpaper/generate/${id}`,
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
GET /api/boardpaper/history
==========================================
*/

export async function getBoardPaperHistory() {

    try {

        const response = await fetch(
            `${API_URL}/boardpaper/generate/history`,
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