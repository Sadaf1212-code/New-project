const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
require("dotenv").config();

const { hashPassword, verifyPassword } = require("./auth-service");
const { query } = require("./database");

const app = express();
const PORT = process.env.PORT || 3000;
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = "ValidationError";
    }
}

function loadAuthSecret() {
    if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
    if (process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET is required in production");
    const secretPath = path.join(__dirname, ".auth-secret");
    try {
        const saved = fs.readFileSync(secretPath, "utf8").trim();
        if (saved.length >= 32) return saved;
    } catch (error) {
        if (error.code !== "ENOENT") throw error;
    }
    const generated = crypto.randomBytes(48).toString("base64url");
    try {
        fs.writeFileSync(secretPath, generated + "\n", { mode: 0o600, flag: "wx" });
        return generated;
    } catch (error) {
        if (error.code !== "EEXIST") throw error;
        return fs.readFileSync(secretPath, "utf8").trim();
    }
}

const AUTH_SECRET = loadAuthSecret();
if (AUTH_SECRET.length < 32) throw new Error("AUTH_SECRET must be at least 32 characters");

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use("/pages", express.static(path.join(__dirname, "pages")));
app.use("/js", express.static(path.join(__dirname, "js")));
app.use("/images", express.static(path.join(__dirname, "images")));
app.use("/css", express.static(path.join(__dirname, "css")));
app.use("/components", express.static(path.join(__dirname, "components")));
app.get("/", (req, res) => res.redirect("/pages/index.html"));

const USER_COLUMNS = [
    "id", 'full_name AS "fullName"', "email", 'student_id AS "studentId"', "phone",
    "university", "department", 'profile_image AS "profileImage"', 'created_at AS "createdAt"'
].join(", ");

const POST_COLUMNS = [
    'p.id AS "postId"', 'p.user_id AS "userId"',
    'COALESCE(u.full_name, p.author_name) AS "authorName"', "p.title",
    'p.listing_type AS "listingType"', "p.category", "p.price", "p.condition",
    "p.contact", "p.location", "p.description", "p.image", "p.components",
    'p.created_at AS "createdAt"'
].join(", ");

function issueAuthToken(userId) {
    const payload = Buffer.from(JSON.stringify({
        sub: Number(userId),
        exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS
    })).toString("base64url");
    const signature = crypto.createHmac("sha256", AUTH_SECRET).update(payload).digest("base64url");
    return payload + "." + signature;
}

function verifyAuthToken(token) {
    if (typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
    const [payload, signature] = parts;
    const expected = crypto.createHmac("sha256", AUTH_SECRET).update(payload).digest();
    const supplied = Buffer.from(signature, "base64url");
    if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) return null;
    try {
        const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
        if (!Number.isSafeInteger(claims.sub) || !Number.isSafeInteger(claims.exp) ||
            claims.exp <= Math.floor(Date.now() / 1000)) return null;
        return claims;
    } catch {
        return null;
    }
}

function publicUser(row) {
    if (!row) return null;
    return {
        id: Number(row.id),
        fullName: row.fullName,
        email: row.email,
        studentId: row.studentId,
        phone: row.phone,
        university: row.university,
        department: row.department,
        profileImage: row.profileImage || "",
        createdAt: row.createdAt
    };
}

async function authenticate(req, res, next) {
    const match = (req.get("authorization") || "").match(/^Bearer ([A-Za-z0-9_.-]+)$/);
    const claims = match && verifyAuthToken(match[1]);
    if (!claims) return res.status(401).json({ success: false, message: "Please sign in again." });
    try {
        const [user] = await query("SELECT " + USER_COLUMNS + " FROM users WHERE id = $1", [claims.sub]);
        if (!user) return res.status(401).json({ success: false, message: "Please sign in again." });
        req.authUser = publicUser(user);
        next();
    } catch (error) {
        next(error);
    }
}

function requireSelf(req, res, next) {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ success: false, message: "User ID is invalid" });
    if (id !== req.authUser.id) return res.status(403).json({ success: false, message: "You can only access your own account" });
    next();
}

