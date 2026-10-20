document.addEventListener("DOMContentLoaded", () => {

    const footerContainer =
        document.getElementById("footer-placeholder");

    if (!footerContainer) {
        console.error("Footer container not found!");
        return;
    }


    fetch("footer.html")

        .then(response => {

            if (!response.ok) {

                throw new Error(
                    `Footer loading failed: ${response.status}`
                );
            }

            return response.text();
        })

        .then(html => {

            footerContainer.innerHTML = html;


            // Current year

            const footerYear =
                document.getElementById("footerYear");

            if (footerYear) {

                footerYear.textContent =
                    new Date().getFullYear();
            }

        })

        .catch(error => {

            console.error(
                "Footer loading failed:",
                error
            );

        });

});