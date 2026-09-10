import jwt from "jsonwebtoken";

const COOKIE_NAME = "spiderverse_session";

function getSecret() {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error("JWT_SECRET is not defined");
    }

    return secret;
}

export function createToken(user) {
    return jwt.sign(
        {
            userId: user._id.toString(),
            email: user.email,
            name: user.name,
        },
        getSecret(),
        {
            expiresIn: "7d",
        }
    );
}

export function verifyToken(token) {
    try {
        return jwt.verify(token, getSecret());
    } catch {
        return null;
    }
}

export function setAuthCookie(res, token) {
    const secure = process.env.NODE_ENV === "production";

    res.setHeader(
        "Set-Cookie",
        `${COOKIE_NAME}=${token}; Path=/; HttpOnly; ${secure ? "Secure; " : ""
        }SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`
    );
}

export function clearAuthCookie(res) {
    const secure = process.env.NODE_ENV === "production";

    res.setHeader(
        "Set-Cookie",
        `${COOKIE_NAME}=; Path=/; HttpOnly; ${secure ? "Secure; " : ""
        }SameSite=Lax; Max-Age=0`
    );
}

function extractCookie(cookieHeader) {
    if (!cookieHeader) {
        return null;
    }

    const cookies = cookieHeader.split(";");

    for (const cookie of cookies) {
        const [name, ...valueParts] = cookie.trim().split("=");

        if (name === COOKIE_NAME) {
            return decodeURIComponent(valueParts.join("="));
        }
    }

    return null;
}

export function getAuthenticatedUser(req) {
    const token = extractCookie(req.headers.cookie);

    if (!token) {
        return null;
    }

    return verifyToken(token);
}