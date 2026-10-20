 
document.addEventListener("DOMContentLoaded", () => {

    loadWishlist();

});


// ========================================
// LOAD WISHLIST
// ========================================

function loadWishlist() {

    const wishlistContainer =
        document.getElementById("wishlistContainer");

    const emptyWishlist =
        document.getElementById("emptyWishlist");

    const errorMessage =
        document.getElementById("errorMessage");

    const errorText =
        document.getElementById("errorText");

    const wishlistCount =
        document.getElementById("wishlistCount");


    // =====================================
    // RESET UI
    // =====================================

    wishlistContainer.innerHTML = "";

    errorMessage.classList.add("hidden");


    // =====================================
    // GET WISHLIST IDS
    // =====================================

    const wishlist =
        JSON.parse(
            localStorage.getItem("wishlist")
        ) || [];


    wishlistCount.textContent =
        wishlist.length;


    // =====================================
    // EMPTY WISHLIST
    // =====================================

    if (wishlist.length === 0) {

        emptyWishlist.classList.remove("hidden");

        wishlistContainer.classList.add("hidden");

        return;
    }


    emptyWishlist.classList.add("hidden");

    wishlistContainer.classList.remove("hidden");


    // =====================================
    // GET POSTS FROM SERVER
    // =====================================

    fetch("/api/posts")

        .then(response => {

            if (!response.ok) {

                throw new Error(
                    "Failed to load posts from server."
                );

            }

            return response.json();

        })


        .then(data => {

            console.log(
                "Posts from server:",
                data
            );


            const posts =
                data.posts || [];


            // =====================================
            // GET WISHLIST POSTS
            // =====================================

            const wishlistPosts =
                posts.filter(post =>
                    wishlist.some(
                        id =>
                            String(id) === String(post.postId)
                    )
                );


            console.log(
                "Wishlist posts:",
                wishlistPosts
            );


            // =====================================
            // REMOVE OLD / DELETED POSTS
            // =====================================

            if (wishlistPosts.length === 0) {

                emptyWishlist.classList.remove("hidden");

                wishlistContainer.classList.add("hidden");

                wishlistCount.textContent = "0";

                return;
            }


            // =====================================
            // UPDATE COUNT
            // =====================================

            wishlistCount.textContent =
                wishlistPosts.length;


            // =====================================
            // SORT LATEST FIRST
            // =====================================

            wishlistPosts.sort(
                (a, b) => b.postId - a.postId
            );


            // =====================================
            // CREATE CARDS
            // =====================================

            wishlistPosts.forEach(post => {

                createWishlistCard(
                    post,
                    wishlistContainer
                );

            });

        })


        .catch(error => {

            console.error(
                "Wishlist error:",
                error
            );


            wishlistContainer.classList.add("hidden");

            emptyWishlist.classList.add("hidden");

            errorMessage.classList.remove("hidden");

            errorText.textContent =
                error.message ||
                "Something went wrong.";

        });

}



// ========================================
// CREATE WISHLIST CARD
// ========================================