function cleanText(value, field, maxLength, required = true) {
    if (typeof value !== "string") throw new ValidationError(field + " must be text");
    const clean = value.trim();
    if ((required && !clean) || clean.length > maxLength || /[\u0000-\u001f\u007f]/.test(clean)) {
        throw new ValidationError(field + " is invalid");
    }
    return clean;
}

function validateRegistration(body) {
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new ValidationError("Invalid request body");
    const user = {
        fullName: cleanText(body.fullName, "Full name", 100),
        email: cleanText(body.email, "Email", 254).toLowerCase(),
        studentId: cleanText(body.studentId, "Student ID", 64),
        phone: cleanText(body.phone, "Phone", 32),
        university: cleanText(body.university, "University", 120),
        department: cleanText(body.department, "Department", 120),
        profileImage: body.profileImage ? cleanText(body.profileImage, "Profile image", 2048, false) : ""
    };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) throw new ValidationError("Please enter a valid email address");
    if (user.profileImage && !/^https:\/\//i.test(user.profileImage)) throw new ValidationError("Profile image must be an HTTPS URL");
    if (typeof body.password !== "string" || body.password.length < 8 || body.password.length > 128) {
        throw new ValidationError("Password must be between 8 and 128 characters");
    }
    if (body.password !== body.confirmPassword) throw new ValidationError("Passwords do not match");
    if (body.agree !== true) throw new ValidationError("You must agree to the Terms and Privacy Policy");
    return { ...user, password: body.password };
}

app.get("/api/health", async (req, res, next) => {
    try {
        await query("SELECT 1");
        res.json({ success: true, database: "connected" });
    } catch (error) {
        next(error);
    }
});

app.post("/api/users", async (req, res, next) => {
    try {
        const user = validateRegistration(req.body);
        const passwordHash = await hashPassword(user.password);
        const [created] = await query(
            "INSERT INTO users " +
            "(full_name, email, student_id, phone, university, department, password_hash, profile_image) " +
            "VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING " + USER_COLUMNS,
            [user.fullName, user.email, user.studentId, user.phone, user.university,
                user.department, passwordHash, user.profileImage]
        );
        res.status(201).json({ success: true, message: "Account created successfully", user: publicUser(created) });
    } catch (error) {
        if (error.code === "23505") return res.status(409).json({ success: false, message: "Email or Student ID is already registered" });
        if (error instanceof ValidationError) {
            return res.status(400).json({ success: false, message: error.message });
        }
        next(error);
    }
});

app.get("/api/users/:id", authenticate, requireSelf, (req, res) => {
    res.json({ success: true, user: req.authUser });
});

app.put("/api/users/:id", authenticate, requireSelf, async (req, res, next) => {
    try {
        const body = req.body || {};
        const fields = {
            fullName: ["full_name", 100],
            phone: ["phone", 32],
            university: ["university", 120],
            department: ["department", 120],
            profileImage: ["profile_image", 2048]
        };
        if (Object.keys(body).some(key => !Object.hasOwn(fields, key))) {
            return res.status(400).json({ success: false, message: "Unsupported profile field" });
        }
        const updates = Object.entries(fields)
            .filter(([key]) => Object.hasOwn(body, key))
            .map(([key, [column, limit]]) => [column, cleanText(body[key], key, limit, false)]);
        if (!updates.length) return res.status(400).json({ success: false, message: "No profile fields provided" });
        const image = updates.find(([column]) => column === "profile_image")?.[1];
        if (image && !/^https:\/\//i.test(image)) {
            return res.status(400).json({ success: false, message: "Profile image must be an HTTPS URL" });
        }
        const setClause = updates.map(([column], index) => column + " = $" + (index + 1)).join(", ");
        const values = updates.map(([, value]) => value);
        values.push(req.authUser.id);
        const [updated] = await query(
            "UPDATE users SET " + setClause + " WHERE id = $" + values.length + " RETURNING " + USER_COLUMNS,
            values
        );
        if (!updated) return res.status(404).json({ success: false, message: "User not found" });
        res.json({ success: true, message: "Profile updated successfully", user: publicUser(updated) });
    } catch (error) {
        if (error instanceof ValidationError) {
            return res.status(400).json({ success: false, message: error.message });
        }
        next(error);
    }
});

