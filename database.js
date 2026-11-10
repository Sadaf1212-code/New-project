const { neon } = require("@neondatabase/serverless");

const samplePosts = [
    {
        key: "sample-books",
        title: "Selling CSE Books",
        listingType: "Sell",
        category: "Books",
        price: 500,
        condition: "Used",
        contact: "01700000000",
        location: "Chittagong",
        description: "CSE textbooks available.",
        image: "/images/sample-books.svg",
        components: "",
        authorName: "EduTrade"
    },
    {
        key: "sample-calculator",
        title: "Calculator for Rent",
        listingType: "Rent",
        category: "Electronics",
        price: 100,
        condition: "Good",
        contact: "01800000000",
        location: "Premier University",
        description: "Scientific calculator for rent.",
        image: "/images/sample-calculator.svg",
        components: "",
        authorName: "EduTrade"
    },
    {
        key: "sample-lost-id",
        title: "Lost ID Card",
        listingType: "Lost",
        category: "Lost & Found",
        price: 0,
        condition: "Lost",
        contact: "01800000000",
        location: "Campus",
        description: "University ID card lost.",
        image: "/images/sample-lost-id.svg",
        components: "",
        authorName: "EduTrade"
    }
];

let databaseUrl;
let sql;
let ready;

async function initialize(currentSql) {
    await currentSql.query(`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            full_name VARCHAR(100) NOT NULL,
            email VARCHAR(254) NOT NULL UNIQUE,
            student_id VARCHAR(64) NOT NULL UNIQUE,
            phone VARCHAR(32) NOT NULL,
            university VARCHAR(120) NOT NULL,
            department VARCHAR(120) NOT NULL,
            password_hash TEXT NOT NULL,
            profile_image TEXT NOT NULL DEFAULT '',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `);

    await currentSql.query(`
        CREATE TABLE IF NOT EXISTS posts (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            author_name VARCHAR(100) NOT NULL,
            title VARCHAR(120) NOT NULL,
            listing_type VARCHAR(16) NOT NULL,
            category VARCHAR(40) NOT NULL,
            price NUMERIC(12, 2) NOT NULL DEFAULT 0,
            condition VARCHAR(40) NOT NULL,
            contact VARCHAR(32) NOT NULL,
            location VARCHAR(120) NOT NULL,
            description VARCHAR(3000) NOT NULL,
            image TEXT NOT NULL DEFAULT '',
            components VARCHAR(2000) NOT NULL DEFAULT '',
            seed_key VARCHAR(64) UNIQUE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `);

    for (const post of samplePosts) {
        await currentSql.query(
            `INSERT INTO posts
                (author_name, title, listing_type, category, price, condition,
                 contact, location, description, image, components, seed_key)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             ON CONFLICT (seed_key) DO UPDATE SET image = EXCLUDED.image
             WHERE COALESCE(posts.image, '') = ''`,
            [post.authorName, post.title, post.listingType, post.category,
                post.price, post.condition, post.contact, post.location,
                post.description, post.image, post.components, post.key]
        );
    }
}

function getConnection() {
    const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!url) {
        const error = new Error("Database is not configured. Connect a Postgres database to this Vercel project.");
        error.code = "DATABASE_NOT_CONFIGURED";
        throw error;
    }

    if (url !== databaseUrl) {
        databaseUrl = url;
        sql = neon(url);
        ready = undefined;
    }
    if (!ready) {
        ready = initialize(sql).catch(error => {
            ready = undefined;
            throw error;
        });
    }
    return { sql, ready };
}

async function query(text, parameters = []) {
    const connection = getConnection();
    await connection.ready;
    return connection.sql.query(text, parameters);
}

module.exports = { query };