function createWishlistCard(
    post,
    container
) {

    const card =
        document.createElement("div");


    card.className =
        "bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-lg transition";


    // =====================================
    // BADGE
    // =====================================

    let badgeClass =
        "bg-gray-100 text-gray-700";


    if (post.listingType === "Sell") {

        badgeClass =
            "bg-green-100 text-green-700";

    }

    else if (post.listingType === "Rent") {

        badgeClass =
            "bg-blue-100 text-blue-700";

    }

    else if (post.listingType === "Lost") {

        badgeClass =
            "bg-red-100 text-red-700";

    }

    else if (post.listingType === "Found") {

        badgeClass =
            "bg-purple-100 text-purple-700";

    }


    // =====================================
    // PRICE
    // =====================================

    let priceHTML = "";


    if (
        post.listingType === "Sell" ||
        post.listingType === "Rent"
    ) {

        priceHTML = `
            <p class="text-xl font-bold text-green-600">
                ৳${post.price || 0}
            </p>
        `;

    }

    else {

        priceHTML = `
            <p class="text-sm text-gray-500">
                No Price
            </p>
        `;

    }


    // =====================================
    // IMAGE
    // =====================================

    const image =
        post.image ||
        "../images/default-product.jpg";


    // =====================================
    // CARD
    // =====================================

    card.innerHTML = `

        <!-- IMAGE -->

        <div class="relative w-full h-48 bg-gray-100">

            <img
                src="${image}"
                alt="${post.title || "Product"}"
                class="w-full h-full object-cover"
            >


            <!-- REMOVE WISHLIST -->

            <button
                onclick="removeFromWishlist(${post.postId})"
                title="Remove from wishlist"
                class="absolute top-3 right-3
                w-10 h-10
                bg-white
                rounded-full
                shadow-md
                flex items-center justify-center
                text-red-500
                hover:bg-red-50
                transition">

                ❤️

            </button>

        </div>



        <!-- CONTENT -->

        <div class="p-5">


            <!-- TYPE + CATEGORY -->

            <div class="flex justify-between items-center mb-3">

                <span
                    class="${badgeClass}
                    px-3 py-1
                    rounded-full
                    text-xs
                    font-semibold">

                    ${post.listingType}

                </span>


                <span class="text-xs text-gray-400">

                    ${post.category || "Others"}

                </span>

            </div>



            <!-- TITLE -->

            <h3
                class="text-lg font-bold text-gray-800 line-clamp-1">

                ${post.title || "Untitled Post"}

            </h3>



            <!-- DESCRIPTION -->

            <p
                class="text-sm text-gray-500 mt-2 line-clamp-2">

                ${post.description || "No description available."}

            </p>



            <!-- PRICE -->

            <div class="mt-4">

                ${priceHTML}

            </div>



            <!-- LOCATION -->

            <p class="text-sm text-gray-500 mt-2">

                📍 ${post.location || "Not provided"}

            </p>



            <!-- AUTHOR -->

            <p class="text-sm text-gray-500 mt-1">

                👤 ${post.authorName || "Unknown"}

            </p>



            <!-- BUTTONS -->

            <div class="flex gap-3 mt-5">


                <button
                    onclick="viewPost(${post.postId})"
                    class="flex-1
                    bg-blue-600
                    hover:bg-blue-700
                    text-white
                    py-2.5
                    rounded-lg
                    font-medium
                    transition">

                    View Details

                </button>


                <button
                    onclick="removeFromWishlist(${post.postId})"
                    class="px-4
                    border
                    border-red-200
                    text-red-500
                    hover:bg-red-50
                    rounded-lg
                    transition">

                    Remove

                </button>


            </div>

        </div>

    `;


    container.appendChild(card);

}



// ========================================
// ADD TO WISHLIST
// ========================================

function addToWishlist(postId) {

    let wishlist =
        JSON.parse(
            localStorage.getItem("wishlist")
        ) || [];


    // =====================================
    // CHECK DUPLICATE
    // =====================================

    const alreadyExists =
        wishlist.some(
            id =>
                String(id) === String(postId)
        );


    if (alreadyExists) {

        alert(
            "This item is already in your wishlist."
        );

        return;
    }


    // =====================================
    // ADD POST ID
    // =====================================

    wishlist.push(postId);


    // =====================================
    // SAVE
    // =====================================

    localStorage.setItem(
        "wishlist",
        JSON.stringify(wishlist)
    );


    alert(
        "Added to wishlist ❤️"
    );

}



// ========================================
// REMOVE FROM WISHLIST
// ========================================

function removeFromWishlist(postId) {

    let wishlist =
        JSON.parse(
            localStorage.getItem("wishlist")
        ) || [];


    // =====================================
    // REMOVE ID
    // =====================================

    wishlist =
        wishlist.filter(
            id =>
                String(id) !== String(postId)
        );


    // =====================================
    // SAVE
    // =====================================

    localStorage.setItem(
        "wishlist",
        JSON.stringify(wishlist)
    );


    // =====================================
    // REFRESH WISHLIST PAGE
    // =====================================

    loadWishlist();

}



// ========================================
// VIEW POST
// ========================================

function viewPost(postId) {

    // Save selected post

    localStorage.setItem(
        "selectedPostId",
        postId
    );


    // Go to details page

    window.location.href =
        "post-details.html";

}
 