app.post("/api/login", async (req, res, next) => {
    try {
        const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
        const password = typeof req.body?.password === "string" ? req.body.password : "";
        if (!email || !password || password.length > 128) {
            return res.status(400).json({ success: false, message: "Email and password are required" });
        }
        const [user] = await query(
            "SELECT " + USER_COLUMNS + ', password_hash AS "passwordHash" FROM users WHERE email = $1',
            [email]
        );
        if (!user || !await verifyPassword(password, user.passwordHash)) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }
        res.json({
            success: true,
            message: "Login successful",
            user: publicUser(user),
            token: issueAuthToken(user.id)
        });
    } catch (error) {
        next(error);
    }
});

function validateListing(body, updating, existing) {
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new ValidationError("Invalid request body");
    const allowed = new Set([
        "title", "listingType", "category", "price", "condition",
        "contact", "location", "description", "image", "components"
    ]);
    if (Object.keys(body).some(key => !allowed.has(key))) throw new ValidationError("Unsupported listing field");
    const data = {};
    for (const [field, limit] of [["title", 120], ["contact", 32], ["location", 120], ["description", 3000], ["components", 2000]]) {
        if (Object.hasOwn(body, field)) data[field] = cleanText(body[field], field, limit, field !== "components");
        else if (!updating && field === "components") data[field] = "";
        else if (!updating) throw new ValidationError(field + " is required");
    }

    const choices = {
        listingType: ["Sell", "Rent", "Project", "Lost", "Found"],
        category: ["Books", "Notes", "Electronics", "Lab Equipment", "Calculators", "Project Materials", "Others", "Lost & Found"],
        condition: ["New", "Like New", "Used", "Good", "Unknown", "Lost"]
    };
    for (const [field, allowedValues] of Object.entries(choices)) {
        if (Object.hasOwn(body, field)) {
            const value = cleanText(body[field], field, 40);
            if (!allowedValues.includes(value)) throw new ValidationError(field + " is invalid");
            data[field] = value;
        } else if (!updating) {
            throw new ValidationError(field + " is required");
        }
    }

    if (Object.hasOwn(body, "price")) {
        const price = typeof body.price === "number" ? body.price :
            (typeof body.price === "string" && body.price.trim() ? Number(body.price) : NaN);
        if (!Number.isFinite(price) || price < 0 || price > 100000000) throw new ValidationError("Price is invalid");
        data.price = price;
    } else if (!updating) {
        data.price = 0;
    }
    if (Object.hasOwn(body, "image")) data.image = cleanText(body.image, "image", 2048, false);
    else if (!updating) data.image = "";
    if (data.image && !/^https:\/\//i.test(data.image)) throw new ValidationError("Image must be an HTTPS URL");

    const merged = { ...existing, ...data };
    if (merged.listingType === "Project") {
        if (!merged.description) throw new ValidationError("Project description is required");
        if (!merged.components) throw new ValidationError("Please list the project components");
        if (!merged.image) throw new ValidationError("A project photo is required");
        if (!updating && !Object.hasOwn(body, "price")) throw new ValidationError("Project price is required");
        if (updating && data.price === undefined && existing?.price === undefined) throw new ValidationError("Project price is required");
    }
    return data;
}

async function loadPost(id) {
    const [post] = await query(
        'SELECT ' + POST_COLUMNS + ' FROM posts p LEFT JOIN users u ON u.id = p.user_id WHERE p.id = $1',
        [id]
    );
    return post || null;
}

async function authenticateListingOwner(req, res, next) {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) {
        return res.status(400).json({ success: false, message: "Post ID is invalid" });
    }
    try {
        const post = await loadPost(id);
        if (!post) return res.status(404).json({ success: false, message: "Post not found" });
        if (Number(post.userId) !== req.authUser.id) {
            return res.status(403).json({ success: false, message: "You are not allowed to modify this post" });
        }
        req.listing = post;
        next();
    } catch (error) {
        next(error);
    }
}

