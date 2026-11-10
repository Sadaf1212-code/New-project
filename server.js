 
const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { hashPassword, verifyPassword } = require("./auth-service");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
function loadAuthSecret() {
    if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
    if (process.env.NODE_ENV === "production") {
        throw new Error("Set AUTH_SECRET to a random secret of at least 32 characters in production");
    }

    const secretPath = path.join(__dirname, ".auth-secret");
    try {
        const savedSecret = fs.readFileSync(secretPath, "utf8").trim();
        if (savedSecret.length >= 32) return savedSecret;
    } catch (error) {
        if (error.code !== "ENOENT") throw error;
    }

    const generatedSecret = crypto.randomBytes(48).toString("base64url");
    try {
        fs.writeFileSync(secretPath, `${generatedSecret}\n`, { mode: 0o600, flag: "wx" });
        return generatedSecret;
    } catch (error) {
        if (error.code !== "EEXIST") throw error;
        return fs.readFileSync(secretPath, "utf8").trim();
    }
}
const AUTH_SECRET = loadAuthSecret();
if (AUTH_SECRET.length < 32) throw new Error("AUTH_SECRET must be at least 32 characters");
const AUTH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

function issueAuthToken(userId) {
    const payload = Buffer.from(JSON.stringify({
        sub: userId,
        exp: Math.floor(Date.now() / 1000) + AUTH_TOKEN_TTL_SECONDS
    })).toString("base64url");
    const signature = crypto.createHmac("sha256", AUTH_SECRET).update(payload).digest("base64url");
    return `${payload}.${signature}`;
}

function authenticate(req, res, next) {
    const authorization = req.get("authorization") || "";
    const match = authorization.match(/^Bearer ([A-Za-z0-9_.-]+)$/);
    if (!match) return res.status(401).json({ success: false, message: "Authentication required" });

    const [payload, signature, extra] = match[1].split(".");
    if (!payload || !signature || extra !== undefined) {
        return res.status(401).json({ success: false, message: "Invalid or expired authentication token" });
    }

    const expected = crypto.createHmac("sha256", AUTH_SECRET).update(payload).digest();
    let supplied;
    try {
        supplied = Buffer.from(signature, "base64url");
    } catch {
        return res.status(401).json({ success: false, message: "Invalid or expired authentication token" });
    }
    if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) {
        return res.status(401).json({ success: false, message: "Invalid or expired authentication token" });
    }

    try {
        const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
        const user = users.find(candidate => candidate.id === claims.sub);
        if (!Number.isSafeInteger(claims.sub) || !Number.isSafeInteger(claims.exp) || claims.exp <= Math.floor(Date.now() / 1000) || !user) {
            return res.status(401).json({ success: false, message: "Invalid or expired authentication token" });
        }
        req.authUser = user;
        next();
    } catch {
        return res.status(401).json({ success: false, message: "Invalid or expired authentication token" });
    }
}

function authorizeListingOwner(req, res, next) {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) {
        return res.status(400).json({ success: false, message: "Post ID is invalid" });
    }
    const post = posts.find(candidate => candidate.postId === id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });
    if (post.userId !== req.authUser.id) {
        return res.status(403).json({ success: false, message: "You are not allowed to modify this post" });
    }
    req.listing = post;
    next();
}

function publicUser(user) {
    const { password, ...safeUser } = user;
    return safeUser;
}

// =====================================
// MIDDLEWARE
// =====================================
 

// Project-এর root folder serve করবে
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Listing input is restricted to primitive, allowlisted fields. Text is trimmed,
// bounded, and rejects markup/control characters before it is persisted.
const listingFields = new Set([
    "title", "listingType", "category", "price", "condition",
    "contact", "location", "description", "image", "components"
]);
const listingTypes = new Set(["Sell", "Rent", "Project", "Lost", "Found"]);
const listingCategories = new Set([
    "Books", "Notes", "Electronics", "Lab Equipment", "Calculators",
    "Project Materials", "Others", "Lost & Found"
]);
const listingConditions = new Set(["New", "Like New", "Used", "Good", "Unknown", "Lost"]);

function cleanListingText(value, field, maxLength, required = true) {
    if (typeof value !== "string") throw new Error(`${field} must be text`);
    const clean = value.trim();
    if ((required && !clean) || clean.length > maxLength || /[<>\u0000-\u001f\u007f]/.test(clean)) {
        throw new Error(`${field} is invalid`);
    }
    return clean;
}

