 
document.addEventListener("DOMContentLoaded", () => {

    // =====================================
    // ELEMENTS
    // =====================================

    const latestPosts =
        document.getElementById("latestPosts");

    const noPosts =
        document.getElementById("noPosts");


    // =====================================
    // GET POSTS FROM BACKEND
    // =====================================

    fetch("/api/posts")

        .then(response => {

            if (!response.ok) {
                throw new Error("Failed to fetch posts");
            }

            return response.json();
        })

        .then(data => {

            console.log("Posts from server:", data);

            // =================================
            // CHECK POSTS
            // =================================

            const posts = data.posts || [];

            if (posts.length === 0) {

                latestPosts.classList.add("hidden");

                noPosts.classList.remove("hidden");

                return;
            }


            // =================================
            // GET LATEST 6 POSTS
            // =================================

            const latest =
                [...posts]
                    .sort((a, b) => b.postId - a.postId)
                    .slice(0, 6);


            // =================================
            // CREATE POST CARDS
            // =================================

            latest.forEach(post => {

                const card =
                    document.createElement("div");


                card.className =
                    "bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-lg transition";


                // =================================
                // BADGE COLOR
                // =================================

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


                // =================================
                // PRICE
                // =================================

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


                // =================================
                // CARD HTML
                // =================================

                card.innerHTML = `

                    <!-- IMAGE -->

                    <div class="w-full h-48 bg-gray-100">

                        <img
                            src="${post.image || "../images/default-product.jpg"}"
                            alt="${post.title}"
                            class="w-full h-full object-cover"
                        >

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

                                ${post.category}

                            </span>

                        </div>


                        <!-- TITLE -->

                        <h3
                            class="text-lg font-bold text-gray-800 line-clamp-1">

                            ${post.title}

                        </h3>


                        <!-- DESCRIPTION -->

                        <p
                            class="text-sm text-gray-500 mt-2 line-clamp-2">

                            ${post.description}

                        </p>


                        <!-- PRICE -->

                        <div class="mt-4">

                            ${priceHTML}

                        </div>


                        <!-- LOCATION -->

                        <p class="text-sm text-gray-500 mt-2">

                            📍 ${post.location}

                        </p>


                        <!-- AUTHOR -->

                        <p class="text-sm text-gray-500 mt-1">

                            👤 ${post.authorName}

                        </p>


                        <!-- VIEW -->

                        <button
                            onclick="viewPost(${post.postId})"
                            class="w-full mt-5
                            bg-blue-600
                            hover:bg-blue-700
                            text-white
                            py-2.5
                            rounded-lg
                            font-medium
                            transition">

                            View Details

                        </button>

                    </div>

                `;


                latestPosts.appendChild(card);

            });

        })

        .catch(error => {

            console.error("Error loading posts:", error);

            latestPosts.classList.add("hidden");

            noPosts.classList.remove("hidden");

        });

});


// =========================================
// VIEW POST
// =========================================

function viewPost(postId) {

    // Save selected post ID
    localStorage.setItem(
        "selectedPostId",
        postId
    );


    // Go to details page
    window.location.href =
        "post-details.html";
}
 
