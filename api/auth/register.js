import bcrypt from "bcryptjs";
import { getDatabase } from "../lib/db.js";
import { createToken, setAuthCookie } from "../lib/auth.js";
import { json, methodNotAllowed } from "../lib/response.js";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return methodNotAllowed(res);
    }

    try {
        const { name, email, password } = req.body || {};

        if (!name || !email || !password) {
            return json(res, 400, {
                success: false,
                message: "Name, email and password are required.",
            });
        }

        if (password.length < 8) {
            return json(res, 400, {
                success: false,
                message: "Password must be at least 8 characters.",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const db = await getDatabase();

        const users = db.collection("users");

        const existingUser = await users.findOne({
            email: normalizedEmail,
        });

        if (existingUser) {
            return json(res, 409, {
                success: false,
                message: "An account with this email already exists.",
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const user = {
            name: name.trim(),
            email: normalizedEmail,
            passwordHash,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await users.insertOne(user);

        user._id = result.insertedId;

        const token = createToken(user);

        setAuthCookie(res, token);

        return json(res, 201, {
            success: true,
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
            },
        });
    } catch (error) {
        console.error("REGISTER_ERROR", error);

        return json(res, 500, {
            success: false,
            message: "Unable to create account.",
        });
    }
}