function validateListing(req, res, next) {
    try {
        const body = req.body;
        if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Request body must be an object");
        const keys = Object.keys(body);
        if (keys.some(key => !listingFields.has(key))) throw new Error("Unexpected input field");
        const updating = req.method === "PUT";
        const required = updating ? [] : ["title", "listingType", "category", "condition", "contact", "location", "description"];
        if (required.some(key => !Object.prototype.hasOwnProperty.call(body, key))) throw new Error("Please fill up all required fields");
        const data = {};
        for (const [field, limit] of Object.entries({ title: 120, contact: 32, location: 120, description: 3000 })) {
            if (body[field] !== undefined) data[field] = cleanListingText(body[field], field, limit, !updating || field !== "title");
        }
        if (body.components !== undefined) data.components = cleanListingText(body.components, "components", 2000, false);
        for (const [field, choices] of [["listingType", listingTypes], ["category", listingCategories], ["condition", listingConditions]]) {
            if (body[field] !== undefined) {
                const value = cleanListingText(body[field], field, 40);
                if (!choices.has(value)) throw new Error(`${field} is invalid`);
                data[field] = value;
            }
        }
        if (body.price !== undefined) {
            const price = typeof body.price === "number" ? body.price : (typeof body.price === "string" && body.price.trim() !== "" ? Number(body.price) : NaN);
            if (!Number.isFinite(price) || price < 0 || price > 100000000 || !Number.isSafeInteger(Math.round(price * 100))) throw new Error("price is invalid");
            data.price = price;
        } else if (!updating) data.price = 0;
        if (body.image !== undefined) {
            const image = cleanListingText(body.image, "image", 2048, false);
            if (image && (image.length > 2048 || !/^https:\/\//i.test(image))) throw new Error("image must be an HTTPS URL");
            data.image = image;
        } else if (!updating) data.image = "";
        const effectiveListingType = data.listingType || req.listing?.listingType || body.listingType;
        if (effectiveListingType === "Project") {
            if (!(data.description ?? req.listing?.description)) throw new Error("Project description is required");
            if (!(data.components ?? req.listing?.components)) throw new Error("Please list the project components");
            if (!(data.image ?? req.listing?.image)) throw new Error("A project photo is required");
            if ((data.price ?? req.listing?.price) === undefined) throw new Error("Project price is required");
        }
        req.validatedListing = data;
        next();
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

app.use("/css", express.static(path.join(__dirname, "css")));
app.use("/js", express.static(path.join(__dirname, "js")));
app.use("/images", express.static(path.join(__dirname, "images")));
// =====================================
// TEMPORARY DATA
// =====================================
let users = [
    {
        id: 1,
        fullName: "Towsif",
        email: "towsif@example.com",
        studentId: "PUC-1241",
        password: "$argon2id$v=19$m=65536,t=3,p=1$EQQFqezpkRyNZLLvlAv0zg$Bi1+cBFoOn09KItfPBJ7kEURlmewE5I9VANzWPZKApg",
        posts: []
    },
    {
        id: 2,
        fullName: "Sadaf",
        email: "sadaf@example.com",
        studentId: "PUC-1242",
        password: "$argon2id$v=19$m=65536,t=3,p=1$GCJSOOaa+CYrxiHR6skewg$hydVOi3/bzOJUmVmdvrJGZ/wXD1c5XCcANuPSFFMrNE",
        posts: []
    }
];

let nextId = 3;

let posts = [
    {
        postId: 1,
        userId: 1,
        authorName: "Towsif",
        title: "Selling CSE Books",
        listingType: "Sell",
        category: "Books",
        price: 500,
        condition: "Used",
        contact: "01700000000",
        location: "Chittagong",
        description: "CSE textbooks available.",
        image: "https://imgs.search.brave.com/7ne0QsX_x0rrOSDell03-MQwQueZgKRRM_P4AjLmShQ/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9zaHV0/dGVyZmx5LndpZGVu/Lm5ldC9jb250ZW50/LzV2NzBlZWQxNWsv/d2VicC9zeWVjbTEy/MDlfcGJfeWlyX2J1/bGtfcGJzXzU0NHgz/NjAud2VicD9xdWFs/aXR5PTEwMCZzZmx5/X253PTEwODgmc2Zs/eV9uaD03MjA",
        createdAt: "2026-10-18"
    },
    {
        postId: 2,
        userId: 2,
        authorName: "Sadaf",
        title: "Calculator for Rent",
        listingType: "Rent",
        category: "Electronics",
        price: 100,
        condition: "Good",
        contact: "01800000000",
        location: "Premier University",
        description: "Scientific calculator for rent.",
        image: "https://imgs.search.brave.com/RfdtryYZ5jAoX7nszoPqHiWDG69B2GTCUS4bzoA51Ks/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly90aHVt/YnMuZHJlYW1zdGlt/ZS5jb20vYi9zY2ll/bnRpZmljLWNhbGN1/bGF0b3ItbWF0aC10/ZXh0Ym9vay00NTI1/NjY4LmpwZw",
        createdAt: "2026-10-18"
    },
    {
        postId: 3,
        userId: 2,
        authorName: "Sadaf",
        title: "Lost ID Card",
        listingType: "Lost",
        category: "Lost & Found",
        price: 0,
        condition: "Lost",
        contact: "01800000000",
        location: "Campus",
        description: "University ID card lost.",
        image: "https://imgs.search.brave.com/OyAN8rP7UhuiwNtpmh7K3dsTR1-bcOuIjo_4aMh7xK8/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9lZGl0/Lm9yZy9lZGl0b3Iv/anNvbi8yMDI2LzA2/LzI1L2UvNC9lNDZk/ZmVmMDViZjAxYTU4/NDE3Y2NkNjJjMzMz/ZmI5MS53ZWJw",
        createdAt: "2026-10-18"
    }
];

let nextPostId = 4;


// =====================================
// CREATE USER - POST
// =====================================
app.use("/pages", express.static(path.join(__dirname, "pages")));

// Serve JavaScript files
app.use("/js", express.static(path.join(__dirname, "js")));

// Serve navbar and footer components
app.use("/components", express.static(path.join(__dirname, "components")));

// Homepage
app.get("/", (req, res) => {
    res.redirect("/pages/index.html");
});
 
app.post("/api/users", async (req, res) => {

    const {
        fullName,
        email,
        studentId,
        phone,
        university,
        department,
        password,
        confirmPassword,
        profileImage,
        agree
    } = req.body;


    // -----------------------------
    // Required field validation
    // -----------------------------

    if (
        !fullName ||
        !email ||
        !studentId ||
        !phone ||
        !university ||
        !department ||
        !password ||
        !confirmPassword
    ) {
        return res.status(400).json({
            success: false,
            message: "Please fill up all required fields"
        });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
        return res.status(400).json({
            success: false,
            message: "Please enter a valid email address"
        });
    }


  


    // -----------------------------
    // Password validation
    // -----------------------------

    if (password.length < 8) {
        return res.status(400).json({
            success: false,
            message: "Password must be at least 8 characters"
        });
    }


    // -----------------------------
    // Confirm password
    // -----------------------------

    if (password !== confirmPassword) {
        return res.status(400).json({
            success: false,
            message: "Passwords do not match"
        });
    }


    // -----------------------------
    // Terms validation
    // -----------------------------

    if (agree !== true) {
        return res.status(400).json({
            success: false,
            message:
                "You must agree to the Terms and Privacy Policy"
        });
    }


    // -----------------------------
    // Duplicate email
    // -----------------------------

    const emailExists = users.some(
        user =>
            user.email.toLowerCase() ===
            email.toLowerCase()
    );

    if (emailExists) {
        return res.status(409).json({
            success: false,
            message:
                "This email is already registered"
        });
    }


    // -----------------------------
    // Duplicate student ID
    // -----------------------------

    const studentIdExists = users.some(
        user =>
            user.studentId === studentId
    );

    if (studentIdExists) {
        return res.status(409).json({
            success: false,
            message:
                "This Student ID is already registered"
        });
    }


    // -----------------------------
    // Create new user
    // -----------------------------

    const newUser = {

        id: nextId++,

        fullName,

        email: email.toLowerCase(),

        studentId,

        phone,

        university,

        department,

        password: await hashPassword(password),

        profileImage:
            profileImage || "",

        agree: true,

        posts: [],

        createdAt: new Date()

    };


    // Add user
    users.push(newUser);


    // -----------------------------
    // Success response
    // -----------------------------

    res.status(201).json({

        success: true,

        message:
            "Account created successfully",

        user: publicUser(newUser)

    });

});


// =====================================
// GET ALL USERS
// =====================================

app.get("/api/users", (req, res) => {

    res.json({

        success: true,

        count: users.length,

        users: users.map(publicUser)

    });

});


// =====================================
// GET SINGLE USER
// =====================================

app.get("/api/users/:id", (req, res) => {

    const id =
        Number(req.params.id);


    const user =
        users.find(
            user => user.id === id
        );


    if (!user) {

        return res.status(404).json({

            success: false,

            message: "User not found"

        });

    }


    res.json({

        success: true,

        user: publicUser(user)

    });

});


// =====================================
// UPDATE USER - PUT
// =====================================

app.put("/api/users/:id", async (req, res) => {

    const id =
        Number(req.params.id);


    const user =
        users.find(
            user => user.id === id
        );


    if (!user) {

        return res.status(404).json({

            success: false,

            message: "User not found"

        });

    }


    const {
        fullName,
        email,
        studentId,
        phone,
        university,
        department,
        password,
        profileImage
    } = req.body;


    // -----------------------------
    // Update full name
    // -----------------------------

    if (fullName !== undefined) {

        user.fullName =
            fullName;

    }


    // -----------------------------
    // Update email
    // -----------------------------

    if (email !== undefined) {

        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(email)) {

            return res.status(400).json({

                success: false,

                message:
                    "Please enter a valid email address"

            });

        }


        const emailExists =
            users.some(
                otherUser =>
                    otherUser.id !== user.id &&
                    otherUser.email.toLowerCase() ===
                    email.toLowerCase()
            );


        if (emailExists) {

            return res.status(409).json({

                success: false,

                message:
                    "This email is already registered"

            });

        }


        user.email =
            email.toLowerCase();

    }


    // -----------------------------
    // Update student ID
    // -----------------------------

    if (studentId !== undefined) {

        const studentIdExists =
            users.some(
                otherUser =>
                    otherUser.id !== user.id &&
                    otherUser.studentId === studentId
            );


        if (studentIdExists) {

            return res.status(409).json({

                success: false,

                message:
                    "This Student ID is already registered"

            });

        }


        user.studentId =
            studentId;

    }


    // -----------------------------
    // Update phone
    // -----------------------------

    if (phone !== undefined) {

        user.phone =
            phone;

    }


    // -----------------------------
    // Update university
    // -----------------------------

    if (university !== undefined) {

        user.university =
            university;

    }


    // -----------------------------
    // Update department
    // -----------------------------

    if (department !== undefined) {

        user.department =
            department;

    }


    // -----------------------------
    // Update password
    // -----------------------------

    if (password !== undefined) {

        if (password.length < 8) {

            return res.status(400).json({

                success: false,

                message:
                    "Password must be at least 8 characters"

            });

        }


        user.password =
            await hashPassword(password);

    }


    // -----------------------------
    // Update profile image
    // -----------------------------

    if (profileImage !== undefined) {

        user.profileImage =
            profileImage;

    }


    // -----------------------------
    // Response
    // -----------------------------

    res.json({

        success: true,

        message:
            "User updated successfully",

        user: publicUser(user)

    });

});


// =====================================
// DELETE USER
// =====================================

app.delete("/api/users/:id", (req, res) => {

    const id =
        Number(req.params.id);


    const index =
        users.findIndex(
            user => user.id === id
        );


    if (index === -1) {

        return res.status(404).json({

            success: false,

            message: "User not found"

        });

    }


    const deletedUser =
        users.splice(index, 1)[0];


    res.json({

        success: true,

        message:
            "User deleted successfully",

        user: publicUser(deletedUser)

    });

});


// =====================================
// LOGIN
// =====================================

app.post("/api/login", async (req, res) => {

    const {
        email,
        password
    } = req.body;


    // -----------------------------
    // Required validation
    // -----------------------------

    if (!email || !password) {

        return res.status(400).json({

            success: false,

            message:
                "Email and password are required"

        });

    }


    // -----------------------------
    // Find user
    // -----------------------------

    const user =
        users.find(
            user =>
                user.email.toLowerCase() ===
                email.toLowerCase()
        );


    if (!user) {

        return res.status(401).json({

            success: false,

            message:
                "Invalid email or password"

        });

    }


    // -----------------------------
    // Check password
    // -----------------------------

    if (!await verifyPassword(password, user.password)) {

        return res.status(401).json({

            success: false,

            message:
                "Invalid email or password"

        });

    }


    // -----------------------------
    // Don't send password
    // -----------------------------

    const loggedInUser = {

        id: user.id,

        fullName: user.fullName,

        email: user.email,

        studentId: user.studentId,

        phone: user.phone,

        university: user.university,

        department: user.department,

        profileImage: user.profileImage

    };


    res.json({

        success: true,

        message:
            "Login successful",

        user: loggedInUser,
        token: issueAuthToken(user.id)

    });

});


// =====================================
// CREATE POST
// =====================================

app.post("/api/posts", authenticate, validateListing, (req, res) => {
    const data = req.validatedListing;
    const user = req.authUser;
    const newPost = {
        postId: nextPostId++, userId: user.id, authorName: user.fullName,
        title: data.title, listingType: data.listingType, category: data.category,
        price: data.price, condition: data.condition, contact: data.contact,
        location: data.location, description: data.description, image: data.image, components: data.components || "",
        createdAt: new Date().toLocaleString()
    };
    posts.push(newPost);
    if (!Array.isArray(user.posts)) user.posts = [];
    user.posts.push(newPost);
    res.status(201).json({ success: true, message: "Post created successfully", post: newPost });
});


// =====================================
// GET ALL POSTS
// =====================================

app.get("/api/posts", (req, res) => {

    res.json({

        success: true,

        count: posts.length,

        posts: posts

    });

});


// =====================================
// GET SINGLE POST
// =====================================

app.get("/api/posts/:id", (req, res) => {

    const id =
        Number(req.params.id);


    const post =
        posts.find(
            post =>
                post.postId === id
        );


    if (!post) {

        return res.status(404).json({

            success: false,

            message:
                "Post not found"

        });

    }


    res.json({

        success: true,

        post:
            post

    });

});


// =====================================
// UPDATE POST
// =====================================

app.put("/api/posts/:id", authenticate, authorizeListingOwner, validateListing, (req, res) => {

    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ success: false, message: "Post ID is invalid" });


    const post = req.listing;
    const postIndex = posts.findIndex(candidate => candidate.postId === id);
    const changes = req.validatedListing;


    // -----------------------------
    // Update post
    // -----------------------------

    if (!Object.keys(changes).length) return res.status(400).json({ success: false, message: "No listing fields provided" });
    Object.assign(post, changes);


    // -----------------------------
    // Update user's copy
    // -----------------------------

    const user =
        users.find(
            user =>
                String(user.id) ===
                String(post.userId)
        );


    if (
        user &&
        Array.isArray(user.posts)
    ) {

        const userPostIndex =
            user.posts.findIndex(
                userPost =>
                    userPost.postId ===
                    post.postId
            );


        if (userPostIndex !== -1) {

            user.posts[userPostIndex] =
                post;

        }

    }


    console.log(
        "Post updated:",
        post
    );


    // -----------------------------
    // Response
    // -----------------------------

    res.json({

        success: true,

        message:
            "Post updated successfully",

        post:
            post

    });

});


// =====================================
// DELETE POST
// =====================================

app.delete("/api/posts/:id", authenticate, authorizeListingOwner, (req, res) => {

    const id =
        Number(req.params.id);


    const postIndex = posts.findIndex(candidate => candidate.postId === id);
    const deletedPost = req.listing;


    // -----------------------------
    // Remove from posts array
    // -----------------------------

    posts.splice(
        postIndex,
        1
    );


    // -----------------------------
    // Remove from user's posts
    // -----------------------------

    const user =
        users.find(
            user =>
                String(user.id) ===
                String(deletedPost.userId)
        );


    if (
        user &&
        Array.isArray(user.posts)
    ) {

        user.posts =
            user.posts.filter(
                post =>
                    post.postId !==
                    deletedPost.postId
            );

    }


    console.log(
        "Post deleted:",
        deletedPost
    );


    // -----------------------------
    // Response
    // -----------------------------

    res.json({

        success: true,

        message:
            "Post deleted successfully",

        post:
            deletedPost

    });

});


// =====================================
// START SERVER
// =====================================

if (require.main === module) {
    app.listen(PORT, "0.0.0.0", () => {
        console.log("EduTrade Server Started");
        console.log(`Port: ${PORT}`);
    });
}

module.exports = app;
 // data flow 
 
