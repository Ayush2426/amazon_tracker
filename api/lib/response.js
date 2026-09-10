export function json(res, status, data) {
    res.status(status);
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(data));
}

export function methodNotAllowed(res) {
    return json(res, 405, {
        success: false,
        message: "Method not allowed",
    });
}