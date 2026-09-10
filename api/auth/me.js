import { getAuthenticatedUser } from "../lib/auth.js";
import { json, methodNotAllowed } from "../lib/response.js";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return methodNotAllowed(res);
    }

    const user = getAuthenticatedUser(req);

    if (!user) {
        return json(res, 401, {
            success: false,
            authenticated: false,
        });
    }

    return json(res, 200, {
        success: true,
        authenticated: true,
        user: {
            id: user.userId,
            name: user.name,
            email: user.email,
        },
    });
}