app.get("/api/posts", async (req, res, next) => {
    try {
        const posts = await query(
            'SELECT ' + POST_COLUMNS + ' FROM posts p LEFT JOIN users u ON u.id = p.user_id ORDER BY p.id DESC'
        );
        res.json({ success: true, count: posts.length, posts });
    } catch (error) {
        next(error);
    }
});

app.get("/api/posts/:id", async (req, res, next) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) {
        return res.status(400).json({ success: false, message: "Post ID is invalid" });
    }
    try {
        const post = await loadPost(id);
        if (!post) return res.status(404).json({ success: false, message: "Post not found" });
        res.json({ success: true, post });
    } catch (error) {
        next(error);
    }
});

app.post("/api/posts", authenticate, async (req, res, next) => {
    try {
        const data = validateListing(req.body, false);
        const [created] = await query(
            "INSERT INTO posts (user_id, author_name, title, listing_type, category, price, condition, contact, location, description, image, components) " +
            "VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id",
            [req.authUser.id, req.authUser.fullName, data.title, data.listingType, data.category,
                data.price, data.condition, data.contact, data.location, data.description,
                data.image || "", data.components || ""]
        );
        const post = await loadPost(created.id);
        res.status(201).json({ success: true, message: "Post created successfully", post });
    } catch (error) {
        if (error instanceof ValidationError) {
            return res.status(400).json({ success: false, message: error.message });
        }
        next(error);
    }
});

app.put("/api/posts/:id", authenticate, authenticateListingOwner, async (req, res, next) => {
    try {
        const data = validateListing(req.body, true, req.listing);
        const columns = {
            title: "title", listingType: "listing_type", category: "category", price: "price",
            condition: "condition", contact: "contact", location: "location",
            description: "description", image: "image", components: "components"
        };
        const updates = Object.entries(data);
        if (!updates.length) return res.status(400).json({ success: false, message: "No listing fields provided" });
        const setClause = updates.map(([field], index) => columns[field] + " = $" + (index + 1)).join(", ");
        const values = updates.map(([, value]) => value);
        values.push(Number(req.params.id), req.authUser.id);
        await query(
            "UPDATE posts SET " + setClause + " WHERE id = $" + (values.length - 1) + " AND user_id = $" + values.length,
            values
        );
        const post = await loadPost(Number(req.params.id));
        res.json({ success: true, message: "Post updated successfully", post });
    } catch (error) {
        if (error instanceof ValidationError) {
            return res.status(400).json({ success: false, message: error.message });
        }
        next(error);
    }
});

app.delete("/api/posts/:id", authenticate, authenticateListingOwner, async (req, res, next) => {
    try {
        const [deleted] = await query(
            "DELETE FROM posts WHERE id = $1 AND user_id = $2 RETURNING id",
            [Number(req.params.id), req.authUser.id]
        );
        if (!deleted) return res.status(404).json({ success: false, message: "Post not found" });
        res.json({ success: true, message: "Post deleted successfully" });
    } catch (error) {
        next(error);
    }
});

app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    if (error.type === "entity.parse.failed") {
        return res.status(400).json({ success: false, message: "Request body is not valid JSON" });
    }
    if (error.code === "DATABASE_NOT_CONFIGURED") {
        return res.status(503).json({ success: false, message: "Connect a Postgres database to enable accounts and listings." });
    }
    console.error("Request failed", error.code || error.name || "unknown");
    res.status(500).json({ success: false, message: "Service temporarily unavailable. Please try again." });
});

if (require.main === module) {
    app.listen(PORT, "0.0.0.0", () => console.log("EduTrade server started on port " + PORT));
}

module.exports = app;

