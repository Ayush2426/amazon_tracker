import bcrypt from "bcryptjs";
import { getDatabase } from "../_lib/db.js";
import { createToken, setAuthCookie } from "../_lib/auth.js";
import { json, methodNotAllowed } from "../_lib/response.js";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return methodNotAllowed(res);
    }

    try {
        const { email, password } = req.body || {};

        if (!email || !password) {
            return json(res, 400, {
                success: false,
                message: "Email and password are required.",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const db = await getDatabase();

        const user = await db.collection("users").findOne({
            email: normalizedEmail,
        });

        if (!user) {
            return json(res, 401, {
                success: false,
                message: "Invalid email or password.",
            });
        }

        const passwordMatches = await bcrypt.compare(
            password,
            user.passwordHash
        );

        if (!passwordMatches) {
            return json(res, 401, {
                success: false,
                message: "Invalid email or password.",
            });
        }

        const token = createToken(user);

        setAuthCookie(res, token);

        return json(res, 200, {
            success: true,
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
            },
        });
    } catch (error) {
        console.error("LOGIN_ERROR", error);

        return json(res, 500, {
            success: false,
            message: "Unable to login.",
        });
    }
}