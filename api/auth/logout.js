import { clearAuthCookie } from "../lib/auth.js";
import { json, methodNotAllowed } from "../lib/response.js";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return methodNotAllowed(res);
    }

    clearAuthCookie(res);

    return json(res, 200, {
        success: true,
        message: "Logged out successfully.",
    });
}