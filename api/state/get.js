import { ObjectId } from "mongodb";
import { getDatabase } from "../lib/db.js";
import { getAuthenticatedUser } from "../lib/auth.js";
import { json, methodNotAllowed } from "../lib/response.js";

const EMPTY_STATE = {
    days: {},
    questions: {},
    eng: {},
    stories: {},
};

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return methodNotAllowed(res);
    }

    try {
        const user = getAuthenticatedUser(req);

        if (!user) {
            return json(res, 401, {
                success: false,
                message: "Authentication required.",
            });
        }

        const db = await getDatabase();

        const progress = await db.collection("progress").findOne({
            userId: new ObjectId(user.userId),
        });

        return json(res, 200, {
            success: true,
            state: progress?.state || EMPTY_STATE,
        });
    } catch (error) {
        console.error("GET_STATE_ERROR", error);

        return json(res, 500, {
            success: false,
            message: "Unable to load progress.",
        });
    }
}