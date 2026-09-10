import { ObjectId } from "mongodb";
import { getDatabase } from "../_lib/db.js";
import { getAuthenticatedUser } from "../_lib/auth.js";
import { json, methodNotAllowed } from "../_lib/response.js";

export default async function handler(req, res) {
    if (req.method !== "PUT") {
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

        const { state } = req.body || {};

        if (!state || typeof state !== "object") {
            return json(res, 400, {
                success: false,
                message: "Invalid state.",
            });
        }

        const db = await getDatabase();

        const userId = new ObjectId(user.userId);

        await db.collection("progress").updateOne(
            {
                userId,
            },
            {
                $set: {
                    state,
                    userId,
                    updatedAt: new Date(),
                },
                $setOnInsert: {
                    createdAt: new Date(),
                },
            },
            {
                upsert: true,
            }
        );

        return json(res, 200, {
            success: true,
            message: "Progress saved.",
        });
    } catch (error) {
        console.error("UPDATE_STATE_ERROR", error);

        return json(res, 500, {
            success: false,
            message: "Unable to save progress.",
        });
    }
}